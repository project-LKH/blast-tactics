import { useState } from "react";
import { Cell } from "./Cell";
import "./Game.css";

export function OfflineGame({ rows, cols }) {
  const [grid, setGrid] = useState(
    Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => ({ value: 0, owner: null })))
  );
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [moves, setMoves] = useState({ 1: 0, 2: 0 }); // Tracks moves for both players

  const handleCellClick = (row, col) => {
    if (gameOver) return;

    const newGrid = JSON.parse(JSON.stringify(grid));

    if (newGrid[row][col].owner !== null && newGrid[row][col].owner !== currentPlayer) return;

    newGrid[row][col].value++;
    newGrid[row][col].owner = currentPlayer;

    setMoves((prev) => ({ ...prev, [currentPlayer]: prev[currentPlayer] + 1 })); // Track move

    resolveExplosions(newGrid);
    setGrid(newGrid);
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  };

  const resolveExplosions = (newGrid) => {
    let hasExploded = true;

    while (hasExploded) {
      hasExploded = false;
      const explosionQueue = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = newGrid[r][c];
          const maxCapacity = getMaxCapacity(r, c);

          if (cell.value >= maxCapacity) {
            explosionQueue.push({ r, c, owner: cell.owner });
          }
        }
      }

      if (explosionQueue.length === 0) {
        break;
      }

      hasExploded = true;

      explosionQueue.forEach(({ r, c, owner }) => {
        const cell = newGrid[r][c];
        const maxCapacity = getMaxCapacity(r, c);

        cell.value -= maxCapacity;
        if (cell.value === 0) cell.owner = null;

        const neighbors = getNeighbors(r, c);
        neighbors.forEach(([nr, nc]) => {
          newGrid[nr][nc].value++;
          newGrid[nr][nc].owner = owner;
        });
      });
    }

    setTimeout(() => checkGameOver(newGrid), 100);
  };

  const checkGameOver = (newGrid) => {
    if (moves[1] === 0 || moves[2] === 0) return; // Ensure both players have played at least once

    const playerCells = new Set();
    newGrid.forEach(row =>
      row.forEach(cell => {
        if (cell.owner !== null) playerCells.add(cell.owner);
      })
    );

    if (playerCells.size === 1) {
      setGameOver(true);
      setWinner([...playerCells][0]);
    }
  };

  /** Returns the max capacity of a cell before it explodes */
  const getMaxCapacity = (row, col) => {
    let maxCapacity = 4; // Default for inner cells

    // Edge cases for corners
    if ((row === 0 && col === 0) || (row === 0 && col === cols - 1) ||
      (row === rows - 1 && col === 0) || (row === rows - 1 && col === cols - 1)) {
      return 2; // Corners hold max 2 before explosion
    }

    // Edge cases for edges
    if (row === 0 || row === rows - 1 || col === 0 || col === cols - 1) {
      return 3; // Edges hold max 3 before explosion
    }

    return maxCapacity; // Default: 4 (inner cells)
  };

  /** Returns an array of neighboring cell positions */
  const getNeighbors = (row, col) => {
    const neighbors = [];

    if (row > 0) neighbors.push([row - 1, col]); // Up
    if (row < rows - 1) neighbors.push([row + 1, col]); // Down
    if (col > 0) neighbors.push([row, col - 1]); // Left
    if (col < cols - 1) neighbors.push([row, col + 1]); // Right

    return neighbors;
  };

  return (
    <div className="game-container">
      <div
        className={`grid player${currentPlayer}-turn`}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              value={cell.value}
              owner={cell.owner}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
      {gameOver && (
        <div className="game-over">
          <div className={`winner player${winner}`}>Player {winner} wins!</div>
          <button
            className="bg-gray-500 text-white px-4 py-2 mt-4 rounded"
            onClick={() => window.location.href = "/"}
          >
            Return to Home
          </button>
        </div>
      )}


    </div>
  );
}
