import { OfflineGame } from "./OfflineGame";
import { OnlineGame } from "./OnlineGame";

export function ChainReactionGame({ rows, cols, gameId, isOffline }) {
  return isOffline ? (
    <OfflineGame rows={rows} cols={cols} />
  ) : (
    <OnlineGame rows={rows} cols={cols} gameId={gameId} />
  );
}
