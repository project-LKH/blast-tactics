import { ChainReactionGame } from "./Game"

export default function Home() {
    return (
        <main className="w-full h-screen p-0 m-0 overflow-hidden">
            <ChainReactionGame rows={6} cols={6} />
        </main>
    )
}

