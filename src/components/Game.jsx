import { useState, useEffect } from "react"
import { Cell } from "./Cell"
import "./Game.css"

const ANIMATION_DELAY = 100 // milliseconds

export function ChainReactionGame({ rows, cols }) {
  const [grid, setGrid] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [bothPlayersMovedOnce, setBothPlayersMovedOnce] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Initialize the grid
  useEffect(() => {
    const initialGrid = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({ value: 0, owner: null })),
      )
    setGrid(initialGrid)
  }, [rows, cols])

  // Get the number of neighbors for a cell
  const getNeighborCount = (row, col) => {
    let count = 0
    if (row > 0) count++
    if (row < rows - 1) count++
    if (col > 0) count++
    if (col < cols - 1) count++
    return count
  }

  // Get all neighbors for a cell
  const getNeighbors = (row, col) => {
    const neighbors = []
    if (row > 0) neighbors.push({ row: row - 1, col })
    if (row < rows - 1) neighbors.push({ row: row + 1, col })
    if (col > 0) neighbors.push({ row, col: col - 1 })
    if (col < cols - 1) neighbors.push({ row, col: col + 1 })
    return neighbors
  }

  // Process chain reactions with animation
  const processChainReaction = async (newGrid, row, col, player) => {
    const queue = [{ row, col }]

    while (queue.length > 0) {
      const current = queue.shift()
      const { row: currentRow, col: currentCol } = current
      const cell = newGrid[currentRow][currentCol]
      const neighborCount = getNeighborCount(currentRow, currentCol)

      if (cell.value >= neighborCount) {
        // Reset the current cell
        cell.value = 0
        cell.owner = null

        // Update the grid and wait for the animation
        setGrid([...newGrid])
        await new Promise((resolve) => setTimeout(resolve, ANIMATION_DELAY))

        // Increment neighbors
        const neighbors = getNeighbors(currentRow, currentCol)
        for (const { row: nRow, col: nCol } of neighbors) {
          newGrid[nRow][nCol].value++
          newGrid[nRow][nCol].owner = player

          // Update the grid and wait for the animation
          setGrid([...newGrid])
          await new Promise((resolve) => setTimeout(resolve, ANIMATION_DELAY))

          // Check if this neighbor needs to explode
          if (newGrid[nRow][nCol].value >= getNeighborCount(nRow, nCol)) {
            queue.push({ row: nRow, col: nCol })
          }
        }
      }
    }

    return newGrid
  }

  // Handle cell click
  const handleCellClick = async (row, col) => {
    if (gameOver || isAnimating) return

    const cell = grid[row][col]

    // Can only click empty cells or cells owned by the current player
    if (cell.owner !== null && cell.owner !== currentPlayer) return

    setIsAnimating(true)

    // Create a deep copy of the grid
    const newGrid = JSON.parse(JSON.stringify(grid))

    // Increment the cell value
    newGrid[row][col].value++
    newGrid[row][col].owner = currentPlayer

    // Update the grid and wait for the animation
    setGrid(newGrid)
    await new Promise((resolve) => setTimeout(resolve, ANIMATION_DELAY))

    // Check if the cell should explode
    const neighborCount = getNeighborCount(row, col)
    if (newGrid[row][col].value >= neighborCount) {
      await processChainReaction(newGrid, row, col, currentPlayer)
    }

    // Track if both players have made a move
    if (!bothPlayersMovedOnce) {
      if (currentPlayer === 2) {
        setBothPlayersMovedOnce(true)
      }
    }

    // Check for a winner
    if (bothPlayersMovedOnce) {
      const activePlayers = new Set()
      newGrid.forEach((row) => {
        row.forEach((cell) => {
          if (cell.owner !== null) {
            activePlayers.add(cell.owner)
          }
        })
      })

      if (activePlayers.size === 1 && newGrid.some((row) => row.some((cell) => cell.value > 0))) {
        setGameOver(true)
        setWinner(Array.from(activePlayers)[0])
      }
    }

    // Switch player
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
    setGrid(newGrid)
    setIsAnimating(false)
  }

  // Reset the game
  const resetGame = () => {
    const initialGrid = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({ value: 0, owner: null })),
      )
    setGrid(initialGrid)
    setCurrentPlayer(1)
    setGameOver(false)
    setWinner(null)
    setBothPlayersMovedOnce(false)
    setIsAnimating(false)
  }

  if (grid.length === 0) return <div>Loading...</div>

  return (
    <div className="game-container">
      <div
        className={`grid player${currentPlayer}-turn`}
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              value={cell.value}
              owner={cell.owner}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              maxValue={getNeighborCount(rowIndex, colIndex)}
            />
          )),
        )}
        {gameOver && (
          <div className="game-over">
            <div className={`winner player${winner}`}>Player {winner} wins!</div>
            <button className="reset-button" onClick={resetGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

