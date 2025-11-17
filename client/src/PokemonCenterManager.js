import Phaser from "phaser";
import { healParty, isPartyFullyHealed, updatePokemonCenterState } from "./state/gameState";

const FONT_FAMILY = "\"Press Start 2P\"";
const TILE_SIZE = 32;
const CENTER_INTERIORS = {
    pokemon_center_town: {
        joy: { x: 5, y: 4 },
        pc: { x: 1, y: 4 }
    },
    pokemon_center_ashveld: {
        joy: { x: 5, y: 4 },
        pc: { x: 1, y: 4 }
    },
    pokemon_center_crysthaven: {
        joy: { x: 5, y: 4 },
        pc: { x: 1, y: 4 }
    }
};
const COLORS = {
    wall: 0xf87878,
    wallBand: 0xd05858,
    counterTop: 0xe8b878,
    counterFront: 0xd0a060,
    floorA: 0xe8d0b8,
    floorB: 0xe0c8b0,
    pcBody: 0x3858c8,
    pcScreen: 0x80d8a0,
    machineBody: 0xc8e8f8,
    mat: 0xd04040,
    lightOn: 0xf8d800,
    lightOff: 0x909090,
    slotOn: 0xd04040,
    slotOff: 0x9a9a9a,
    panelBackground: 0xf0f0e0,
    panelBorder: 0x303848,
    text: "#2c2c2c",
    cursor: "#2c2c2c"
};

export default class PokemonCenterManager {
    constructor(scene) {
        this.scene = scene;
        this.definition = CENTER_INTERIORS[this.scene.mapName] || null;
        this.active = Boolean(this.definition);
        this.uiMode = "closed";
        this.selectedChoice = 0;
        this.textPages = [];
        this.textIndex = 0;
        this.choiceOptions = [];
        this.onTextComplete = null;
        this.onChoice = null;
        this.isAnimating = false;

        this.keys = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
            z: Phaser.Input.Keyboard.KeyCodes.Z,
            escape: Phaser.Input.Keyboard.KeyCodes.ESC,
            x: Phaser.Input.Keyboard.KeyCodes.X
        });

        updatePokemonCenterState({
            isInsideCenter: this.active
        });

        if (!this.active) {
            return;
        }

        this.createInteriorDecor();
        this.createUi();
        this.createPrompt();
        this.blinkVisible = true;
        this.blinkEvent = this.scene.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                this.blinkVisible = !this.blinkVisible;
                this.refreshUi();
            }
        });
    }

    destroy() {
        updatePokemonCenterState({
            isInsideCenter: false
        });

        if (!this.active) {
            return;
        }

        if (this.blinkEvent) {
            this.blinkEvent.remove();
        }

        if (this.prompt) {
            this.prompt.destroy();
        }

        if (this.uiRoot) {
            this.uiRoot.destroy(true);
        }

        if (this.flashOverlay) {
            this.flashOverlay.destroy();
        }

        if (this.decorRoot) {
            this.decorRoot.destroy(true);
        }
    }

    isBlockingGameplayInput() {
        return this.active && (this.uiMode !== "closed" || this.isAnimating);
    }

    update() {
        if (!this.active || this.scene.isMapTransitioning) {
            return;
        }

        if (!this.isBlockingGameplayInput() && (this.scene.isBattleOpen() || this.scene.isDialogueOpen() || this.scene.menuUi?.isBlockingGameplayInput())) {
            this.prompt.setVisible(false);
            return;
        }

        if (this.uiMode !== "closed") {
            this.updateUiInput();
            return;
        }

        const interaction = this.findInteraction();
        if (!interaction) {
            this.prompt.setVisible(false);
            return;
        }

        const promptText = interaction.kind === "joy" ? "Z ZUSTER JOY" : "Z PC";
        const promptX = interaction.tile.x * TILE_SIZE;
        const promptY = interaction.tile.y * TILE_SIZE;
        this.prompt
            .setText(promptText)
            .setPosition(promptX - 24, promptY + 10)
            .setVisible(true);

        if (this.isConfirmPressed()) {
            if (interaction.kind === "joy") {
                this.startJoyConversation();
            } else {
                this.startPcConversation();
            }
        }
    }

    createInteriorDecor() {
        this.decorRoot = this.scene.add.container(0, 0).setDepth(3);
        const baseGraphics = this.scene.add.graphics();
        const counterFrontGraphics = this.scene.add.graphics();
        const width = this.scene.map.widthInPixels;
        const height = this.scene.map.heightInPixels;

        for (let tileY = 0; tileY < this.scene.map.height; tileY += 1) {
            for (let tileX = 0; tileX < this.scene.map.width; tileX += 1) {
                const color = (tileX + tileY) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
                baseGraphics.fillStyle(color, 1);
                baseGraphics.fillRect(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        baseGraphics.fillStyle(COLORS.wall, 1);
        baseGraphics.fillRect(0, 0, width, TILE_SIZE * 2);
        baseGraphics.fillStyle(COLORS.wallBand, 1);
        baseGraphics.fillRect(0, TILE_SIZE * 2, width, 10);

        drawWindow(baseGraphics, TILE_SIZE * 1.1, TILE_SIZE * 0.35);
        drawWindow(baseGraphics, width - (TILE_SIZE * 3.1), TILE_SIZE * 0.35);

        baseGraphics.fillStyle(COLORS.counterTop, 1);
        baseGraphics.fillRect(TILE_SIZE, TILE_SIZE * 3, width - (TILE_SIZE * 2), 12);
        baseGraphics.fillStyle(0xffffff, 1);
        baseGraphics.fillRect((width / 2) - 12, TILE_SIZE * 3 + 6, 24, 8);
        baseGraphics.fillRect((width / 2) - 4, TILE_SIZE * 3 - 2, 8, 24);

        counterFrontGraphics.fillStyle(COLORS.counterFront, 1);
        counterFrontGraphics.fillRect(TILE_SIZE, (TILE_SIZE * 3) + 12, width - (TILE_SIZE * 2), 18);

        baseGraphics.fillStyle(COLORS.mat, 1);
        baseGraphics.fillRect((width / 2) - 20, height - TILE_SIZE, 40, TILE_SIZE - 6);

        this.decorRoot.add(baseGraphics);

        this.joySprite = this.scene.add.image((5 * TILE_SIZE) + 16, (4 * TILE_SIZE) + 12, "players", "nurse_front.png")
            .setOrigin(0.5, 1)
            .setDisplaySize(TILE_SIZE, TILE_SIZE * 2)
            .setDepth(6);

        this.pcUnit = createPcUnit(this.scene, TILE_SIZE * 1.1, TILE_SIZE * 3.15);
        this.machine = createHealingMachine(this.scene, width - (TILE_SIZE * 2.4), TILE_SIZE * 3.05);

        this.decorRoot.add(this.pcUnit.container);
        this.decorRoot.add(this.machine.container);
        this.decorRoot.add(this.joySprite);
        this.decorRoot.add(counterFrontGraphics);
    }

    createPrompt() {
        this.prompt = this.scene.add.text(0, 0, "Z PRAAT", {
            fontFamily: FONT_FAMILY,
            fontSize: "8px",
            color: "#ffffff",
            backgroundColor: "#1c1c2e",
            padding: { x: 6, y: 4 }
        }).setDepth(40).setVisible(false);
    }

    createUi() {
        this.uiRoot = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(1150).setVisible(false);

        this.flashOverlay = this.scene.add.rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0xffffff)
            .setOrigin(0)
            .setAlpha(0)
            .setScrollFactor(0)
            .setDepth(1140);

        this.uiPanel = this.scene.add.container(24, 302);
        this.uiPanel.add(this.createPanel(542, 116));
        this.nameTab = this.scene.add.container(36, 274);
        this.nameTab.add(this.createPanel(170, 38));
        this.nameText = this.createText(12, 10, "", 8);
        this.nameTab.add(this.nameText);

        this.dialogueLines = [
            this.createText(18, 18, "", 8),
            this.createText(18, 40, "", 8),
            this.createText(18, 62, "", 8),
            this.createText(18, 84, "", 8)
        ];
        this.dialogueLines.forEach((line) => this.uiPanel.add(line));

        this.cursor = this.createText(514, 84, "▌", 10, COLORS.cursor).setOrigin(1, 0);
        this.uiPanel.add(this.cursor);

        this.choicePanel = this.scene.add.container(594, 314).setVisible(false);
        this.choicePanel.add(this.createPanel(156, 84));
        this.choiceCursor = this.createText(14, 16, "►", 8);
        this.choiceLabels = [
            this.createText(34, 16, "", 8),
            this.createText(34, 42, "", 8)
        ];
        this.choicePanel.add(this.choiceCursor);
        this.choiceLabels.forEach((label) => this.choicePanel.add(label));

        this.uiRoot.add(this.uiPanel);
        this.uiRoot.add(this.nameTab);
        this.uiRoot.add(this.choicePanel);
    }

    createPanel(width, height) {
        const container = this.scene.add.container(0, 0);
        const shadow = this.scene.add.rectangle(3, 3, width, height, 0xd8d0c0).setOrigin(0);
        const background = this.scene.add.rectangle(0, 0, width, height, COLORS.panelBackground).setOrigin(0);
        background.setStrokeStyle(3, COLORS.panelBorder);
        container.add([shadow, background]);
        return container;
    }

    createText(x, y, value, size, color = COLORS.text) {
        return this.scene.add.text(x, y, value, {
            fontFamily: FONT_FAMILY,
            fontSize: `${size}px`,
            color
        });
    }

    findInteraction() {
        const player = this.scene.player;
        if (!player) {
            return null;
        }

        const interactions = [
            { kind: "joy", tile: this.definition.joy },
            { kind: "pc", tile: this.definition.pc }
        ];

        return interactions.find((interaction) => {
            const worldX = (interaction.tile.x * TILE_SIZE) + 16;
            const worldY = (interaction.tile.y * TILE_SIZE) + 22;
            return Phaser.Math.Distance.Between(player.x, player.y, worldX, worldY) <= 44;
        }) || null;
    }

    startJoyConversation() {
        updatePokemonCenterState({
            hasInteractedWithJoy: true
        });

        if (isPartyFullyHealed()) {
            this.showTextSequence("Zuster Joy", [
                "Welkom bij het",
                "Pokémon Center!"
            ], () => {
                this.showTextSequence("Zuster Joy", [
                    "Je Pokémons zien",
                    "er al prima uit!"
                ], () => {
                    this.showTextSequence("Zuster Joy", [
                        "Kom gerust terug",
                        "als je hulp nodig",
                        "hebt."
                    ]);
                });
            });
            return;
        }

        this.showTextSequence("Zuster Joy", [
            "Welkom bij het",
            "Pokémon Center!",
            "We herstellen je",
            "Pokémons volledig."
        ], () => {
            this.showChoice("Zuster Joy", [
                "Wil je dat ik je",
                "Pokémons herstel?"
            ], [
                {
                    label: "Ja!",
                    onSelect: async () => {
                        this.showTextSequence("Zuster Joy", [
                            "Oké! We zullen ze",
                            "goed verzorgen..."
                        ], async () => {
                            await this.playHealingAnimation();
                            healParty();
                            this.showTextSequence("Zuster Joy", [
                                "Je Pokémons zijn",
                                "volledig hersteld!",
                                "Veel succes op",
                                "je reis!"
                            ]);
                        });
                    }
                },
                {
                    label: "Nee",
                    onSelect: () => {
                        this.showTextSequence("Zuster Joy", [
                            "Oké! Kom gerust",
                            "terug als je hulp",
                            "nodig hebt."
                        ]);
                    }
                }
            ]);
        });
    }

    startPcConversation() {
        this.showChoice("Landon's PC", [
            "Wat wil je doen?"
        ], [
            {
                label: "Pokémon",
                onSelect: () => {
                    this.closeUi();
                    this.scene.menuUi.openPartyView();
                }
            },
            {
                label: "Log uit",
                onSelect: () => {
                    this.showTextSequence("Landon's PC", [
                        "De PC wordt",
                        "afgesloten."
                    ]);
                }
            }
        ]);
    }

    showTextSequence(name, lines, onComplete = null) {
        this.uiMode = "text";
        this.nameText.setText(name);
        this.textPages = splitDialogueLines(lines);
        this.textIndex = 0;
        this.onTextComplete = onComplete;
        this.choiceOptions = [];
        this.uiRoot.setVisible(true);
        this.choicePanel.setVisible(false);
        this.refreshUi();
    }

    showChoice(name, lines, options) {
        this.uiMode = "choice";
        this.nameText.setText(name);
        this.textPages = [splitDialogueLines(lines)[0]];
        this.textIndex = 0;
        this.selectedChoice = 0;
        this.choiceOptions = options;
        this.onChoice = null;
        this.uiRoot.setVisible(true);
        this.choicePanel.setVisible(true);
        this.refreshUi();
    }

    closeUi() {
        this.uiMode = "closed";
        this.uiRoot.setVisible(false);
        this.choicePanel.setVisible(false);
        this.flashOverlay.setAlpha(0);
        this.prompt.setVisible(false);
        this.scene.input.keyboard.resetKeys();
    }

    refreshUi() {
        if (!this.active || !this.uiRoot) {
            return;
        }

        if (this.uiMode === "closed") {
            this.uiRoot.setVisible(false);
            return;
        }

        this.uiRoot.setVisible(true);
        const currentPage = this.textPages[this.textIndex] || ["", "", "", ""];
        this.dialogueLines.forEach((line, index) => {
            line.setText(currentPage[index] || "");
        });
        this.cursor.setVisible(this.blinkVisible && this.uiMode !== "choice");

        this.choicePanel.setVisible(this.uiMode === "choice");
        this.choiceCursor.setVisible(this.blinkVisible && this.uiMode === "choice");
        if (this.uiMode === "choice") {
            this.choiceCursor.y = 16 + (this.selectedChoice * 26);
            this.choiceLabels.forEach((label, index) => {
                const option = this.choiceOptions[index];
                label.setText(option ? option.label : "");
                label.setColor(index === this.selectedChoice ? COLORS.cursor : COLORS.text);
            });
        }
    }

    updateUiInput() {
        if (this.isAnimating) {
            return;
        }

        if (this.uiMode === "text") {
            if (this.isConfirmPressed()) {
                this.advanceText();
            }
            return;
        }

        if (this.uiMode !== "choice") {
            return;
        }

        if (this.isUpPressed()) {
            this.selectedChoice = Phaser.Math.Wrap(this.selectedChoice - 1, 0, this.choiceOptions.length);
            this.refreshUi();
            return;
        }

        if (this.isDownPressed()) {
            this.selectedChoice = Phaser.Math.Wrap(this.selectedChoice + 1, 0, this.choiceOptions.length);
            this.refreshUi();
            return;
        }

        if (this.isCancelPressed()) {
            this.closeUi();
            return;
        }

        if (this.isConfirmPressed()) {
            const option = this.choiceOptions[this.selectedChoice];
            if (option?.onSelect) {
                option.onSelect();
            } else {
                this.closeUi();
            }
        }
    }

    advanceText() {
        this.textIndex += 1;
        if (this.textIndex < this.textPages.length) {
            this.refreshUi();
            return;
        }

        const onComplete = this.onTextComplete;
        this.onTextComplete = null;
        if (onComplete) {
            onComplete();
            return;
        }

        this.closeUi();
    }

    async playHealingAnimation() {
        this.isAnimating = true;
        this.closeUi();
        await this.tween({
            targets: this.joySprite,
            y: this.joySprite.y + 4,
            duration: 100,
            yoyo: true
        });

        await this.tween({
            targets: this.flashOverlay,
            alpha: 0.85,
            duration: 300,
            yoyo: true
        });

        for (let index = 0; index < 5; index += 1) {
            this.machine.light.setFillStyle(index % 2 === 0 ? COLORS.lightOn : COLORS.lightOff);
            await this.wait(80);
        }

        this.machine.slots.forEach((slot) => slot.setFillStyle(COLORS.slotOff));
        for (let index = 0; index < this.machine.slots.length; index += 1) {
            this.machine.slots[index].setFillStyle(COLORS.slotOn);
            this.machine.light.setFillStyle(COLORS.lightOn);
            await this.wait(200);
        }

        this.machine.light.setFillStyle(COLORS.lightOff);
        this.isAnimating = false;
    }

    tween(config) {
        return new Promise((resolve) => {
            this.scene.tweens.add({
                ...config,
                onComplete: () => resolve()
            });
        });
    }

    wait(delay) {
        return new Promise((resolve) => {
            this.scene.time.delayedCall(delay, resolve);
        });
    }

    isUpPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.w);
    }

    isDownPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.down) || Phaser.Input.Keyboard.JustDown(this.keys.s);
    }

    isConfirmPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.enter)
            || Phaser.Input.Keyboard.JustDown(this.keys.z)
            || Phaser.Input.Keyboard.JustDown(this.keys.a);
    }

    isCancelPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.escape) || Phaser.Input.Keyboard.JustDown(this.keys.x);
    }
}

function drawWindow(graphics, x, y) {
    graphics.fillStyle(0xc8f0ff, 1);
    graphics.fillRect(x, y, 36, 24);
    graphics.fillStyle(0x98d8ff, 1);
    graphics.fillRect(x + 2, y + 2, 14, 9);
    graphics.fillRect(x + 20, y + 2, 14, 9);
    graphics.fillRect(x + 2, y + 13, 14, 9);
    graphics.fillRect(x + 20, y + 13, 14, 9);
}

function createPcUnit(scene, x, y) {
    const container = scene.add.container(x, y).setDepth(4);
    const body = scene.add.rectangle(0, 0, 34, 30, COLORS.pcBody).setOrigin(0);
    const screen = scene.add.rectangle(6, 5, 22, 10, COLORS.pcScreen).setOrigin(0);
    const stand = scene.add.rectangle(10, 22, 14, 8, 0x304090).setOrigin(0);
    container.add([body, screen, stand]);
    return { container };
}

function createHealingMachine(scene, x, y) {
    const container = scene.add.container(x, y).setDepth(4);
    const body = scene.add.rectangle(0, 0, 42, 26, COLORS.machineBody).setOrigin(0);
    const light = scene.add.circle(33, 7, 4, COLORS.lightOff).setOrigin(0.5);
    const slots = [
        scene.add.circle(10, 18, 5, COLORS.slotOn),
        scene.add.circle(21, 18, 5, COLORS.slotOn),
        scene.add.circle(32, 18, 5, COLORS.slotOn)
    ];
    container.add([body, light, ...slots]);
    return { container, light, slots };
}

function splitDialogueLines(lines) {
    const source = Array.isArray(lines) ? lines : [lines];
    const wrapped = [];
    source.forEach((line) => {
        wrapDialogueLine(line, 22).forEach((wrappedLine) => wrapped.push(wrappedLine));
    });

    const pages = [];
    for (let index = 0; index < wrapped.length; index += 4) {
        pages.push([
            wrapped[index] || "",
            wrapped[index + 1] || "",
            wrapped[index + 2] || "",
            wrapped[index + 3] || ""
        ]);
    }

    return pages.length ? pages : [["", "", "", ""]];
}

function wrapDialogueLine(text, maxLength) {
    const words = (text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let currentLine = "";

    for (const word of words) {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (candidate.length > maxLength) {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
        } else {
            currentLine = candidate;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length ? lines : [""];
}
