
import { useState } from "react"
import { ChainReactionGame } from "./Game"

const API_URL = "https://blast-tactics-backend.vercel.app"

export default function Home() {
  const [gameId, setGameId] = useState(null)
  const [inputGameId, setInputGameId] = useState("")
  const [isOffline, setIsOffline] = useState(false)

  const createGame = async () => {
    const response = await fetch(`${API_URL}/create-game`, { method: "POST" })
    const data = await response.json()
    setGameId(data.gameId)
  }

  const joinGame = () => {
    if (inputGameId.trim()) {
      setGameId(inputGameId)
    }
  }

  if (gameId) {
    return <ChainReactionGame rows={6} cols={6} gameId={gameId} />
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Chain Reaction</h1>
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={createGame}>
        Create Game
      </button>
      <div className="flex gap-2">
        <input type="text" placeholder="Enter Game ID" value={inputGameId}
          onChange={(e) => setInputGameId(e.target.value)} className="border px-2 py-1" />
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={joinGame}>
          Join Game
        </button>
      </div>
      <button className="bg-gray-500 text-white px-4 py-2 rounded" onClick={() => setIsOffline(true)}>
        Play Offline
      </button>
    </div>
  )
}
