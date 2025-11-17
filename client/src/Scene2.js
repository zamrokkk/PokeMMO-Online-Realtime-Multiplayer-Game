import Phaser from "phaser";
import { onlinePlayers, room } from './SocketServer';

import OnlinePlayer from "./OnlinePlayer";
import Player from "./Player";
import FireRedMenuUI from "./ui/FireRedMenuUI";
import FireRedDialogueUI from "./ui/FireRedDialogueUI";
import NpcManager from "./NpcManager";
import FireRedBattleUI from "./ui/FireRedBattleUI";
import PokemonCenterManager from "./PokemonCenterManager";
import WildEncounterManager from "./WildEncounterManager";
import { tickPlaySession } from "./state/gameState";

let cursors, socketKey;

export class Scene2 extends Phaser.Scene {
    constructor() {
        super("playGame");
    }

    init(data) {
        // Map data
        this.mapName = data.map;
        this.spawnPointName = data.spawnPointName || "Spawn Point";
        this.playerPosition = data.playerPosition || null;
        this.isMapTransitioning = false;
        this.isSceneShuttingDown = false;

        // Player Texture starter position
        this.playerTexturePosition = data.playerTexturePosition;

        // Set container
        this.container = [];
    }

    create() {
        this.map = this.make.tilemap({key: this.mapName});

        console.log("this.mapName",this.mapName);
        console.log("this.map",this.map);


        // Set current map Bounds
        this.scene.scene.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
        // Phaser's cache (i.e. the name you used in preload)
        const tileset = this.map.addTilesetImage("tuxmon-sample-32px-extruded", "TilesTown");

        // Parameters: layer name (or index) from Tiled, tileset, x, y
        this.belowLayer = this.map.createLayer("Below Player", tileset, 0, 0);
        this.worldLayer = this.map.createLayer("World", tileset, 0, 0);
        this.grassLayer = this.map.createLayer("Grass", tileset, 0, 0);
        this.aboveLayer = this.map.createLayer("Above Player", tileset, 0, 0);

        this.worldLayer.setCollisionByProperty({collides: true});

        // By default, everything gets depth sorted on the screen in the order we created things. Here, we
        // want the "Above Player" layer to sit on top of the player, so we explicitly give it a depth.
        // Higher depths will sit on top of lower depth objects.
        this.aboveLayer.setDepth(10);

        // Get spawn point from tiled map
        const spawnPoint = this.map.findObject("SpawnPoints", obj => obj.name === this.spawnPointName)
            || this.map.findObject("SpawnPoints", obj => obj.name === "Spawn Point");

        // Set player
        this.player = new Player({
            scene: this,
            worldLayer: this.worldLayer,
            key: 'player',
            x: this.playerPosition?.x ?? spawnPoint.x,
            y: this.playerPosition?.y ?? spawnPoint.y
        });

        const camera = this.cameras.main;
        camera.startFollow(this.player);
        camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        camera.fadeIn(300, 0, 0, 0);

        cursors = this.input.keyboard.createCursorKeys();

        this.menuUi = new FireRedMenuUI(this);
        this.dialogueUi = new FireRedDialogueUI(this, {
            onChoice: (npc, choice) => {
                if (this.npcManager) {
                    this.npcManager.choose(npc, choice);
                }
            },
            onClose: () => {
                this.input.keyboard.resetKeys();
            }
        });
        this.battleUi = new FireRedBattleUI(this);
        this.npcManager = new NpcManager(this, this.dialogueUi);
        this.wildEncounterManager = new WildEncounterManager(this, this.battleUi);
        this.pokemonCenterManager = new PokemonCenterManager(this);
        room.then((currentRoom) => {
            if (this.isSceneShuttingDown) {
                return;
            }

            this.roomMessageUnsubscribe = currentRoom.onMessage("*", (type, data) => {
                this.handleRoomMessage(currentRoom, type, data);
            });
        });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.isSceneShuttingDown = true;

            if (this.roomMessageUnsubscribe) {
                this.roomMessageUnsubscribe();
                this.roomMessageUnsubscribe = null;
            }

            Object.keys(onlinePlayers).forEach((sessionId) => {
                if (onlinePlayers[sessionId]?.scene === this) {
                    this.destroyOnlinePlayer(sessionId);
                }
            });

            if (this.menuUi) {
                this.menuUi.destroy();
                this.menuUi = null;
            }

            if (this.dialogueUi) {
                this.dialogueUi.destroy();
                this.dialogueUi = null;
            }

            if (this.npcManager) {
                this.npcManager.destroy();
                this.npcManager = null;
            }

            if (this.battleUi) {
                this.battleUi.destroy();
                this.battleUi = null;
            }

            if (this.wildEncounterManager) {
                this.wildEncounterManager = null;
            }

            if (this.pokemonCenterManager) {
                this.pokemonCenterManager.destroy();
                this.pokemonCenterManager = null;
            }

            if (this.socketTimerEvent) {
                this.socketTimerEvent.remove(false);
                this.socketTimerEvent = null;
            }

            if (this.stateTimerEvent) {
                this.stateTimerEvent.remove(false);
                this.stateTimerEvent = null;
            }
        });

        this.debugGraphics();

        this.movementTimer();
        this.stateTimerEvent = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (!this.player) {
                    return;
                }

                tickPlaySession({
                    mapId: this.mapName,
                    x: Math.round(this.player.x),
                    y: Math.round(this.player.y),
                    facing: this.player.facing || this.playerTexturePosition || "front"
                }, 1);
            }
        });
    }

    update(time, delta) {
        if (this.battleUi) {
            this.battleUi.update();
        }

        if (this.dialogueUi) {
            this.dialogueUi.update();
        }

        if (this.npcManager) {
            this.npcManager.update();
        }

        if (this.wildEncounterManager) {
            this.wildEncounterManager.update();
        }

        if (this.pokemonCenterManager) {
            this.pokemonCenterManager.update();
        }

        if (this.menuUi && !this.isDialogueOpen() && !this.isBattleOpen()) {
            this.menuUi.update();
        }

        // Loop the player update method
        this.player.update(time, delta);

        if (this.isInterfaceOpen()) {
            return;
        }

        // console.log('PlayerX: ' + this.player.x);
        // console.log('PlayerY: ' + this.player.y);

        // Horizontal movement
        if (cursors.left.isDown) {
            if (socketKey) {
                if (this.player.isMoved()) {
                    room.then((room) => room.send(
                         "PLAYER_MOVED",{
                        position: 'left',
                        x: this.player.x,
                        y: this.player.y
                    }));
                }
                socketKey = false;
            }
        } else if (cursors.right.isDown) {
            if (socketKey) {
                if (this.player.isMoved()) {
                    room.then((room) => room.send(
                         "PLAYER_MOVED",{
                        position: 'right',
                        x: this.player.x,
                        y: this.player.y
                    }))
                }
                socketKey = false;
            }
        }

        // Vertical movement
        if (cursors.up.isDown) {
            if (socketKey) {
                if (this.player.isMoved()) {
                    room.then((room) => room.send(
                        "PLAYER_MOVED",{
                        position: 'back',
                        x: this.player.x,
                        y: this.player.y
                    }))
                }
                socketKey = false;
            }
        } else if (cursors.down.isDown) {
            if (socketKey) {
                if (this.player.isMoved()) {
                    room.then((room) => room.send(
                         "PLAYER_MOVED",{
                        position: 'front',
                        x: this.player.x,
                        y: this.player.y
                    }))
                }
                socketKey = false;
            }
        }

        // Horizontal movement ended
        if (Phaser.Input.Keyboard.JustUp(cursors.left) === true) {
            room.then((room) => room.send( "PLAYER_MOVEMENT_ENDED",{ position: 'left'}))
        } else if (Phaser.Input.Keyboard.JustUp(cursors.right) === true) {
            room.then((room) => room.send( "PLAYER_MOVEMENT_ENDED",{ position: 'right'}))
        }

        // Vertical movement ended
        if (Phaser.Input.Keyboard.JustUp(cursors.up) === true) {
            room.then((room) => room.send( "PLAYER_MOVEMENT_ENDED", {position: 'back'}))
        } else if (Phaser.Input.Keyboard.JustUp(cursors.down) === true) {
            room.then((room) => room.send( "PLAYER_MOVEMENT_ENDED", {position: 'front'}))
        }
    }

    movementTimer() {
        this.socketTimerEvent = this.time.addEvent({
            delay: 50,
            loop: true,
            callback: () => {
            socketKey = true;
            }
        });
    }

    debugGraphics() {
        // Debug graphics
        this.input.keyboard.once("keydown_D", event => {
            // Turn on physics debugging to show player's hitbox
            this.physics.world.createDebugGraphic();

            // Create worldLayer collision graphic above the player, but below the help text
            const graphics = this.add
                .graphics()
                .setAlpha(0.75)
                .setDepth(20);
            this.worldLayer.renderDebug(graphics, {
                tileColor: null, // Color of non-colliding tiles
                collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
                faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
            });
        });
    }

    isInterfaceOpen() {
        return this.isMapTransitioning
            || this.isBattleOpen()
            || this.isDialogueOpen()
            || Boolean(this.menuUi && this.menuUi.isBlockingGameplayInput())
            || Boolean(this.pokemonCenterManager && this.pokemonCenterManager.isBlockingGameplayInput());
    }

    isDialogueOpen() {
        return Boolean(this.dialogueUi && this.dialogueUi.isOpen());
    }

    isBattleOpen() {
        return Boolean(this.battleUi && this.battleUi.isOpen());
    }

    handleRoomMessage(currentRoom, type, data) {
        if (!type || !data) {
            return;
        }

        if (type === "CURRENT_PLAYERS") {
            Object.keys(data.players || {}).forEach((playerId) => {
                const player = data.players[playerId];
                if (!player || playerId === currentRoom.sessionId || player.map !== this.mapName) {
                    return;
                }

                this.ensureOnlinePlayer(player);
            });
            return;
        }

        if (type === "PLAYER_JOINED") {
            if (data.sessionId !== currentRoom.sessionId && data.map === this.mapName) {
                this.ensureOnlinePlayer(data);
            }
            return;
        }

        if (type === "PLAYER_LEFT") {
            this.destroyOnlinePlayer(data.sessionId);
            return;
        }

        if (type === "PLAYER_MOVED") {
            const remotePlayer = this.ensureOnlinePlayer(data);
            if (!remotePlayer || remotePlayer.map !== this.mapName) {
                return;
            }

            remotePlayer.isWalking(data.position, data.x, data.y);
            return;
        }

        if (type === "PLAYER_MOVEMENT_ENDED") {
            const remotePlayer = this.ensureOnlinePlayer(data);
            if (!remotePlayer || remotePlayer.map !== this.mapName) {
                return;
            }

            remotePlayer.stopWalking(data.position);
            return;
        }

        if (type === "PLAYER_CHANGED_MAP") {
            if (data.map !== this.mapName) {
                this.destroyOnlinePlayer(data.sessionId);
                return;
            }

            this.ensureOnlinePlayer(data);
        }
    }

    ensureOnlinePlayer(playerData) {
        if (!playerData?.sessionId || playerData.map !== this.mapName) {
            return null;
        }

        const existingPlayer = onlinePlayers[playerData.sessionId];
        if (existingPlayer) {
            existingPlayer.map = playerData.map;
            if (Number.isFinite(playerData.x) && Number.isFinite(playerData.y)) {
                existingPlayer.setPosition(playerData.x, playerData.y);
            }
            return existingPlayer;
        }

        if (!Number.isFinite(playerData.x) || !Number.isFinite(playerData.y)) {
            return null;
        }

        onlinePlayers[playerData.sessionId] = new OnlinePlayer({
            scene: this,
            worldLayer: this.worldLayer,
            playerId: playerData.sessionId,
            key: playerData.sessionId,
            map: playerData.map,
            x: playerData.x,
            y: playerData.y
        });
        return onlinePlayers[playerData.sessionId];
    }

    destroyOnlinePlayer(sessionId) {
        const remotePlayer = onlinePlayers[sessionId];
        if (!remotePlayer) {
            return;
        }

        remotePlayer.destroy();
        delete onlinePlayers[sessionId];
    }

    transitionToMap(data) {
        if (this.isMapTransitioning) {
            return;
        }

        this.isMapTransitioning = true;
        const camera = this.cameras.main;
        camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.restart(data);
        });
        camera.fadeOut(300, 0, 0, 0);
    }
}
