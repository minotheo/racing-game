import "@citizenfx/server"

import RacingGame from "./game/RacingGame";

abstract class Server {
    public static Init(): void {
        RacingGame.Main();
    }
}

Server.Init();
