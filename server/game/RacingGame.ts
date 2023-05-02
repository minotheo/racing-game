
import "@citizenfx/server"

import ITrack from "./models/ITrack";
import IRaceVehicleType from "./models/IRaceVehicleType";

import Race from "./Race";
import Utils from "./Utils";
import IPlayer from "./models/IPlayer";
import PlayerStack from "./PlayerStorage";

export default abstract class RacingGame {

    private static races: Race[] = [];
    private static tracks: ITrack[] = [
        {
            name: "Airport",
            position: {
                x: -1356.27,
                y: -2791.80,
                z: 13.92,
                heading: 158.74
            }
        },
        {
            name: "Highway",
            position: {
                x: -2179.91,
                y: -345.44,
                z: 13.17,
                heading: 255.11
            }
        },
        {
            name: "Zankudo",
            position: {
                x: -2358.23,
                y: 3061.16,
                z: 32.81,
                heading: 274.96
            }
        }
    ];

    public static Main(): void {
        this.RegisterCommands();
    }

    public static RemoveRace = ( gameId: number ) => {
        this.races = this.races.filter(
            (item) => item.gameId !== gameId
        );
    }

    private static CreateRace( playerId: number, trackName: string, vehicleName: string,
                               vehicleColor: number, maxPlayers: number
    ): void {

        const hostPlayer = PlayerStack.GetPlayer(playerId);

        if(this.IsARaceMember(hostPlayer)) {
            return Utils.SendPlayerMessage(playerId,
                "Вы уже находитесь в гонке!"
            );
        }

        let raceTrack = null;

        this.tracks.forEach((item) => {
            if(item.name.toLowerCase() === trackName.toLowerCase()) {
                raceTrack = item;
            }
        });

        if(raceTrack === null) {
            return Utils.SendPlayerMessage(playerId,
                "Введено неверное название трэка [ 'Highway', 'Airport', 'Zankudo' ]."
            );
        }

        if(maxPlayers < 2 || maxPlayers > 16) {
            return Utils.SendPlayerMessage(playerId,
                "Укажите корректное число игроков [ 2 - 16 ]."
            );
        }

        const newRaceGameId: number = this.races.length + 1;

        const newVehicleType: IRaceVehicleType = {
            color: vehicleColor,
            modelName: vehicleName,
        };

        const newRace = new Race(
            newRaceGameId,
            hostPlayer,
            raceTrack,
            newVehicleType,
            maxPlayers
        );

        this.races.push(newRace);

        PlayerStack.SetPlayerData(playerId, newRaceGameId);
    }

    private static InviteRace( playerId: number, newMemberId: number, ): void {

        const player = PlayerStack.GetPlayer(playerId);

        if(!this.IsARaceMember(player)) {
            return Utils.SendPlayerMessage(playerId,
                "Вы не находитесь в гонке."
            );
        }

        const isMemberValid = Utils.IsPlayerValid(newMemberId);

        if(!isMemberValid) {
            return Utils.SendPlayerMessage(playerId,
                "Игрок не найден."
            );
        }

        const member = PlayerStack.GetPlayer(newMemberId);

        if(this.IsARaceMember(member)) {
            return Utils.SendPlayerMessage(playerId,
                "Данный игрок уже находится в гонке."
            );
        }

        const race = this.FindRace(player!.currentGameId);

        if(race === -1) {
            return console.log(
                "[ERROR] The race doesn't exists!"
            );
        }

        PlayerStack.SetPlayerData(newMemberId, this.races[race].gameId);

        this.races[race].createRacer(member);
    }

    private static LeaveRace( playerId: number ): void {

        const player = PlayerStack.GetPlayer(playerId);

        if(!this.IsARaceMember(player)) {
            return Utils.SendPlayerMessage(playerId,
                "Вы не находитесь в гонке."
            );
        }

        const race = this.FindRace(player!.currentGameId);

        if(race === -1) {
            return console.log(
                "[ERROR] The race doesn't exists!"
            );
        }

        this.races[race].removeRacer(player);
    }

    private static StartRace( playerId: number ): void {

        const player = PlayerStack.GetPlayer(playerId);

        if(!this.IsARaceMember(player)) {
            return Utils.SendPlayerMessage(playerId,
                "Вы не находитесь в гонке."
            );
        }

        const race = this.FindRace(player!.currentGameId);

        if(race === -1) {
            return console.log(
                "[ERROR] The race doesn't exists!"
            );
        }

        if(player.id !== this.races[race].hostId) {
            return Utils.SendPlayerMessage(playerId,
                "Вы не являетесь хостом данной гонки."
            );
        }

        this.races[race].startRace();
    }

    private static EndRace( playerId: number ): void {

        const player = PlayerStack.GetPlayer(playerId);

        if(!this.IsARaceMember(player)) {
            return Utils.SendPlayerMessage(playerId,
                "Вы не находитесь в гонке."
            );
        }

        const race = this.FindRace(player!.currentGameId);

        if(race === -1) {
            return console.log(
                "[ERROR] The race doesn't exists!"
            );
        }

        if(player.id !== this.races[race].hostId) {
            return Utils.SendPlayerMessage(playerId,
                "Вы не являетесь хостом данной гонки."
            );
        }

        this.races[race].endRace();
    }

    private static IsARaceMember(player: IPlayer): boolean {
        return Boolean(player.currentGameId !== null);
    }

    private static FindRace(raceId: number | null): number {

        if(!this.races.length || raceId === null) {
            return -1;
        }

        const isRaceExist = this.races.filter(
            (item) => item.gameId === raceId
        )[0];

        return this.races.indexOf(isRaceExist);
    }

    private static RegisterCommands(): void {

        RegisterCommand("createrace",
            (source: number, args: string[]) => {

                if(!source) {
                    return console.log(
                        "Create race only available for the players!"
                    );
                }

                const [ trackName, vehicleName, vehicleColor, maxPlayers ] = args;

                if(trackName === undefined || vehicleName === undefined ||
                    vehicleColor === undefined || maxPlayers === undefined ) {
                    return Utils.SendPlayerMessage(source,
                        "Укажите данные в формате : [ Трасса ] [ Название машины ] [ Цвет машины ] [ Макс кол-во игроков (2-16) ]"
                    );
                }

                const vehicleColorNumber = parseInt(vehicleColor);
                const maxPlayersNumber = parseInt(maxPlayers);

                this.CreateRace(source, trackName, vehicleName, vehicleColorNumber, maxPlayersNumber);
            },
            false
        );

        RegisterCommand("raceinvite",
            (source: number, args: string[]) => {

                if(!source) {
                    return console.log(
                        "Invite race only available for the players!"
                    );
                }

                const newMemberStr = args[0];

                if(newMemberStr === undefined) {
                    return Utils.SendPlayerMessage(source,
                            "Укажите корректный ID игрока!"
                        );
                }

                const newMemberId = parseInt(newMemberStr);

                this.InviteRace(source, newMemberId);
            },
            false
        );

        RegisterCommand("leaverace",
            (source: number) => {

                if(!source) {
                    return console.log(
                        "Leave race only available for the players!"
                    );
                }

                this.LeaveRace(source);
            },
            false
        );

        RegisterCommand("startrace",
            (source: number) => {

                if(!source) {
                    return console.log(
                        "Start race only available for the players!"
                    );
                }

                this.StartRace(source);
            },
            false
        );

        RegisterCommand("endrace",
            (source: number) => {

                if(!source) {
                    return console.log(
                        "End race only available for the players!"
                    );
                }

                this.EndRace(source);
            },
            false
        );
    }
}