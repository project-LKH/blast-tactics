import "./Cell.css"

export function Cell({ value, owner, onClick, maxValue }) {
  const className = `cell ${value > 0 ? `player${owner}` : ""}`

  const progressPercentage = maxValue ? (value / maxValue) * 100 : 0

  return (
    <div className={className} onClick={onClick ? () => onClick() : undefined}>
      <div className="cell-content">
        <span className="cell-value">{value > 0 ? value : ""}</span>
        {value > 0 && (
          <div
            className="cell-progress"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: owner === 1 ? "rgba(211, 47, 47, 0.3)" : "rgba(25, 118, 210, 0.3)",
            }}
          />
        )}
      </div>
    </div>
  )
}
