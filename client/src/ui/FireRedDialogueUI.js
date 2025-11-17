import Phaser from "phaser";

const FONT_FAMILY = "\"Press Start 2P\"";
const COLORS = {
    panelBackground: 0x1c1c2e,
    panelBorder: 0xf0f0f0,
    text: "#ffffff",
    cursor: "#fff4a3",
    divider: 0xf0f0f0,
    accent: "#f8d800"
};

export default class FireRedDialogueUI {
    constructor(scene, callbacks) {
        this.scene = scene;
        this.callbacks = callbacks;
        this.isVisible = false;
        this.isLoading = false;
        this.selectedChoiceIndex = 0;
        this.payload = null;

        this.keys = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
            z: Phaser.Input.Keyboard.KeyCodes.Z,
            escape: Phaser.Input.Keyboard.KeyCodes.ESC,
            x: Phaser.Input.Keyboard.KeyCodes.X
        });

        this.createUi();
        this.blinkVisible = true;
        this.blinkEvent = this.scene.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                this.blinkVisible = !this.blinkVisible;
                this.refreshCursor();
            }
        });
    }

    destroy() {
        if (this.blinkEvent) {
            this.blinkEvent.remove();
        }

        this.root.destroy(true);
    }

    createUi() {
        this.root = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(1100).setVisible(false);

        this.dialogueContainer = this.scene.add.container(20, 278);
        this.dialogueContainer.add(this.createPanel(560, 150));
        this.dialogueContainer.add(this.createDivider(536, 32, 12));

        this.npcName = this.createText(16, 12, "", 10);
        this.emotionLabel = this.createText(390, 12, "", 8, COLORS.accent);
        this.storyCounter = this.createText(16, 126, "", 8, COLORS.accent);

        this.dialogueLines = [
            this.createText(18, 46, "", 8),
            this.createText(18, 68, "", 8),
            this.createText(18, 90, "", 8),
            this.createText(18, 112, "", 8)
        ];

        this.dialogueContainer.add(this.npcName);
        this.dialogueContainer.add(this.emotionLabel);
        this.dialogueContainer.add(this.storyCounter);
        this.dialogueLines.forEach((line) => this.dialogueContainer.add(line));

        this.choiceContainer = this.scene.add.container(596, 202);
        this.choiceContainer.add(this.createPanel(184, 226));
        this.choiceContainer.add(this.createText(16, 12, "KEUZES", 10));
        this.choiceContainer.add(this.createDivider(160, 32, 12));

        this.choiceCursor = this.createText(14, 48, "►", 10, COLORS.cursor);
        this.choiceLabels = [];
        for (let index = 0; index < 6; index += 1) {
            const label = this.createText(34, 48 + (index * 26), "", 8);
            this.choiceLabels.push(label);
            this.choiceContainer.add(label);
        }

        this.choiceContainer.add(this.choiceCursor);

        this.clueBanner = this.createText(20, 248, "", 8, COLORS.accent);

        this.root.add(this.dialogueContainer);
        this.root.add(this.choiceContainer);
        this.root.add(this.clueBanner);
    }

    update() {
        if (!this.isVisible || this.isLoading) {
            return;
        }

        if (this.isCancelPressed()) {
            this.close();
            return;
        }

        if (this.isUpPressed()) {
            this.selectedChoiceIndex = Phaser.Math.Wrap(this.selectedChoiceIndex - 1, 0, this.payload.response.availableChoices.length);
            this.refreshCursor();
            return;
        }

        if (this.isDownPressed()) {
            this.selectedChoiceIndex = Phaser.Math.Wrap(this.selectedChoiceIndex + 1, 0, this.payload.response.availableChoices.length);
            this.refreshCursor();
            return;
        }

        if (this.isConfirmPressed()) {
            const choice = this.payload.response.availableChoices[this.selectedChoiceIndex];
            if (choice.id === "GOODBYE") {
                this.close();
                return;
            }

            this.callbacks.onChoice(this.payload.npc, choice);
        }
    }

    isOpen() {
        return this.isVisible;
    }

    showLoading(npc) {
        this.isVisible = true;
        this.isLoading = true;
        this.root.setVisible(true);
        this.npcName.setText(npc.name);
        this.emotionLabel.setText("");
        this.storyCounter.setText("MYSTERIE 0 CLUES");
        this.dialogueLines[0].setText("...");
        this.dialogueLines[1].setText("");
        this.dialogueLines[2].setText("De emotie van het moment");
        this.dialogueLines[3].setText("wordt ingelezen.");
        this.choiceLabels.forEach((label) => label.setText(""));
        this.choiceCursor.setVisible(false);
        this.clueBanner.setText("");
    }

    showPayload(payload) {
        this.isVisible = true;
        this.isLoading = false;
        this.payload = payload;
        this.root.setVisible(true);
        this.selectedChoiceIndex = 0;

        this.npcName.setText(`${payload.npc.name}  ${payload.npc.title.toUpperCase()}`);
        this.emotionLabel.setText((payload.response.emotion?.label || "neutral").toUpperCase());
        this.storyCounter.setText(`MYSTERIE ${payload.story.clueCount} CLUES`);

        this.dialogueLines.forEach((line, index) => {
            line.setText(payload.response.lines[index] || "");
        });

        this.choiceLabels.forEach((label, index) => {
            const choice = payload.response.availableChoices[index];
            label.setText(choice ? choice.label : "");
            label.setColor(index === this.selectedChoiceIndex ? COLORS.accent : COLORS.text);
        });

        this.clueBanner.setText(payload.response.unlockedClue ? `NIEUWE CLUE: ${payload.response.unlockedClue.title}` : "");
        this.refreshCursor();
    }

    close() {
        this.isVisible = false;
        this.isLoading = false;
        this.payload = null;
        this.root.setVisible(false);
        this.callbacks.onClose();
    }

    refreshCursor() {
        if (!this.payload || this.isLoading) {
            this.choiceCursor.setVisible(false);
            return;
        }

        this.choiceCursor.setVisible(this.blinkVisible);
        this.choiceCursor.y = 48 + (this.selectedChoiceIndex * 26);
        this.choiceLabels.forEach((label, index) => {
            label.setColor(index === this.selectedChoiceIndex ? COLORS.accent : COLORS.text);
        });
    }

    createPanel(width, height) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(COLORS.panelBackground, 1);
        graphics.lineStyle(4, COLORS.panelBorder, 1);
        graphics.fillRoundedRect(0, 0, width, height, 4);
        graphics.strokeRoundedRect(0, 0, width, height, 4);
        return graphics;
    }

    createDivider(width, y, x) {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, COLORS.divider, 1);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x + width, y);
        graphics.strokePath();
        return graphics;
    }

    createText(x, y, value, size, color = COLORS.text) {
        return this.scene.add.text(x, y, value, {
            fontFamily: FONT_FAMILY,
            fontSize: `${size}px`,
            color
        });
    }

    isUpPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.w);
    }

    isDownPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.down) || Phaser.Input.Keyboard.JustDown(this.keys.s);
    }

    isConfirmPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.z);
    }

    isCancelPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.escape) || Phaser.Input.Keyboard.JustDown(this.keys.x);
    }
}
