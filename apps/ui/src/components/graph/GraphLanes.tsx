import { useMemo } from 'react'

type GraphLanesProps = {
  currentLane: number
  parentLanes: number[]
  activeLanes: number[] // Lanes with active branches flowing through
  branchOffLanes: Map<number, number> // Map of lane -> sourceLane for branches starting here
  maxLane: number
  commitOid: string
  containerWidth?: number // Optional: actual container width for viewBox
  isFirstRow: boolean // Is this the first visible row?
  hasNoParents: boolean // Does this commit have no parents? (final commit in branch)
}

const LANE_WIDTH = 16
const ROW_HEIGHT = 44
const DOT_SIZE = 8
const LINE_WIDTH = 1.5

// Lane color palette - 6 distinct colors (rotate through them)
const LANE_COLORS = [
  '#5D9AEE', // Accent Blue
  '#5FB67A', // Success Green
  '#E5C07B', // Warning Orange
  '#E06C75', // Danger Red
  '#66B3D9', // Info Cyan
  '#A87CE3', // Purple
]

function getLaneColor(lane: number): string {
  return LANE_COLORS[lane % LANE_COLORS.length]
}

export function GraphLanes({
  currentLane,
  parentLanes,
  activeLanes,
  branchOffLanes,
  maxLane,
  commitOid,
  containerWidth,
  isFirstRow,
  hasNoParents,
}: GraphLanesProps) {
  // Calculate viewBox width - use containerWidth if provided (for compressed layouts)
  // Otherwise calculate natural width
  const naturalWidth = (maxLane + 1) * LANE_WIDTH
  const graphWidth = containerWidth || Math.max(naturalWidth, 120)

  // Calculate effective lane width (compressed if needed)
  const effectiveLaneWidth = containerWidth && naturalWidth > containerWidth
    ? containerWidth / (maxLane + 1)
    : LANE_WIDTH

  // Memoize SVG paths to avoid recalculating on every render
  const paths = useMemo(() => {
    const elements: JSX.Element[] = []
    const centerY = ROW_HEIGHT / 2

    // 1. Draw through-lines for ALL active lanes (branches flowing through this row)
    activeLanes.forEach(lane => {
      const x = lane * effectiveLaneWidth + effectiveLaneWidth / 2
      const color = getLaneColor(lane)

      // Check if this lane is branching off (newly started)
      const sourceLane = branchOffLanes.get(lane)

      if (sourceLane !== undefined) {
        // This lane is branching off - draw a curve from source lane
        const startX = sourceLane * effectiveLaneWidth + effectiveLaneWidth / 2
        const endX = x
        // Curve from top (y=0 or centerY if first row) at sourceLane to bottom at this lane
        const startY = isFirstRow ? centerY : 0
        const controlY1 = startY + (ROW_HEIGHT - startY) * 0.4
        const controlY2 = startY + (ROW_HEIGHT - startY) * 0.6
        const path = `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${ROW_HEIGHT}`

        elements.push(
          <path
            key={`branchoff-${lane}`}
            d={path}
            stroke={color}
            strokeWidth={LINE_WIDTH}
            fill="none"
            strokeLinecap="round"
            opacity={0.8}
          />
        )
      } else {
        // Normal through-line (straight)
        // If first row, only draw from center to bottom (no line above)
        // If no parents, only draw from top to center (no line below)
        const startY = isFirstRow ? centerY : 0
        const endY = hasNoParents ? centerY : ROW_HEIGHT
        elements.push(
          <line
            key={`through-${lane}`}
            x1={x}
            y1={startY}
            x2={x}
            y2={endY}
            stroke={color}
            strokeWidth={LINE_WIDTH}
            strokeLinecap="round"
            opacity={0.8}
          />
        )
      }
    })

    // 2. Draw parent connection curves (these overlay the through-lines)
    parentLanes.forEach((parentLane, index) => {
      const startX = currentLane * effectiveLaneWidth + effectiveLaneWidth / 2
      const endX = parentLane * effectiveLaneWidth + effectiveLaneWidth / 2
      const color = getLaneColor(currentLane)

      if (parentLane === currentLane) {
        // Straight line to same lane (already drawn by through-line, skip)
      } else {
        // Bezier curve to different lane (merge)
        // Control points for smooth curve (40%/60% per design spec)
        const controlY1 = centerY + (ROW_HEIGHT - centerY) * 0.4
        const controlY2 = centerY + (ROW_HEIGHT - centerY) * 0.6
        const path = `M ${startX} ${centerY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${ROW_HEIGHT}`

        elements.push(
          <path
            key={`merge-${index}`}
            d={path}
            stroke={color}
            strokeWidth={LINE_WIDTH}
            fill="none"
            strokeLinecap="round"
          />
        )
      }
    })

    return elements
  }, [currentLane, parentLanes, activeLanes, branchOffLanes, effectiveLaneWidth, isFirstRow, hasNoParents])

  // Dot position and color
  const dotX = currentLane * effectiveLaneWidth + effectiveLaneWidth / 2
  const dotY = ROW_HEIGHT / 2
  const dotColor = getLaneColor(currentLane)

  return (
    <svg
      width="100%"
      height={ROW_HEIGHT}
      viewBox={`0 0 ${graphWidth} ${ROW_HEIGHT}`}
      preserveAspectRatio="xMinYMid meet"
      className="overflow-visible"
    >
      {/* Render through-lines and parent connection curves */}
      {paths}

      {/* Render commit dot with outline for contrast */}
      <circle
        cx={dotX}
        cy={dotY}
        r={DOT_SIZE / 2}
        fill={dotColor}
        stroke="var(--color-base)"
        strokeWidth={1.5}
      />
    </svg>
  )
}
