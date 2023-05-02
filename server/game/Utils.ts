
import "@citizenfx/server"

import IVec4 from "./models/IVec4";

export default abstract class Utils {

    public static CreatePlayerVehicle = (player: number, position: IVec4, model: string, color: number, bucket: number): any => {
        const { x, y, z, heading } = position;

        const modelHash: String | number = GetHashKey(model);

        const newVehicle = CreateVehicle(modelHash, x, y, z, heading, true, false);

        const playerPed: number = GetPlayerPed(player.toString());

        SetVehicleColours(newVehicle, color, color);
        SetPedIntoVehicle(playerPed, newVehicle, -1);

        //SetEntityRoutingBucket(newVehicle, bucket);

        return {
            id: newVehicle,
        };
    }

    public static RemoveVehicle = (vehId: number): void => {
        DeleteEntity(vehId);
    }

    public static IsVehicleValid = (vehId: number): boolean => {
        return DoesEntityExist(vehId);
    }

    public static FreezeEntityPosition = (entity: number, toggle: boolean): void => {
        FreezeEntityPosition(entity, toggle);
    }


    public static SetPlayerBucket = (player: number, bucket: number): void => {
        const playerPed: number = GetPlayerPed(player.toString());
        SetEntityRoutingBucket(playerPed, bucket);
    }

    public static GetPlayerPosition = (player: number): IVec4 => {
        const playerPed: number = GetPlayerPed(player.toString());

        const [ x, y, z]  = GetEntityCoords(playerPed);
        const heading = GetEntityHeading(playerPed);

        return {
            x, y, z, heading
        };
    }

    public static SetPlayerPosition = (player: number, vector: IVec4): void => {
        const playerPed: number = GetPlayerPed(player.toString());

        SetEntityCoords(playerPed, vector.x, vector.y, vector.z, false, false, false, true);
        SetEntityHeading(playerPed, vector.heading);
    }

    public static SendPlayerMessage = (player: number, message: string): void => {
        const playerString: string = player.toString();

        TriggerClientEvent("chat:addMessage", playerString, message);
    }

    public static IsPlayerValid = (player: number): boolean => {
        const playerPed: number = GetPlayerPed(player.toString());

        return DoesEntityExist(playerPed);
    }

    public static GetRandomNumber = (min: number, max: number): number => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}