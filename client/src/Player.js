import Phaser from "phaser";
import { room } from './SocketServer';
import { ENTITY_SIZE } from "./constants/entity";


export default class Player extends Phaser.GameObjects.Sprite {
    constructor(config) {
        super(config.scene, config.x, config.y, config.key);

        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this);
        this.scene.physics.add.collider(this, config.worldLayer);

        this.setTexture("currentPlayer", `misa-${this.scene.playerTexturePosition}`);
        this.setDisplaySize(ENTITY_SIZE.width, ENTITY_SIZE.height);

        // Register cursors for player movement
        this.cursors = this.scene.input.keyboard.createCursorKeys();

        // Player Offset
        this.body.setSize(ENTITY_SIZE.hitboxWidth, ENTITY_SIZE.hitboxHeight);
        this.body.setOffset(0, ENTITY_SIZE.hitboxOffsetY);

        // Player can't go out of the world
        this.body.setCollideWorldBounds(true)

        // Set depth (z-index)
        this.setDepth(5);

        // Container to store old data
        this.container = [];

        // Player speed
        this.speed = 150;
        this.facing = this.scene.playerTexturePosition || "front";

        this.canChangeMap = true;

        // Player nickname text
        this.playerNickname = this.scene.add.text(this.x, (this.y - (this.height / 2)), 'Player').setOrigin(0.5, 0.5);

        // Add spacebar input
        this.spacebar = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.scene.events.on('postupdate', () => {
            this.playerNickname.x = Math.round(this.x);
            this.playerNickname.y = Math.round(this.y - (this.height / 2));
        });
    } 


    update(time, delta) {
        const prevVelocity = this.body.velocity.clone();

        if (this.scene.isInterfaceOpen()) {
            this.body.setVelocity(0);
            this.anims.stop();

            if (prevVelocity.x < 0) this.setFacing("left");
            else if (prevVelocity.x > 0) this.setFacing("right");
            else if (prevVelocity.y < 0) this.setFacing("back");
            else if (prevVelocity.y > 0) this.setFacing("front");

            return;
        }

        // Player door interaction
        this.doorInteraction();

        // Player world interaction
        this.worldInteraction();

        // Stop any previous movement from the last frame
        this.body.setVelocity(0);

        // Horizontal movement
        if (this.cursors.left.isDown) {
            this.body.setVelocityX(-this.speed);
        } else if (this.cursors.right.isDown) {
            this.body.setVelocityX(this.speed);
        }

        // Vertical movement
        if (this.cursors.up.isDown) {
            this.body.setVelocityY(-this.speed);
        } else if (this.cursors.down.isDown) {
            this.body.setVelocityY(this.speed);
        }

        // Normalize and scale the velocity so that player can't move faster along a diagonal
        this.body.velocity.normalize().scale(this.speed);

        // Update the animation last and give left/right animations precedence over up/down animations
        if (this.cursors.left.isDown) {
            this.setFacing("left", false);
            this.anims.play("misa-left-walk", true);
        } else if (this.cursors.right.isDown) {
            this.setFacing("right", false);
            this.anims.play("misa-right-walk", true);
        } else if (this.cursors.up.isDown) {
            this.setFacing("back", false);
            this.anims.play("misa-back-walk", true);
        } else if (this.cursors.down.isDown) {
            this.setFacing("front", false);
            this.anims.play("misa-front-walk", true);
        } else {
            this.anims.stop();

            // If we were moving, pick and idle frame to use
            if (prevVelocity.x < 0) this.setFacing("left");
            else if (prevVelocity.x > 0) this.setFacing("right");
            else if (prevVelocity.y < 0) this.setFacing("back");
            else if (prevVelocity.y > 0) this.setFacing("front");
        }
    }

    setFacing(direction, updateTexture = true) {
        this.facing = direction;
        this.scene.playerTexturePosition = direction;
        if (updateTexture) {
            this.setTexture("currentPlayer", `misa-${direction}`);
        }
    }

    isMoved() {
        if (this.container.oldPosition && (this.container.oldPosition.x !== this.x || this.container.oldPosition.y !== this.y)) {
            this.container.oldPosition = {x: this.x, y: this.y};
            return true;
        } else {
            this.container.oldPosition = {x: this.x, y: this.y};
            return false;
        }
    }

    doorInteraction() {
        const doorLayer = this.scene.map.getObjectLayer("Doors");
        const interactionPoint = this.getInteractionPoint();

        (doorLayer?.objects || []).forEach((obj) => {
            if (this.isInsideObject(interactionPoint, obj)) {
                console.log('Player is by ' + obj.name);
                if (this.spacebar.isDown) {
                    console.log('Door is open!')
                }
            }
        });
    }

    worldInteraction() {
        if (this.scene.isMapTransitioning) {
            return;
        }

        const worldLayer = this.scene.map.getObjectLayer("Worlds");
        const interactionPoint = this.getInteractionPoint();
        const world = (worldLayer?.objects || []).find((entry) => this.isInsideObject(interactionPoint, entry));

        if (!world) {
            return;
        }

        console.log('Player is by world entry: ' + world.name);

        const playerTexturePosition = world.properties?.find((property) => property.name === 'playerTexturePosition');
        const spawnPoint = world.properties?.find((property) => property.name === 'spawnPoint');
        const nextFacing = playerTexturePosition?.value || this.facing || this.scene.playerTexturePosition || "front";

        this.scene.playerTexturePosition = nextFacing;

        this.scene.transitionToMap({
            map: world.name,
            playerTexturePosition: nextFacing,
            spawnPointName: spawnPoint?.value || "Spawn Point"
        });

        room.then((room) => room.send(
             "PLAYER_CHANGED_MAP",{
            map: world.name
        }));
    }

    getInteractionPoint() {
        if (!this.body) {
            return { x: this.x, y: this.y };
        }

        return {
            x: this.body.center.x,
            y: this.body.bottom - 2
        };
    }

    isInsideObject(point, object) {
        return point.y >= object.y
            && point.y <= (object.y + object.height)
            && point.x >= object.x
            && point.x <= (object.x + object.width);
    }
}
