import { useState, useEffect, useCallback } from "react";
import { OnlineGame } from "./OnlineGame"; // Assume this is your OnlineGame component
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wcxzsrbcpveavqyigoyb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeHpzcmJjcHZlYXZxeWlnb3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExNjc2MzAsImV4cCI6MjA1Njc0MzYzMH0.4O2UgxYCBE6H-LYrU4CFmAlCSvbdz7ZvFtAjDAEapS4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function Home() {
  const [gameId, setGameId] = useState(null);
  const [isGameCreated, setIsGameCreated] = useState(false);
  const [isWaitingForPlayer, setIsWaitingForPlayer] = useState(false);
  const [grid, setGrid] = useState([]);
  const [players, setPlayers] = useState([]);

  // Generate a 6x6 grid
  const generateGrid = () => {
    const newGrid = [];
    for (let i = 0; i < 6; i++) {
      const row = [];
      for (let j = 0; j < 6; j++) {
        row.push({ value: 0, owner: 0, maxValue: 100 });
      }
      newGrid.push(row);
    }
    return newGrid;
  };

  // Create a new game (add first player)
  const createGame = useCallback(async () => {
    try {
      const newGrid = generateGrid(); // Generate the initial grid
      const response = await fetch('https://wcxzsrbcpveavqyigoyb.supabase.co/functions/v1/create-game', { // Call the edge function
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grid: newGrid, players: ['player1'], current_player: 1, game_over: false })
      });

      if (!response.ok) {
        console.error('Error creating game');
        return;
      }

      const { gameId } = await response.json(); // Get gameId from the response
      setGameId(gameId);
      setIsGameCreated(true);
      setGrid(newGrid);
      setPlayers(['player1']); // Add only the first player
    } catch (error) {
      console.error('Error creating game:', error);
    }
  }, []);

  // Join an existing game (add the second player)
  const joinGame = useCallback(async (gameId) => {
    try {
      const response = await fetch('https://wcxzsrbcpveavqyigoyb.supabase.co/functions/v1/join-game', { // Call the edge function
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, playerId: 'player2' })
      });

      if (!response.ok) {
        console.error('Error joining game');
        return;
      }

      const { updatedGrid, updatedPlayers } = await response.json(); // Get updated grid and players from the response
      setPlayers(updatedPlayers); // Add the second player
      setIsWaitingForPlayer(false);
      setGrid(updatedGrid); // Fetch and update the grid
    } catch (error) {
      console.error('Error joining game:', error);
    }
  }, []);

  useEffect(() => {
    if (gameId) {
      setIsWaitingForPlayer(true);
      joinGame(gameId); // Try joining the game once the gameId is available
    }
  }, [gameId, joinGame]);

  return (
    <div className="home-container">
      <h1>Welcome to the Game</h1>
      {isGameCreated ? (
        <div>
          <h2>Game ID: {gameId}</h2>
          {isWaitingForPlayer ? (
            <p>Waiting for the second player to join...</p>
          ) : (
            <OnlineGame gameId={gameId} grid={grid} players={players} />
          )}
        </div>
      ) : (
        <div>
          <button onClick={createGame}>Create Game</button>
        </div>
      )}
    </div>
  );
}
