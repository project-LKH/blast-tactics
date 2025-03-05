import { useState, useEffect, useCallback, useRef } from "react";
import { Cell } from "./Cell";
import "./Game.css";

export function OnlineGame({ rows, cols, gameId, supabase }) {
  const [grid, setGrid] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [playerId, setPlayerId] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const isWaitingForMove = useRef(false);

  // Fetch game state from Supabase
  const fetchGameState = useCallback(async () => {
    const { data, error } = await supabase
      .from('games')
      .select('grid, current_player, game_over, winner')
      .eq('id', gameId)
      .single();

    if (error) {
      console.error("Error fetching game state:", error);
      return;
    }

    setGrid(data.grid);
    setCurrentPlayer(data.current_player);
    setGameOver(data.game_over);
    setWinner(data.winner);
  }, [gameId, supabase]);

  // Set up real-time subscription to game state changes
  useEffect(() => {
    const gameSubscription = supabase
      .from(`games:id=eq.${gameId}`)
      .on('UPDATE', (payload) => {
        const updatedData = payload.new;
        setGrid(updatedData.grid);
        setCurrentPlayer(updatedData.current_player);
        setGameOver(updatedData.game_over);
        setWinner(updatedData.winner);
      })
      .subscribe();

    // Clean up subscription on component unmount
    return () => {
      supabase.removeSubscription(gameSubscription);
    };
  }, [gameId, supabase]);

  // Handle the move logic, making the API call to the edge function
  const handleCellClick = async (row, col) => {
    if (gameOver || playerId !== currentPlayer || isWaitingForMove.current) return;
    isWaitingForMove.current = true;

    try {
      const response = await fetch('https://wcxzsrbcpveavqyigoyb.supabase.co/functions/v1/make-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          playerId,
          move: { row, col },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to make the move');
      }

      const { gameState } = await response.json();
      setGrid(gameState.grid);
      setCurrentPlayer(gameState.current_player);
      setGameOver(gameState.game_over);
      setWinner(gameState.winner);

    } catch (error) {
      console.error("Error making move:", error);
    } finally {
      isWaitingForMove.current = false;
    }
  };

  const restartGame = async () => {
    try {
      const { error } = await supabase
        .from('games')
        .update({
          grid: Array(rows).fill(Array(cols).fill(0)), // Reset the grid
          game_over: false,
          winner: null,
          current_player: 1, // Set the starting player
        })
        .eq('id', gameId);

      if (error) throw new Error(error.message);

      setGameOver(false);
      setWinner(null);
      fetchGameState(); // Refresh game state
    } catch (error) {
      console.error("Error restarting game:", error);
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

      {gameOver && (
        <div className="game-over">
          <div className={`winner player${winner}`}>Player {winner} wins!</div>
          <div className="button-container">
            <button className="play-again" onClick={restartGame}>
              Play Again
            </button>
            <button className="back-home" onClick={() => window.location.reload()}>
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
