import type { Commit } from '@gitfrisky/shared-types'

export type CommitLane = {
  lane: number
  parentLanes: number[]
  activeLanes: number[] // Lanes with active branches flowing through this row
  branchOffLanes: Map<number, number> // Map of lane -> sourceLane for branches starting in this row
  hasNoParents: boolean // True if commit has no parents (final commit in branch)
  lanesFromAbove: number[] // Lanes that existed in the previous row (should draw from top)
}

export type LaneLayout = Map<string, CommitLane>

/**
 * Compute in-degree (number of children) for each commit.
 * This is used to determine when a lane can be freed.
 */
function computeInDegree(commits: Commit[]): Map<string, number> {
  const inDegree = new Map<string, number>()

  // Initialize all commits with in-degree 0
  for (const commit of commits) {
    if (!inDegree.has(commit.oid)) {
      inDegree.set(commit.oid, 0)
    }
  }

  // Count how many times each OID appears as a parent (i.e., how many children it has)
  for (const commit of commits) {
    for (const parentOid of commit.parents) {
      inDegree.set(parentOid, (inDegree.get(parentOid) || 0) + 1)
    }
  }

  return inDegree
}

/**
 * Compute lane layout for commit graph visualization
 *
 * Algorithm (based on Sugiyama framework principles):
 * 1. Compute in-degree (child count) for all commits
 * 2. For each commit (topologically sorted):
 *    a. SNAPSHOT current lane state (read-only for decisions)
 *    b. Assign commit to existing lane or allocate new one
 *    c. Assign parents to lanes (reuse existing, order to minimize crossings)
 *    d. Decrement parent in-degrees
 *    e. Free lanes when commit's in-degree reaches 0 (no more children)
 * 3. Maintain bijection: one OID per lane (no duplicates)
 * 4. Use free-list for lane recycling (stable x positions)
 */
export function computeLaneLayout(commits: Commit[]): LaneLayout {
  const layout: LaneLayout = new Map()

  // Precompute in-degree (how many children reference each commit)
  const inDegree = computeInDegree(commits)

  // Bijection maps: OID <-> lane
  let laneOfOid = new Map<string, number>() // Which lane contains which OID
  let oidOfLane = new Map<number, string>() // Which OID is in which lane

  // Lane allocation state
  let maxLane = -1 // Highest lane number allocated so far
  const freeLanes: number[] = [] // Recycled lanes (sorted ascending)
  const siblingLanesByParent = new Map<string, Set<number>>() // Track sibling lanes by parent OID

  // Previous row state (for rendering hints)
  let prevOidOfLane = new Map<number, string>()

  /**
   * Allocate a lane, preferring the suggested lane if free, otherwise reusing freed lanes,
   * otherwise allocating a new lane.
   */
  function allocateLane(preferredLane?: number): number {
    // If preferred lane is specified and free, use it
    if (preferredLane !== undefined && !oidOfLane.has(preferredLane)) {
      if (preferredLane > maxLane) {
        maxLane = preferredLane
      }
      return preferredLane
    }

    // Reuse a freed lane if available, but skip sibling lanes
    if (freeLanes.length > 0) {
      // Find first lane that's not occupied by siblings of any parent
      for (let i = 0; i < freeLanes.length; i++) {
        const lane = freeLanes[i]
        let isSiblingLane = false
        for (const siblingSet of siblingLanesByParent.values()) {
          if (siblingSet.has(lane)) {
            isSiblingLane = true
            break
          }
        }
        if (!isSiblingLane) {
          freeLanes.splice(i, 1)
          return lane
        }
      }
    }

    // Allocate a new lane
    return ++maxLane
  }

  /**
   * Free a lane (add to free list, maintain sorted order)
   */
  function freeLane(lane: number): void {
    // Insert into sorted position in freeLanes
    let i = 0
    while (i < freeLanes.length && freeLanes[i] < lane) {
      i++
    }
    // Avoid duplicates
    if (freeLanes[i] !== lane) {
      freeLanes.splice(i, 0, lane)
    }
  }

  for (const commit of commits) {
    // --- SNAPSHOT: Read-only state for decisions this row ---
    const lanesIn = new Map(laneOfOid) // OID -> lane (before mutations)
    const inverseIn = new Map(oidOfLane) // lane -> OID (before mutations)

    // 1. Place current commit
    let lane = lanesIn.get(commit.oid) // Was it pre-assigned by a child?

    if (lane === undefined) {
      // Not pre-assigned, allocate a new lane (prefer lane 0 for first commit)
      lane = allocateLane(commits.indexOf(commit) === 0 ? 0 : undefined)
    }

    // Debug logging
    // const commitShort = commit.oid.substring(0, 8)
    // console.log(`\n=== Row ${commits.indexOf(commit)}: ${commitShort} "${commit.summary.substring(0, 40)}" ===`)
    // console.log(`Lane: ${lane}`)
    // console.log(`oidOfLane BEFORE clear:`, Object.fromEntries(oidOfLane))

    // IMPORTANT: Clear current commit from lane maps before assigning parents
    // Lanes represent "what will be rendered next", not "what is at this row"
    laneOfOid.delete(commit.oid)
    oidOfLane.delete(lane)

    // 2. Determine parent lanes
    // Build list of (parentOid, desiredLane) pairs
    const parentPlacements: Array<{ oid: string; lane: number }> = []

    for (let i = 0; i < commit.parents.length; i++) {
      const parentOid = commit.parents[i]
      const existingLane = lanesIn.get(parentOid)

      if (i === 0) {
        // First parent: prefer to keep in same lane (for straight-line main branch)
        const firstParentLane = existingLane !== undefined ? existingLane : lane
        parentPlacements.push({ oid: parentOid, lane: firstParentLane })
      } else {
        // Additional parents: reuse their lane if they have one, else allocate near current
        const mergeParentLane = existingLane !== undefined ? existingLane : undefined
        parentPlacements.push({ oid: parentOid, lane: mergeParentLane ?? lane })
      }
    }

    // Simple crossing minimization: sort parents by their desired lane
    // This keeps edges from crossing unnecessarily
    parentPlacements.sort((a, b) => a.lane - b.lane)

    // 3. Assign parents to lanes (in sorted order)
    const parentLanes: number[] = []

    for (const { oid: parentOid, lane: desiredLane } of parentPlacements) {
      // Check if parent already has a lane in lanesIn (before we cleared current commit)
      const reuseLane = lanesIn.get(parentOid)

      let parentLane: number

      if (reuseLane !== undefined) {
        // Parent already has a lane, reuse it
        parentLane = reuseLane
      } else {
        // Allocate a lane for the parent, preferring the desired lane
        parentLane = allocateLane(desiredLane)
      }

      parentLanes.push(parentLane)

      // Reserve parent's lane for next rows (until parent is rendered)
      laneOfOid.set(parentOid, parentLane)
      oidOfLane.set(parentLane, parentOid)
      if (parentLane > maxLane) {
        maxLane = parentLane
      }
    }

    // 4. Free current commit's lane if it wasn't reused for a parent
    // Check if any parent was assigned to the current lane
    const laneReused = parentLanes.includes(lane)
    if (!laneReused) {
      // Check each parent's remaining children (siblings)
      for (const parentOid of commit.parents) {
        const parentInDegree = inDegree.get(parentOid) || 0

        if (parentInDegree > 1) {
          // Parent has more children coming - track this lane as a sibling lane
          if (!siblingLanesByParent.has(parentOid)) {
            siblingLanesByParent.set(parentOid, new Set())
          }
          siblingLanesByParent.get(parentOid)!.add(lane)
        } else if (parentInDegree === 1) {
          // This is the last sibling - clear all sibling lanes for this parent
          siblingLanesByParent.delete(parentOid)
        }
      }

      // Always free the lane for potential reuse
      freeLane(lane)
    }

    // console.log(`Parent lanes:`, parentLanes)
    // console.log(`oidOfLane AFTER parents:`, Object.fromEntries(oidOfLane))

    // 5. Decrement in-degree for each parent (we just processed one of their children)
    for (const parentOid of commit.parents) {
      const count = inDegree.get(parentOid) || 0
      inDegree.set(parentOid, count - 1)
    }

    // --- Compute rendering hints (activeLanes, branchOffLanes) ---

    // Active lanes: lanes that should draw through-lines
    // A lane is active if it has an OID assigned (will continue to next row)
    const activeLanes: number[] = []
    for (const [laneNum, oid] of oidOfLane.entries()) {
      // Only show through-lines for lanes that will continue
      // (i.e., lanes with OIDs that appear in future commits or as parents)
      activeLanes.push(laneNum)
    }
    activeLanes.sort((a, b) => a - b)

    // Branch-off lanes: detect when a commit branches off into a different lane from its parent
    const branchOffLanes = new Map<number, number>()

    // First, check if current commit is in a different lane from its first parent
    if (parentLanes.length > 0 && lane !== parentLanes[0]) {
      // This commit is branching off - draw curve from parent's lane to this lane
      branchOffLanes.set(lane, parentLanes[0])
    }

    // Also check for existing parent OIDs that moved lanes (for continuity/merges)
    for (const [laneNum, oid] of oidOfLane.entries()) {
      // Check if this lane existed in previous row
      const prevOid = prevOidOfLane.get(laneNum)

      if (prevOid === undefined || prevOid !== oid) {
        // Lane is new or changed - check if the OID moved from another lane
        for (const [prevLane, prevLaneOid] of prevOidOfLane.entries()) {
          if (prevLaneOid === oid) {
            // This OID was in a different lane before, mark as branch-off
            branchOffLanes.set(laneNum, prevLane)
            break
          }
        }
      }
    }

    // console.log(`Active lanes:`, activeLanes)
    // console.log(`Branch-off lanes:`, Object.fromEntries(branchOffLanes))

    // Lanes from above: ALL lanes that existed in previous row
    // (used by renderer to know which lanes should draw from top)
    const lanesFromAbove = Array.from(prevOidOfLane.keys())

    // Store layout for this commit
    layout.set(commit.oid, {
      lane,
      parentLanes,
      activeLanes,
      branchOffLanes,
      hasNoParents: commit.parents.length === 0,
      lanesFromAbove,
    })

    // Update previous row state for next iteration
    prevOidOfLane = new Map(oidOfLane)
  }

  return layout
}

/**
 * Apply lane layout to commits (mutates commit objects)
 */
export function applyLaneLayout(commits: Commit[], layout: LaneLayout): Commit[] {
  return commits.map((commit) => ({
    ...commit,
    lane: layout.get(commit.oid)?.lane ?? 0,
  }));
}