import { useState, useEffect } from "react"
import { Cell } from "./Cell"
import "./Game.css"

const API_URL = "https://blast-tactics-backend.vercel.app" // Change for deployment

export function ChainReactionGame({ rows, cols, gameId }) {
  const [grid, setGrid] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState(null)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (gameId) {
      fetchGameState()
      const interval = setInterval(fetchGameState, 2000) // Poll every 2 seconds
      return () => clearInterval(interval)
    } else {
      initializeLocalGame()
    }
  }, [gameId])

  const initializeLocalGame = () => {
    const initialGrid = Array(rows).fill(null).map(() =>
      Array(cols).fill(null).map(() => ({ value: 0, owner: null }))
    )
    setGrid(initialGrid)
  }

  const fetchGameState = async () => {
    try {
      const response = await fetch(`${API_URL}/game-state/${gameId}`)
      const data = await response.json()
      setGrid(data.gameState.grid)
      setCurrentPlayer(data.gameState.currentPlayer)
      setGameOver(data.gameState.gameOver)
      setWinner(data.gameState.winner)
    } catch (error) {
      console.error("Error fetching game state:", error)
    }
  }

  const sendMoveToServer = async (row, col) => {
    try {
      const response = await fetch(`${API_URL}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, row, col, player: currentPlayer }),
      })
      await response.json()
      fetchGameState()
    } catch (error) {
      console.error("Error sending move:", error)
    }
  }

  const handleCellClick = async (row, col) => {
    if (gameOver || isAnimating) return
    if (gameId) {
      await sendMoveToServer(row, col)
    } else {
      handleLocalMove(row, col)
    }
  }

  const handleLocalMove = (row, col) => {
    const newGrid = JSON.parse(JSON.stringify(grid))
    newGrid[row][col].value++
    newGrid[row][col].owner = currentPlayer
    setGrid(newGrid)
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
  }

  return (
    <div className="game-container">
      <div className={`grid player${currentPlayer}-turn`}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell key={`${rowIndex}-${colIndex}`} value={cell.value} owner={cell.owner}
              onClick={() => handleCellClick(rowIndex, colIndex)} />
          ))
        )}
        {gameOver && (
          <div className="game-over">
            <div className={`winner player${winner}`}>Player {winner} wins!</div>
          </div>
        )}
      </div>
    </div>
  )
}
