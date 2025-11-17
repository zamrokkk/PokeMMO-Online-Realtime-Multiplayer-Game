import Phaser from "phaser";
import TownJSON from "./assets/tilemaps/town.json";
import AshveldJSON from "./assets/tilemaps/ashveld.json";
import CrysthavenJSON from "./assets/tilemaps/crysthaven.json";
import PokemonCenterAshveldJSON from "./assets/tilemaps/pokemon_center_ashveld.json";
import PokemonCenterCrysthavenJSON from "./assets/tilemaps/pokemon_center_crysthaven.json";
import PokemonCenterTownJSON from "./assets/tilemaps/pokemon_center_town.json";
import Route1JSON from "./assets/tilemaps/route1.json";
import Route2JSON from "./assets/tilemaps/route2.json";
import TilesTown from "./assets/tilesets/tuxmon-sample-32px-extruded.png";

import AtlasJSON from "./assets/atlas/atlas";
import AtlasPNG from "./assets/atlas/atlas.png";
import PlayersAtlasJSON from "./assets/atlas/players";
import PlayersAtlasPNG from "./assets/images/players/players.png";
import { getPlayerData, getPokemonSpriteEntries, initializeGameState } from "./state/gameState";

export class Scene1 extends Phaser.Scene {
    constructor() {
        super("bootGame");
    }

    preload() {
        // Load Town
        this.load.image("TilesTown", TilesTown);
        this.load.tilemapTiledJSON("town", TownJSON);

        // Load Route1
        this.load.tilemapTiledJSON("route1", Route1JSON);
        this.load.tilemapTiledJSON("ashveld", AshveldJSON);
        this.load.tilemapTiledJSON("route2", Route2JSON);
        this.load.tilemapTiledJSON("crysthaven", CrysthavenJSON);
        this.load.tilemapTiledJSON("pokemon_center_town", PokemonCenterTownJSON);
        this.load.tilemapTiledJSON("pokemon_center_ashveld", PokemonCenterAshveldJSON);
        this.load.tilemapTiledJSON("pokemon_center_crysthaven", PokemonCenterCrysthavenJSON);

        // Load atlas
        this.load.atlas("currentPlayer", AtlasPNG, AtlasJSON);
        this.load.atlas("players", PlayersAtlasPNG, PlayersAtlasJSON);
    }

    create() {
        this.loadingText = this.add.text(20, 20, "Loading game...", {
            fontFamily: "\"Press Start 2P\", monospace",
            fontSize: "12px",
            color: "#ffffff"
        });

        this.createAnimations();
        this.bootstrapGame();
    }

    async bootstrapGame() {
        this.loadingText.setText("Loading game...\nSyncing Kanto Pokédex");

        await Promise.all([
            initializeGameState(),
            waitForPixelFont()
        ]);

        const spriteEntries = getPokemonSpriteEntries().filter(({ key }) => !this.textures.exists(key));

        if (spriteEntries.length) {
            spriteEntries.forEach(({ key, url }) => {
                this.load.image(key, url);
            });

            this.loadingText.setText("Loading game...\nCaching battle sprites");
            this.load.once(Phaser.Loader.Events.COMPLETE, () => {
                this.startGame();
            });
            this.load.start();
            return;
        }

        this.startGame();
    }

    startGame() {
        this.loadingText.setText("Loading game...\nStarting");
        const player = getPlayerData();
        this.scene.start("playGame", {
            map: player.position.mapId,
            playerTexturePosition: player.position.facing,
            spawnPointName: "Spawn Point",
            playerPosition: {
                x: player.position.x,
                y: player.position.y
            }
        });
    }

    createAnimations() {
        // Create the player's walking animations from the texture currentPlayer. These are stored in the global
        // animation manager so any sprite can access them.
        this.anims.create({
            key: "misa-left-walk",
            frames: this.anims.generateFrameNames("currentPlayer", {
                prefix: "misa-left-walk.",
                start: 0,
                end: 3,
                zeroPad: 3
            }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: "misa-right-walk",
            frames: this.anims.generateFrameNames("currentPlayer", {
                prefix: "misa-right-walk.",
                start: 0,
                end: 3,
                zeroPad: 3
            }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: "misa-front-walk",
            frames: this.anims.generateFrameNames("currentPlayer", {
                prefix: "misa-front-walk.",
                start: 0,
                end: 3,
                zeroPad: 3
            }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: "misa-back-walk",
            frames: this.anims.generateFrameNames("currentPlayer", {
                prefix: "misa-back-walk.",
                start: 0,
                end: 3,
                zeroPad: 3
            }),
            frameRate: 10,
            repeat: -1
        });

        // onlinePlayer animations
        this.anims.create({
            key: "onlinePlayer-left-walk", frames: this.anims.generateFrameNames("players", {
                start: 0,
                end: 3,
                zeroPad: 3,
                prefix: "bob_left_walk.",
                suffix: ".png"
            }), frameRate: 10, repeat: -1
        });
        this.anims.create({
            key: "onlinePlayer-right-walk", frames: this.anims.generateFrameNames("players", {
                start: 0,
                end: 3,
                zeroPad: 3,
                prefix: "bob_right_walk.",
                suffix: ".png"
            }), frameRate: 10, repeat: -1
        });
        this.anims.create({
            key: "onlinePlayer-front-walk", frames: this.anims.generateFrameNames("players", {
                start: 0,
                end: 3,
                zeroPad: 3,
                prefix: "bob_front_walk.",
                suffix: ".png"
            }), frameRate: 10, repeat: -1
        });
        this.anims.create({
            key: "onlinePlayer-back-walk", frames: this.anims.generateFrameNames("players", {
                start: 0,
                end: 3,
                zeroPad: 3,
                prefix: "bob_back_walk.",
                suffix: ".png"
            }), frameRate: 10, repeat: -1
        });
    }
}

function waitForPixelFont() {
    if (typeof document === "undefined" || !document.fonts) {
        return Promise.resolve();
    }

    return Promise.all([
        document.fonts.load("10px \"Press Start 2P\""),
        document.fonts.ready
    ]).catch(() => undefined);
}
