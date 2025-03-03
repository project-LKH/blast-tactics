import { useState, useEffect, useCallback } from "react";
import { Cell } from "./Cell";
import "./Game.css";

const API_URL = "https://blast-tactics-backend.vercel.app";

export function OnlineGame({ rows, cols, gameId }) {
  const [grid, setGrid] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [playerId, setPlayerId] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

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
    if (isPolling || gameOver) return;
    setIsPolling(true);

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
        break;
      }
    }
    
    setIsPolling(false);
  }, [gameId, gameOver, isPolling]);

  const joinGame = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/join-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const data = await response.json();
      setPlayerId(data.playerId);
      await fetchGameState();
      longPollGameState();
    } catch (error) {
      console.error("Error joining game:", error);
    }
  }, [gameId, fetchGameState, longPollGameState]);

  useEffect(() => {
    joinGame();
  }, [joinGame]);

  const handleCellClick = async (row, col) => {
    if (gameOver || playerId !== currentPlayer) return;

    try {
      const response = await fetch(`${API_URL}/make-move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, playerId, row, col }),
      });

      if (response.ok) {
        fetchGameState();
      }
    } catch (error) {
      console.error("Error making move:", error);
    }
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
      {gameOver && <div className="game-over"><div className={`winner player${winner}`}>Player {winner} wins!</div></div>}
    </div>
  );
}
