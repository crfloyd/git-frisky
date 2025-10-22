import type { Commit } from '@gitfrisky/shared-types'

export type CommitLane = {
  lane: number
  parentLanes: number[]
  activeLanes: number[] // Lanes with active branches flowing through this row
  branchOffLanes: Map<number, number> // Map of lane -> sourceLane for branches starting in this row
  hasNoParents: boolean // True if commit has no parents (final commit in branch)
}

export type LaneLayout = Map<string, CommitLane>

/**
 * Compute lane layout for commit graph visualization
 *
 * Algorithm:
 * 1. Process commits in order (already topologically sorted from backend)
 * 2. Track active lanes (which commit OID is in which lane)
 * 3. Assign first parent to same lane, additional parents to new lanes
 * 4. Free lanes when commit has no more children
 * 5. Track which lanes are active at each row (for through-line rendering)
 */
export function computeLaneLayout(commits: Commit[]): LaneLayout {
  const layout: LaneLayout = new Map()
  const lanes: (string | null)[] = [] // Track which commit is in each lane
  let prevActiveLanes: number[] = [] // Track previous row's active lanes

  for (const commit of commits) {
    // Find lane for this commit (was it already assigned by a child?)
    let lane = lanes.findIndex(oid => oid === commit.oid)

    if (lane < 0) {
      // Not assigned yet - allocate new lane (prefer empty slots)
      lane = lanes.indexOf(null)
      if (lane < 0) {
        lane = lanes.length
        lanes.push(null)
      }
    }

    // CRITICAL: Clear ALL other lanes that contain this commit (merge cleanup)
    // When multiple children point to the same parent, the parent OID ends up in
    // multiple lanes. We need to clear all of them except the lane we're using.
    lanes.forEach((oid, idx) => {
      if (oid === commit.oid && idx !== lane) {
        lanes[idx] = null
      }
    })

    // Track parent lanes for merge line rendering
    const parentLanes: number[] = []

    // Assign parents to lanes
    commit.parents.forEach((parentOid, index) => {
      if (index === 0) {
        // First parent: check if already assigned by another child
        const existingLane = lanes.findIndex(oid => oid === parentOid)

        if (existingLane >= 0) {
          // Parent already assigned - use that lane for connection
          parentLanes.push(existingLane)
        } else {
          // Parent not assigned yet - assign to current lane
          lanes[lane] = parentOid
          parentLanes.push(lane)
        }
      } else {
        // Additional parents (merges) get new lanes
        let parentLane = lanes.indexOf(null)
        if (parentLane < 0) {
          parentLane = lanes.length
          lanes.push(null)
        }
        lanes[parentLane] = parentOid
        parentLanes.push(parentLane)
      }
    })

    // Track which lanes are currently active (not null) AFTER parent assignments
    // These lanes need through-lines drawn in this row (branches continuing down)
    // NOTE: Compute activeLanes BEFORE clearing lane for commits with no parents,
    // so that the final commit in a branch gets a through-line connecting to it from above
    const activeLanes = lanes
      .map((oid, idx) => (oid !== null ? idx : -1))
      .filter(idx => idx >= 0)

    // If no parents, free this lane (for commits below this one)
    if (commit.parents.length === 0) {
      lanes[lane] = null
    }

    // Detect branch-offs: lanes that are newly active (not in previous row)
    const branchOffLanes = new Map<number, number>()
    activeLanes.forEach(laneIdx => {
      if (!prevActiveLanes.includes(laneIdx)) {
        // This lane is new - it's branching off
        // Find which lane it's branching from by looking for the parent OID
        const parentOid = lanes[laneIdx]
        if (parentOid) {
          // Check if this parent OID exists in any PREVIOUS lane (assigned by another child)
          const sourceLane = prevActiveLanes.find(prevLane => lanes[prevLane] === parentOid)
          if (sourceLane !== undefined) {
            // This lane branches off from sourceLane
            branchOffLanes.set(laneIdx, sourceLane)
          }
        }
      }
    })

    // Store layout for this commit
    layout.set(commit.oid, {
      lane,
      parentLanes,
      activeLanes,
      branchOffLanes,
      hasNoParents: commit.parents.length === 0
    })

    // Update previous active lanes for next iteration
    prevActiveLanes = activeLanes
  }

  return layout
}

/**
 * Apply lane layout to commits (mutates commit objects)
 */
export function applyLaneLayout(commits: Commit[], layout: LaneLayout): Commit[] {
  return commits.map(commit => ({
    ...commit,
    lane: layout.get(commit.oid)?.lane ?? 0,
  }))
}
