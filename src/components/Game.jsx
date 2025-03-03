import { useState, useEffect, useCallback } from "react";
import { Cell } from "./Cell";
import "./Game.css";

const API_URL = "https://blast-tactics-backend.vercel.app";

export function ChainReactionGame({ rows, cols, gameId, isOffline }) {
  const [grid, setGrid] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [playerId, setPlayerId] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);

  const initializeLocalGame = useCallback(() => {
    const initialGrid = Array(rows)
      .fill(null)
      .map(() =>
        Array(cols).fill(null).map(() => ({ value: 0, owner: null }))
      );

    setGrid(initialGrid);
    setCurrentPlayer(1);
    setGameOver(false);
    setWinner(null);
  }, [rows, cols]);

  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/game-state/${gameId}`);
      const data = await response.json();
      setGrid(data.gameState.grid);
      setCurrentPlayer(data.gameState.currentPlayer);
      setGameOver(data.gameState.gameOver);
      setWinner(data.gameState.winner);
    } catch (error) {
      console.error("Error fetching game state:", error);
    }
  }, [gameId]);

  const longPollGameState = useCallback(async () => {
    while (!gameOver) {
      try {
        const response = await fetch(`${API_URL}/wait-for-update/${gameId}`);
        if (response.status === 204) continue;
        const data = await response.json();
        setGrid(data.gameState.grid);
        setCurrentPlayer(data.gameState.currentPlayer);
        setGameOver(data.gameState.gameOver);
        setWinner(data.gameState.winner);
      } catch (error) {
        console.error("Long polling error:", error);
      }
    }
  }, [gameOver, gameId]);

  const joinGame = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/join-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setPlayerId(data.playerId);
      await fetchGameState();
      await longPollGameState();
    } catch (error) {
      console.error("Error joining game:", error);
    }
  }, [gameId, fetchGameState, longPollGameState]);

  useEffect(() => {
    if (gameId && !isOffline) {
      joinGame();
    } else {
      initializeLocalGame();
    }
  }, [gameId, isOffline, joinGame, initializeLocalGame]);

  const sendMoveToServer = async (row, col) => {
    if (gameOver || isWaiting || currentPlayer !== playerId) return;

    setIsWaiting(true);
    try {
      await fetch(`${API_URL}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, row, col, player: playerId }),
      });
    } catch (error) {
      console.error("Error sending move:", error);
    }
    setIsWaiting(false);
  };

  const handleCellClick = async (row, col) => {
    if (gameOver) return;
    if (gameId && !isOffline) {
      await sendMoveToServer(row, col);
    } else {
      handleLocalMove(row, col);
    }
  };

  const handleLocalMove = (row, col) => {
    if (gameOver) return;

    const newGrid = JSON.parse(JSON.stringify(grid));

    if (newGrid[row][col].owner !== null && newGrid[row][col].owner !== currentPlayer) return;

    newGrid[row][col].value++;
    newGrid[row][col].owner = currentPlayer;

    resolveExplosions(newGrid);

    setGrid(newGrid);
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
  };

  const resolveExplosions = (newGrid) => {
    let hasExploded = true;

    while (hasExploded) {
      hasExploded = false;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = newGrid[r][c];
          const maxCapacity = getMaxCapacity(r, c);

          if (cell.value >= maxCapacity) {
            hasExploded = true;
            cell.value -= maxCapacity;

            const neighbors = getNeighbors(r, c);
            neighbors.forEach(([nr, nc]) => {
              newGrid[nr][nc].value++;
              newGrid[nr][nc].owner = cell.owner;
            });

            checkGameOver(newGrid);
          }
        }
      }
    }
  };

  const getMaxCapacity = (r, c) => {
    let maxCapacity = 4;
    if (r === 0 || r === rows - 1) maxCapacity--;
    if (c === 0 || c === cols - 1) maxCapacity--;
    return maxCapacity;
  };

  const getNeighbors = (r, c) => {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ];
    return directions
      .map(([dr, dc]) => [r + dr, c + dc])
      .filter(([nr, nc]) => nr >= 0 && nr < rows && nc >= 0 && nc < cols);
  };

  const checkGameOver = (newGrid) => {
    const playerCells = new Set();
    for (let row of newGrid) {
      for (let cell of row) {
        if (cell.owner !== null) playerCells.add(cell.owner);
      }
    }
    if (playerCells.size === 1) {
      setGameOver(true);
      setWinner([...playerCells][0]);
    }
  };

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
            />
          ))
        )}
      </div>
      {gameOver && (
        <div className="game-over">
          <div className={`winner player${winner}`}>Player {winner} wins!</div>
        </div>
      )}
    </div>
  );
}
