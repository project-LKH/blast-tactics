import "./Cell.css"

export function Cell({ value, owner, onClick, maxValue }) {
  const getClassName = () => {
    let className = "cell"
    if (value > 0) {
      className += ` player${owner}`
    }
    return className
  }

  const getValueDisplay = () => {
    if (value === 0) return ""
    return value.toString()
  }

  const getProgressPercentage = () => {
    if (maxValue === 0) return 0
    return (value / maxValue) * 100
  }

  return (
    <div className={getClassName()} onClick={onClick}>
      <div className="cell-content">
        <span className="cell-value">{getValueDisplay()}</span>
        {value > 0 && (
          <div
            className="cell-progress"
            style={{
              width: `${getProgressPercentage()}%`,
              backgroundColor: owner === 1 ? "rgba(211, 47, 47, 0.3)" : "rgba(25, 118, 210, 0.3)",
            }}
          />
        )}
      </div>
    </div>
  )
}

