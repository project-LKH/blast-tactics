import { useState, useEffect } from "react";
import { ChainReactionGame } from "./Game";

const API_URL = "https://blast-tactics-backend.vercel.app";

export default function Home() {
  const [gameId, setGameId] = useState(null);
  const [inputGameId, setInputGameId] = useState("");
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [playerJoined, setPlayerJoined] = useState(false);

  const createGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/create-game`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to create game");
      const data = await response.json();
      setGameId(data.gameId);
      setWaitingForPlayer(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinGame = () => {
    if (inputGameId.trim()) {
      setGameId(inputGameId);
      setPlayerJoined(true); // Assume joining player is ready
    }
  };

  // Poll the server to check if another player has joined
  useEffect(() => {
    if (gameId && waitingForPlayer) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`${API_URL}/game-state/${gameId}`);
          if (!response.ok) throw new Error("Game not found");

          const data = await response.json();
          if (data.gameState.players >= 2) {  // Assuming backend tracks 'players'
            setPlayerJoined(true);
            setWaitingForPlayer(false);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error checking game status:", err);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [gameId, waitingForPlayer]);

  if (gameId && playerJoined) {
    return <ChainReactionGame rows={6} cols={6} gameId={gameId} isOffline={false} />;
  }

  if (isOffline) {
    return <ChainReactionGame rows={6} cols={6} gameId={null} isOffline={true} />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Chain Reaction</h1>
      {error && <p className="text-red-500">{error}</p>}
      {waitingForPlayer && (
        <div className="text-center">
          <p className="text-lg">Share this Game ID: <span className="font-bold">{gameId}</span></p>
          <p>Waiting for another player to join...</p>
        </div>
      )}
      {!waitingForPlayer && (
        <>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={createGame}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Game"}
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Game ID"
              value={inputGameId}
              onChange={(e) => setInputGameId(e.target.value)}
              className="border px-2 py-1"
            />
            <button
              className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
              onClick={joinGame}
              disabled={!inputGameId.trim()}
            >
              Join Game
            </button>
          </div>
          <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setIsOffline(true)}>
            Play Offline
          </button>
        </>
      )}
    </div>
  );
}
