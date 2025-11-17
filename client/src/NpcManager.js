import Phaser from "phaser";
import { fetchNpcs, interactWithNpc } from "./api/npcs";
import { room } from "./SocketServer";
import { ENTITY_SIZE } from "./constants/entity";

const FONT_FAMILY = "\"Press Start 2P\"";

export default class NpcManager {
    constructor(scene, dialogueUi) {
        this.scene = scene;
        this.dialogueUi = dialogueUi;
        this.playerId = null;
        this.npcs = [];
        this.activeNpc = null;
        this.destroyed = false;
        this.loadRequestId = 0;

        this.interactKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.prompt = this.scene.add.text(0, 0, "Z PRAAT", {
            fontFamily: FONT_FAMILY,
            fontSize: "8px",
            color: "#fff4a3",
            backgroundColor: "#1c1c2e",
            padding: { x: 6, y: 4 }
        }).setScrollFactor(1).setDepth(40).setVisible(false);

        this.readyPromise = room.then(async (currentRoom) => {
            this.playerId = currentRoom.sessionId;
            await this.loadForMap(this.scene.mapName);
        });
    }

    async loadForMap(mapName) {
        if (!this.playerId || this.destroyed) {
            return;
        }

        const requestId = ++this.loadRequestId;
        this.destroyNpcObjects();
        const payload = await fetchNpcs(this.playerId, mapName);
        if (this.destroyed || requestId !== this.loadRequestId) {
            return;
        }

        this.npcs = payload.npcs.map((npc) => ({
            ...npc,
            sprite: this.scene.add.image(npc.x, npc.y - (ENTITY_SIZE.height / 2) + 8, npc.spriteKey, npc.spriteFrame)
                .setDisplaySize(ENTITY_SIZE.width, ENTITY_SIZE.height)
                .setDepth(6),
            label: this.scene.add.text(npc.x, npc.y - ENTITY_SIZE.height, npc.name, {
                fontFamily: FONT_FAMILY,
                fontSize: "8px",
                color: "#ffffff",
                backgroundColor: "#1c1c2e",
                padding: { x: 4, y: 3 }
            }).setOrigin(0.5, 1).setDepth(7)
        }));
    }

    destroy() {
        this.destroyed = true;
        this.destroyNpcObjects();
        this.prompt.destroy();
    }

    destroyNpcObjects() {
        this.npcs.forEach((npc) => {
            if (npc.sprite) {
                npc.sprite.destroy();
            }
            if (npc.label) {
                npc.label.destroy();
            }
        });
        this.npcs = [];
    }

    update() {
        if (!this.npcs.length || this.scene.isInterfaceOpen()) {
            this.prompt.setVisible(false);
            return;
        }

        const nearbyNpc = this.findNearbyNpc();
        this.activeNpc = nearbyNpc;

        if (nearbyNpc) {
            this.prompt.setPosition(nearbyNpc.x - 24, nearbyNpc.y - (ENTITY_SIZE.height + 24)).setVisible(true);
            if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
                this.beginConversation(nearbyNpc);
            }
            return;
        }

        this.prompt.setVisible(false);
    }

    async beginConversation(npc) {
        try {
            this.dialogueUi.showLoading(npc);
            const payload = await interactWithNpc(this.playerId, npc.id, "TALK");
            this.applyNpcUpdate(payload.npc);
            this.dialogueUi.showPayload(payload);
        } catch (error) {
            this.dialogueUi.showPayload(createErrorPayload(npc, error));
        }
    }

    async choose(npc, choice) {
        try {
            this.dialogueUi.showLoading(npc);
            const payload = await interactWithNpc(this.playerId, npc.id, choice.id);
            this.applyNpcUpdate(payload.npc);
            this.dialogueUi.showPayload(payload);
        } catch (error) {
            this.dialogueUi.showPayload(createErrorPayload(npc, error));
        }
    }

    applyNpcUpdate(updatedNpc) {
        const existingNpc = this.npcs.find((npc) => npc.id === updatedNpc.id);
        if (!existingNpc) {
            return;
        }

        Object.assign(existingNpc, updatedNpc);
        if (existingNpc.label) {
            existingNpc.label.setText(existingNpc.name);
        }
    }

    findNearbyNpc() {
        const player = this.scene.player;
        if (!player) {
            return null;
        }

        return this.npcs.find((npc) => Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y) <= 52);
    }
}

function createErrorPayload(npc, error) {
    const message = error?.message || "De connectie met de NPC faalde.";
    return {
        npc,
        story: {
            clueCount: 0
        },
        response: {
            lines: ["...", "De emotieverbinding", "werd onderbroken.", message.slice(0, 38)],
            emotion: {
                label: "offline"
            },
            availableChoices: [
                { id: "GOODBYE", label: "TOT ZIENS" }
            ],
            unlockedClue: null
        }
    };
}
