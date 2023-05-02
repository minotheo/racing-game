
import IPlayer from "./models/IPlayer";

export default abstract class PlayerStack {
    private static players: IPlayer[] = [];

    public static GetPlayer = (playerId: number): IPlayer => {

        if(this.players[playerId] === undefined) {
            this.SetPlayerData(playerId, null)
        }

        return this.players[playerId];
    }

    public static SetPlayerData = (playerId: number, id: number | null): void => {
        this.players[playerId] = { id: playerId, currentGameId: id};
    }
}