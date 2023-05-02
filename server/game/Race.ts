
import ITrack from "./models/ITrack";

import IRacer from "./models/IRacer";
import IPlayer from "./models/IPlayer";

import IRaceVehicle from "./models/IRaceVehicle";
import IRaceVehicleType from "./models/IRaceVehicleType";

import Utils from "./Utils";
import PlayerStack from "./PlayerStorage";
import IVec4 from "./models/IVec4";
import RacingGame from "./RacingGame";

export default class Race {

    public gameId: number;
    public hostId: number;

    private track: ITrack;
    private vehicle: IRaceVehicleType;

    private readonly maxPlayers: number;

    private racers: IRacer[];
    private vehicles: IRaceVehicle[];

    private isRaceStarted: boolean;

    constructor(gameId: number, hostPlayer: IPlayer, track: ITrack, vehicle: IRaceVehicleType, maxPlayers: number) {

        this.gameId = gameId;
        this.hostId = hostPlayer.id;

        this.track = track;
        this.vehicle = vehicle;
        this.maxPlayers = maxPlayers;

        this.racers = [];
        this.vehicles = [];

        this.isRaceStarted = false;

        this.createRacer(hostPlayer);
    }

    public createRacer = (player: IPlayer): void => {

        if(this.isRaceStarted) {
            return console.log(
                "[ERROR] The race is already started, you can't invite members!"
            );
        }

        if(this.maxPlayers === this.racers.length) {
            return console.log(
                "[ERROR] Max race members is reached!"
            );
        }

        if(this.isPlayerARacer(player.id)) {
            return console.log(
                "[ERROR] The player are already member of that race!"
            );
        }

        const oldPosition = Utils.GetPlayerPosition(player.id);

        const newRacer: IRacer = {
            id: player.id,
            oldPosition: oldPosition,
        };

        this.racers.push(newRacer);

        if(player.id === this.hostId) {

            Utils.SetPlayerPosition(player.id, this.track.position);

            this.createRaceVehicle(player.id, this.track.position);

            Utils.SendPlayerMessage(player.id,
                "Вы создали гонку."
            );
        } else {

            let { x, y, z, heading } = Utils.GetPlayerPosition(this.hostId);

            x = Utils.GetRandomNumber(x, x + 50);
            y = Utils.GetRandomNumber(y, y + 50);
            heading = Utils.GetRandomNumber(0, 360);

            Utils.SetPlayerPosition(player.id, { x, y, z, heading });

            this.createRaceVehicle(player.id, { x, y, z, heading });

            Utils.SendPlayerMessage(player.id,
                "Вы были приняты в гонку."
            );
        }

        //Utils.SetPlayerBucket(player.id, this.gameId + 100);
    }

    public removeRacer = (player: IPlayer): void => {

        const isRacer = this.isPlayerARacer(player.id);

        if(!isRacer) {
            return console.log(
                "[ERROR] The player is not belong to that race!"
            );
        }

        if (this.isRaceStarted && this.racers.length <= 2) {
            return this.endRace();
        }

        Utils.SetPlayerPosition(isRacer.id, isRacer.oldPosition);
        Utils.SetPlayerBucket(isRacer.id, 0);

        this.removeRaceVehicle(isRacer.id);

        PlayerStack.SetPlayerData(player.id, null);

        const isHost = this.hostId === player.id;

        this.racers = this.racers.filter(
            (item) => item.id !== player.id
        );

        if(isHost && this.racers.length >= 1) {
            this.hostId = this.racers[0].id;

            return Utils.SendPlayerMessage(this.hostId,
                "Теперь вы являетесь хостом данной гонки."
            );
        }

        if(this.racers.length === 0) {
            Utils.SendPlayerMessage(player.id,
                "Ваша гонка была удалена."
            );

            this.clearRace();
        }
    }

    public isPlayerARacer = (playerId: number): IRacer => {
        return this.racers.filter((item) => item.id === playerId)[0];
    }

    private createRaceVehicle = (racerId: number, position: IVec4): void => {

        const isVehicleExist = this.isPlayerHasAVehicle(racerId);

        if(isVehicleExist) {
            return console.log(
                "[ERROR] The player is already have a vehicle!"
            );
        }

        const { id: newVehicleId } = Utils.CreatePlayerVehicle(
            racerId,
            position,
            this.vehicle.modelName,
            this.vehicle.color,
            Number(this.gameId + 100)
        );

        const newRaceVehicle: IRaceVehicle = {
            id: newVehicleId,
            racerId: racerId,
        };

        this.vehicles.push(newRaceVehicle);

        Utils.FreezeEntityPosition(newVehicleId, true);
    }

    private removeRaceVehicle = (racerId: number): void => {

        const isVehicleExist = this.isPlayerHasAVehicle(racerId);

        if(!isVehicleExist) {
            return console.log(
                "[ERROR] The player doesn't have a vehicle!"
            );
        }

        Utils.RemoveVehicle(isVehicleExist.id);

        this.vehicles = this.vehicles.filter(
            (item) => item.id !== isVehicleExist.id
        );
    }

    public isPlayerHasAVehicle = (playerId: number): IRaceVehicle => {
        return this.vehicles.filter((item) => item.racerId === playerId)[0];
    }

    public startRace = (): void => {

        if(this.isRaceStarted) {
            return console.log(
                "[ERROR] The race is already started!"
            );
        }

        if(this.racers.length < 2) {
            return console.log(
                "[ERROR] Can't start race, when you only one member!"
            );
        }

        this.racers.forEach((item) => {
            if(Utils.IsPlayerValid(item.id)) {
                Utils.SendPlayerMessage(item.id,
                    "Ваша гонка началась."
                );
            }
        });

        this.vehicles.forEach((item) => {
            if(Utils.IsVehicleValid(item.id)) {
                Utils.FreezeEntityPosition(item.id, false);
            }
        });

        this.isRaceStarted = true;
    }

    public endRace = (): void => {

        if(!this.isRaceStarted) {
            return console.log(
                "[ERROR] The race is not started!"
            );
        }

        this.clearRace();
    }

    public clearRace = (): void => {

        this.racers.forEach((item) => {
            if(Utils.IsPlayerValid(item.id)) {

                PlayerStack.SetPlayerData(item.id, null);

                Utils.SetPlayerPosition(item.id, item.oldPosition);
                Utils.SetPlayerBucket(item.id, 0);

                Utils.SendPlayerMessage(item.id,
                    "Ваша гонка закончилась."
                );
            }
        });

        this.vehicles.forEach((item) => {
            if(Utils.IsVehicleValid(item.id)) {
                Utils.RemoveVehicle(item.id);
            }
        });

        this.racers = [];
        this.vehicles = [];

        this.isRaceStarted = false;

        RacingGame.RemoveRace(this.gameId);
    }
}