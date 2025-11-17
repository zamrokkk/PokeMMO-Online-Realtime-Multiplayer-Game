import Phaser from "phaser";
import {
    assignHeldItem,
    formatPlayTime,
    getBagCategories,
    getGameState,
    getPokemonTextureKey,
    getSavePreview,
    saveGame,
    subscribeToGameState,
    swapPartyMembers,
    takeHeldItem,
    updateOption,
    useBagItem
} from "../state/gameState";

const FONT_FAMILY = "\"Press Start 2P\"";
const MENU_OPTIONS = [
    { id: "pokedex", label: "Pokédex" },
    { id: "pokemon", label: "Pokémon" },
    { id: "bag", label: "Bag" },
    { id: "save", label: "Save" },
    { id: "option", label: "Option" },
    { id: "exit", label: "Exit" }
];
const PARTY_ACTIONS = ["Summary", "Switch", "Item", "Cancel"];
const SUMMARY_TABS = ["INFO", "STATS", "MOVES", "MEMO"];
const OPTION_FIELDS = [
    { key: "textSpeed", label: "Text speed", values: ["slow", "mid", "fast"] },
    { key: "battleScene", label: "Battle scene", values: [true, false], format: (value) => (value ? "On" : "Off") },
    { key: "battleStyle", label: "Battle style", values: ["shift", "set"] },
    { key: "sound", label: "Sound", values: ["mono", "stereo"] },
    { key: "buttonMode", label: "Button mode", values: ["normal", "LR", "LA"] },
    { key: "pokedexLanguage", label: "Dex language", values: ["en", "de"], format: (value) => value === "de" ? "DE" : "EN" }
];

const COLORS = {
    startBackground: 0xf0ead8,
    panelBackground: 0xf0ead8,
    panelBlue: 0x2848c8,
    panelBlueDark: 0x1c2f88,
    panelBorder: 0x2c2c2c,
    text: "#2c2c2c",
    textOnBlue: "#ffffff",
    cursor: "#fff4a3",
    hpGreen: 0x48d848,
    hpYellow: 0xf8d800,
    hpRed: 0xf83800,
    hpBackground: 0xa0a0a0,
    selection: 0xf8d800,
    faintedTint: 0x666666,
    status: {
        PSN: "#a040a0",
        BRN: "#f87830",
        FRZ: "#98d8d8",
        PAR: "#f8d030",
        SLP: "#7098d8",
        FNT: "#585858"
    }
};

export default class FireRedMenuUI {
    constructor(scene) {
        this.scene = scene;
        this.state = getGameState();
        this.view = "closed";
        this.previousView = "start";
        this.startIndex = 0;
        this.partyIndex = 0;
        this.partyActionIndex = 0;
        this.switchSourceIndex = null;
        this.summaryIndex = 0;
        this.summaryPage = 0;
        this.summaryMoveIndex = 0;
        this.pokedexIndex = 0;
        this.pokedexScroll = 0;
        this.bagTabIndex = 0;
        this.bagItemIndex = 0;
        this.optionIndex = 0;
        this.itemMode = "none";
        this.pendingItemId = null;
        this.currentMessage = "";
        this.cursorVisible = true;
        this.loadingTextures = new Set();

        this.keys = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
            z: Phaser.Input.Keyboard.KeyCodes.Z,
            escape: Phaser.Input.Keyboard.KeyCodes.ESC,
            x: Phaser.Input.Keyboard.KeyCodes.X
        });

        this.createUi();

        this.blinkEvent = this.scene.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                this.cursorVisible = !this.cursorVisible;
                this.refreshVisibleView();
            }
        });

        this.unsubscribe = subscribeToGameState((state) => {
            this.state = state;
            this.refreshVisibleView();
        });
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        if (this.blinkEvent) {
            this.blinkEvent.remove(false);
        }

        if (this.messageEvent) {
            this.messageEvent.remove(false);
        }

        this.root.destroy(true);
    }

    isBlockingGameplayInput() {
        return this.view !== "closed";
    }

    update() {
        if (this.view === "closed") {
            if (this.isMenuOpenPressed()) {
                this.openStartMenu();
            }
            return;
        }

        if (this.view === "start") {
            this.handleStartInput();
            return;
        }

        if (this.view === "party") {
            this.handlePartyInput();
            return;
        }

        if (this.view === "summary") {
            this.handleSummaryInput();
            return;
        }

        if (this.view === "pokedex") {
            this.handlePokedexInput();
            return;
        }

        if (this.view === "bag") {
            this.handleBagInput();
            return;
        }

        if (this.view === "item-target") {
            this.handleItemTargetInput();
            return;
        }

        if (this.view === "save") {
            this.handleSaveInput();
            return;
        }

        if (this.view === "options") {
            this.handleOptionInput();
        }
    }

    openPartyView() {
        this.previousView = "start";
        this.openView("party");
    }

    createUi() {
        this.root = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);

        this.createStartMenu();
        this.createPartyScreen();
        this.createSummaryScreen();
        this.createPokedexScreen();
        this.createBagScreen();
        this.createSaveScreen();
        this.createOptionsScreen();
        this.createMessageBox();

        this.refreshVisibleView();
    }

    createStartMenu() {
        this.startMenuWidth = 220;
        this.startMenuHeight = 248;
        this.startMenuY = 28;
        this.startMenuClosedX = this.scene.scale.width + 16;
        this.startMenuOpenX = this.scene.scale.width - this.startMenuWidth - 20;

        this.startContainer = this.scene.add.container(this.startMenuClosedX, this.startMenuY).setVisible(false);
        this.startContainer.add(this.createPanelGraphics(this.startMenuWidth, this.startMenuHeight, COLORS.startBackground));
        this.startContainer.add(this.createDivider(16, 54, this.startMenuWidth - 32, COLORS.panelBorder));
        this.startName = this.createText(16, 18, "", 10);
        this.startCursor = this.createText(14, 78, "►", 10, COLORS.cursor);
        this.startLabels = MENU_OPTIONS.map((option, index) => {
            const label = this.createText(34, 78 + (index * 24), option.label, 10)
                .setInteractive({ useHandCursor: true })
                .on("pointerover", () => {
                    if (this.view !== "start") {
                        return;
                    }

                    this.startIndex = index;
                    this.refreshStartMenu();
                })
                .on("pointerdown", () => {
                    if (this.view !== "start") {
                        return;
                    }

                    this.startIndex = index;
                    this.refreshStartMenu();
                    this.activateStartOption(MENU_OPTIONS[index]?.id);
                });

            return label;
        });
        this.startContainer.add([this.startName, this.startCursor, ...this.startLabels]);
        this.root.add(this.startContainer);
    }

    createPartyScreen() {
        this.partyContainer = this.scene.add.container(32, 18).setVisible(false);
        this.partyContainer.add(this.createPanelGraphics(736, 406, COLORS.panelBlue));
        this.partyContainer.add(this.createText(18, 14, "POKEMON", 10, COLORS.textOnBlue));
        this.partyContainer.add(this.createText(18, 380, "X / ESC TERUG", 8, COLORS.textOnBlue));
        this.partyEntries = Array.from({ length: 6 }, (_, index) => this.createPartyEntry(18, 42 + (index * 54)));
        this.partyEntries.forEach((entry) => this.partyContainer.add(entry.container));

        this.partyActionPanel = this.scene.add.container(542, 126).setVisible(false);
        this.partyActionPanel.add(this.createPanelGraphics(170, 128, COLORS.panelBackground));
        this.partyActionCursor = this.createText(12, 16, "►", 8, COLORS.cursor);
        this.partyActionLabels = PARTY_ACTIONS.map((label, index) => this.createText(30, 16 + (index * 24), label, 8));
        this.partyActionPanel.add([this.partyActionCursor, ...this.partyActionLabels]);
        this.partyContainer.add(this.partyActionPanel);

        this.itemPanel = this.scene.add.container(470, 58).setVisible(false);
        this.itemPanel.add(this.createPanelGraphics(242, 286, COLORS.panelBackground));
        this.itemTitle = this.createText(14, 14, "ITEM", 8);
        this.itemCursor = this.createText(14, 42, "►", 8, COLORS.cursor);
        this.itemLabels = Array.from({ length: 8 }, (_, index) => this.createText(34, 42 + (index * 26), "", 8));
        this.itemPanel.add([this.itemTitle, this.itemCursor, ...this.itemLabels]);
        this.partyContainer.add(this.itemPanel);

        this.root.add(this.partyContainer);
    }

    createPartyEntry(x, y) {
        const container = this.scene.add.container(x, y);
        const background = this.scene.add.graphics();
        const cursor = this.createText(10, 16, "►", 10, COLORS.cursor);
        const sprite = this.scene.add.image(58, 24, "currentPlayer", "misa-front").setVisible(false).setScale(0.5);
        const name = this.createText(92, 10, "", 8, COLORS.textOnBlue);
        const status = this.scene.add.text(354, 10, "", {
            fontFamily: FONT_FAMILY,
            fontSize: "8px",
            color: "#ffffff",
            backgroundColor: COLORS.status.PSN,
            padding: { x: 4, y: 3 }
        }).setVisible(false);
        const level = this.createText(516, 10, "", 8, COLORS.textOnBlue);
        const hpBarBg = this.scene.add.graphics();
        const hpBarFill = this.scene.add.graphics();
        const hpText = this.createText(316, 28, "", 8, COLORS.textOnBlue);
        const heldItem = this.createText(92, 28, "", 8, COLORS.textOnBlue);
        container.add([background, cursor, sprite, name, status, level, hpBarBg, hpBarFill, hpText, heldItem]);
        return { container, background, cursor, sprite, name, status, level, hpBarBg, hpBarFill, hpText, heldItem };
    }

    createSummaryScreen() {
        this.summaryContainer = this.scene.add.container(54, 26).setVisible(false);
        this.summaryContainer.add(this.createPanelGraphics(692, 388, COLORS.panelBackground));
        this.summaryHeader = this.createText(20, 12, "", 10);
        this.summaryPageText = this.createText(520, 12, "", 8);
        this.summaryContainer.add([this.summaryHeader, this.summaryPageText]);

        this.summarySprite = this.scene.add.image(118, 118, "currentPlayer", "misa-front").setVisible(false).setScale(1.4);
        this.summaryInfoLines = Array.from({ length: 7 }, (_, index) => this.createText(236, 58 + (index * 30), "", 8));

        this.summaryStatsLines = Array.from({ length: 6 }, (_, index) => this.createText(68, 64 + (index * 46), "", 8));
        this.summaryStatBarsBg = Array.from({ length: 6 }, () => this.scene.add.graphics());
        this.summaryStatBarsFill = Array.from({ length: 6 }, () => this.scene.add.graphics());

        this.summaryMoveCursor = this.createText(28, 54, "►", 8, COLORS.cursor);
        this.summaryMoveLabels = Array.from({ length: 4 }, (_, index) => this.createText(54, 54 + (index * 58), "", 8));
        this.summaryMovePanel = this.scene.add.container(382, 64);
        this.summaryMovePanel.add(this.createPanelGraphics(270, 216, COLORS.panelBlueDark));
        this.summaryMoveDetail = Array.from({ length: 5 }, (_, index) => this.createText(14, 18 + (index * 34), "", 8, COLORS.textOnBlue));
        this.summaryMovePanel.add(this.summaryMoveDetail);

        this.summaryMemoLines = Array.from({ length: 6 }, (_, index) => this.createText(54, 68 + (index * 40), "", 8));
        this.summaryFooter = this.createText(136, 356, "LEFT/RIGHT BLADEREN  X TERUG", 8);

        this.summaryContainer.add([
            this.summarySprite,
            ...this.summaryInfoLines,
            ...this.summaryStatsLines,
            ...this.summaryStatBarsBg,
            ...this.summaryStatBarsFill,
            this.summaryMoveCursor,
            ...this.summaryMoveLabels,
            this.summaryMovePanel,
            ...this.summaryMemoLines,
            this.summaryFooter
        ]);

        this.root.add(this.summaryContainer);
    }

    createPokedexScreen() {
        this.pokedexContainer = this.scene.add.container(40, 18).setVisible(false);
        this.pokedexContainer.add(this.createPanelGraphics(720, 404, COLORS.panelBackground));
        this.pokedexContainer.add(this.createDivider(238, 12, 372, COLORS.panelBorder, true));
        this.pokedexContainer.add(this.createText(20, 14, "POKEDEX", 10));
        this.dexCursor = this.createText(18, 50, "►", 8, COLORS.cursor);
        this.dexEntries = Array.from({ length: 10 }, (_, index) => this.createText(40, 50 + (index * 32), "", 8));
        this.dexSprite = this.scene.add.image(378, 98, "currentPlayer", "misa-front").setVisible(false).setScale(1.2);
        this.dexDetailLines = Array.from({ length: 6 }, (_, index) => this.createText(320, 162 + (index * 28), "", 8));
        this.dexStatLabels = Array.from({ length: 6 }, (_, index) => this.createText(320, 92 + (index * 26), "", 8));
        this.dexStatBarsBg = Array.from({ length: 6 }, () => this.scene.add.graphics());
        this.dexStatBarsFill = Array.from({ length: 6 }, () => this.scene.add.graphics());
        this.dexFooter = this.createText(22, 374, "X / ESC TERUG", 8);
        this.pokedexContainer.add([
            this.dexCursor,
            ...this.dexEntries,
            this.dexSprite,
            ...this.dexDetailLines,
            ...this.dexStatLabels,
            ...this.dexStatBarsBg,
            ...this.dexStatBarsFill,
            this.dexFooter
        ]);
        this.root.add(this.pokedexContainer);
    }

    createBagScreen() {
        this.bagContainer = this.scene.add.container(38, 18).setVisible(false);
        this.bagContainer.add(this.createPanelGraphics(724, 404, COLORS.panelBackground));
        this.bagContainer.add(this.createText(20, 14, "BAG", 10));
        this.bagTabLabels = getBagCategories().map((category, index) => this.createText(22 + (index * 132), 44, category, 8));
        this.bagCursor = this.createText(18, 86, "►", 8, COLORS.cursor);
        this.bagItemLabels = Array.from({ length: 8 }, (_, index) => this.createText(40, 86 + (index * 32), "", 8));
        this.bagDetailPanel = this.scene.add.container(360, 82);
        this.bagDetailPanel.add(this.createPanelGraphics(340, 282, COLORS.panelBlueDark));
        this.bagDetailLines = Array.from({ length: 7 }, (_, index) => this.createText(16, 18 + (index * 36), "", 8, COLORS.textOnBlue));
        this.bagDetailPanel.add(this.bagDetailLines);
        this.bagFooter = this.createText(22, 374, "LEFT/RIGHT TAB  X TERUG", 8);
        this.bagContainer.add([...this.bagTabLabels, this.bagCursor, ...this.bagItemLabels, this.bagDetailPanel, this.bagFooter]);
        this.root.add(this.bagContainer);
    }

    createSaveScreen() {
        this.saveContainer = this.scene.add.container(178, 90).setVisible(false);
        this.saveContainer.add(this.createPanelGraphics(420, 238, COLORS.panelBackground));
        this.saveTitle = this.createText(18, 16, "SAVE", 10);
        this.saveLines = Array.from({ length: 5 }, (_, index) => this.createText(18, 56 + (index * 28), "", 8));
        this.saveButton = this.createText(118, 198, "► Opslaan", 10, COLORS.cursor);
        this.saveContainer.add([this.saveTitle, ...this.saveLines, this.saveButton]);
        this.root.add(this.saveContainer);
    }

    createOptionsScreen() {
        this.optionsContainer = this.scene.add.container(100, 44).setVisible(false);
        this.optionsContainer.add(this.createPanelGraphics(560, 360, COLORS.panelBackground));
        this.optionsContainer.add(this.createText(20, 14, "OPTION", 10));
        this.optionCursor = this.createText(16, 66, "►", 8, COLORS.cursor);
        this.optionLabels = OPTION_FIELDS.map((field, index) => this.createText(42, 66 + (index * 46), field.label, 8));
        this.optionValues = OPTION_FIELDS.map((field, index) => this.createText(360, 66 + (index * 46), "", 8));
        this.optionFooter = this.createText(20, 326, "LEFT/RIGHT WIJZIGEN  X TERUG", 8);
        this.optionsContainer.add([this.optionCursor, ...this.optionLabels, ...this.optionValues, this.optionFooter]);
        this.root.add(this.optionsContainer);
    }

    createMessageBox() {
        this.messageContainer = this.scene.add.container(160, 368).setVisible(false);
        this.messageContainer.add(this.createPanelGraphics(480, 48, COLORS.panelBackground));
        this.messageText = this.createText(18, 16, "", 8);
        this.messageContainer.add(this.messageText);
        this.root.add(this.messageContainer);
    }

    createPanelGraphics(width, height, fillColor = COLORS.panelBackground) {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(fillColor, 1);
        graphics.lineStyle(3, COLORS.panelBorder, 1);
        graphics.fillRoundedRect(0, 0, width, height, 4);
        graphics.strokeRoundedRect(0, 0, width, height, 4);
        return graphics;
    }

    createDivider(x, y, height, color, vertical = false) {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(2, color, 1);
        graphics.beginPath();
        graphics.moveTo(x, y);
        if (vertical) {
            graphics.lineTo(x, y + height);
        } else {
            graphics.lineTo(x + height, y);
        }
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

    openStartMenu() {
        this.startName.setText(this.state.player.name.toUpperCase());
        this.view = "start";
        this.startContainer.setVisible(true);
        this.startContainer.x = this.startMenuClosedX;
        this.refreshStartMenu();
        this.scene.tweens.killTweensOf(this.startContainer);
        this.scene.tweens.add({
            targets: this.startContainer,
            x: this.startMenuOpenX,
            duration: 100,
            ease: "Linear"
        });
    }

    closeMenu() {
        const closingView = this.view;
        this.view = "closed";
        this.partyActionPanel.setVisible(false);
        this.itemPanel.setVisible(false);
        this.hideAllScreens();
        this.scene.tweens.killTweensOf(this.startContainer);
        if (closingView === "start") {
            this.scene.tweens.add({
                targets: this.startContainer,
                x: this.startMenuClosedX,
                duration: 100,
                ease: "Linear",
                onComplete: () => {
                    this.startContainer.setVisible(false);
                }
            });
        } else {
            this.startContainer.setVisible(false);
            this.startContainer.x = this.startMenuClosedX;
        }
        this.messageContainer.setVisible(false);
        this.scene.input.keyboard.resetKeys();
    }

    openView(view) {
        this.view = view;
        if (view !== "start") {
            this.startContainer.setVisible(false);
            this.startContainer.x = this.startMenuClosedX;
        }
        this.refreshVisibleView();
    }

    hideAllScreens() {
        [
            this.startContainer,
            this.partyContainer,
            this.summaryContainer,
            this.pokedexContainer,
            this.bagContainer,
            this.saveContainer,
            this.optionsContainer
        ].forEach((container) => container.setVisible(false));
    }

    refreshVisibleView() {
        this.hideAllScreens();
        this.messageContainer.setVisible(Boolean(this.currentMessage));

        if (this.view === "start") {
            this.startContainer.setVisible(true);
            this.refreshStartMenu();
            return;
        }

        if (this.view === "party" || this.view === "item-target") {
            this.partyContainer.setVisible(true);
            this.refreshPartyView();
            return;
        }

        if (this.view === "summary") {
            this.summaryContainer.setVisible(true);
            this.refreshSummaryView();
            return;
        }

        if (this.view === "pokedex") {
            this.pokedexContainer.setVisible(true);
            this.refreshPokedexView();
            return;
        }

        if (this.view === "bag") {
            this.bagContainer.setVisible(true);
            this.refreshBagView();
            return;
        }

        if (this.view === "save") {
            this.saveContainer.setVisible(true);
            this.refreshSaveView();
            return;
        }

        if (this.view === "options") {
            this.optionsContainer.setVisible(true);
            this.refreshOptionView();
        }
    }

    handleStartInput() {
        if (this.isCancelPressed()) {
            this.closeMenu();
            return;
        }

        if (this.isUpPressed()) {
            this.startIndex = Phaser.Math.Wrap(this.startIndex - 1, 0, MENU_OPTIONS.length);
            this.refreshStartMenu();
            return;
        }

        if (this.isDownPressed()) {
            this.startIndex = Phaser.Math.Wrap(this.startIndex + 1, 0, MENU_OPTIONS.length);
            this.refreshStartMenu();
            return;
        }

        if (this.isConfirmPressed()) {
            this.activateStartOption(MENU_OPTIONS[this.startIndex]?.id);
        }
    }

    activateStartOption(option) {
        if (option === "exit") {
            this.closeMenu();
            return;
        }
        if (option === "pokemon") {
            this.previousView = "start";
            this.openView("party");
            return;
        }
        if (option === "pokedex") {
            this.openView("pokedex");
            return;
        }
        if (option === "bag") {
            this.openView("bag");
            return;
        }
        if (option === "save") {
            this.openView("save");
            return;
        }
        if (option === "option") {
            this.openView("options");
        }
    }

    handlePartyInput() {
        if (this.itemMode === "hold") {
            this.handleHoldItemInput();
            return;
        }

        if (this.itemMode === "action") {
            this.handlePartyActionInput();
            return;
        }

        if (this.view === "item-target") {
            if (this.isCancelPressed()) {
                this.openView("bag");
                return;
            }
            if (this.isUpPressed()) {
                this.partyIndex = Phaser.Math.Wrap(this.partyIndex - 1, 0, this.state.party.length);
                this.refreshPartyView();
                return;
            }
            if (this.isDownPressed()) {
                this.partyIndex = Phaser.Math.Wrap(this.partyIndex + 1, 0, this.state.party.length);
                this.refreshPartyView();
                return;
            }
            if (this.isConfirmPressed() && this.pendingItemId) {
                const result = useBagItem(this.pendingItemId, this.partyIndex);
                this.showMessage(result.message);
                if (result.success) {
                    this.pendingItemId = null;
                    this.openView("bag");
                } else {
                    this.refreshPartyView();
                }
            }
            return;
        }

        if (this.isCancelPressed()) {
            this.openView(this.previousView);
            return;
        }

        if (this.isUpPressed()) {
            this.partyIndex = Phaser.Math.Wrap(this.partyIndex - 1, 0, this.state.party.length);
            this.refreshPartyView();
            return;
        }

        if (this.isDownPressed()) {
            this.partyIndex = Phaser.Math.Wrap(this.partyIndex + 1, 0, this.state.party.length);
            this.refreshPartyView();
            return;
        }

        if (this.switchSourceIndex !== null && this.isConfirmPressed()) {
            const success = swapPartyMembers(this.switchSourceIndex, this.partyIndex);
            const firstName = this.state.party[this.switchSourceIndex]?.name || "";
            const secondName = this.state.party[this.partyIndex]?.name || "";
            this.switchSourceIndex = null;
            if (success) {
                this.showMessage(`${firstName} en ${secondName} gewisseld!`);
            }
            this.refreshPartyView();
            return;
        }

        if (this.isConfirmPressed()) {
            this.itemMode = "action";
            this.partyActionIndex = 0;
            this.refreshPartyView();
        }
    }

    handlePartyActionInput() {
        if (this.isCancelPressed()) {
            this.itemMode = "none";
            this.refreshPartyView();
            return;
        }

        if (this.isUpPressed()) {
            this.partyActionIndex = Phaser.Math.Wrap(this.partyActionIndex - 1, 0, PARTY_ACTIONS.length);
            this.refreshPartyView();
            return;
        }

        if (this.isDownPressed()) {
            this.partyActionIndex = Phaser.Math.Wrap(this.partyActionIndex + 1, 0, PARTY_ACTIONS.length);
            this.refreshPartyView();
            return;
        }

        if (this.isConfirmPressed()) {
            const action = PARTY_ACTIONS[this.partyActionIndex];
            if (action === "Cancel") {
                this.itemMode = "none";
                this.refreshPartyView();
                return;
            }
            if (action === "Summary") {
                this.summaryIndex = this.partyIndex;
                this.summaryPage = 0;
                this.summaryMoveIndex = 0;
                this.itemMode = "none";
                this.openView("summary");
                return;
            }
            if (action === "Switch") {
                this.switchSourceIndex = this.partyIndex;
                this.itemMode = "none";
                this.showMessage(`${this.state.party[this.partyIndex]?.name} geselecteerd.`);
                this.refreshPartyView();
                return;
            }
            if (action === "Item") {
                const pokemon = this.state.party[this.partyIndex];
                if (pokemon?.heldItem) {
                    const result = takeHeldItem(this.partyIndex);
                    this.itemMode = "none";
                    this.showMessage(result.message);
                    this.refreshPartyView();
                    return;
                }

                this.itemMode = "hold";
                this.partyActionIndex = 0;
                this.refreshPartyView();
            }
        }
    }

    handleHoldItemInput() {
        const holdableItems = this.getHoldableItems();
        if (this.isCancelPressed()) {
            this.itemMode = "none";
            this.refreshPartyView();
            return;
        }

        if (this.isUpPressed()) {
            this.partyActionIndex = Phaser.Math.Wrap(this.partyActionIndex - 1, 0, holdableItems.length + 1);
            this.refreshPartyView();
            return;
        }

        if (this.isDownPressed()) {
            this.partyActionIndex = Phaser.Math.Wrap(this.partyActionIndex + 1, 0, holdableItems.length + 1);
            this.refreshPartyView();
            return;
        }

        if (this.isConfirmPressed()) {
            if (this.partyActionIndex >= holdableItems.length) {
                this.itemMode = "none";
                this.refreshPartyView();
                return;
            }

            const result = assignHeldItem(this.partyIndex, holdableItems[this.partyActionIndex].id);
            this.itemMode = "none";
            this.showMessage(result.message);
            this.refreshPartyView();
        }
    }

    handleSummaryInput() {
        if (this.isCancelPressed()) {
            this.openView("party");
            return;
        }

        if (this.summaryPage === 2) {
            const moves = this.state.party[this.summaryIndex]?.moves || [];
            if (this.isUpPressed()) {
                this.summaryMoveIndex = Phaser.Math.Wrap(this.summaryMoveIndex - 1, 0, Math.max(1, moves.length));
                this.refreshSummaryView();
                return;
            }
            if (this.isDownPressed()) {
                this.summaryMoveIndex = Phaser.Math.Wrap(this.summaryMoveIndex + 1, 0, Math.max(1, moves.length));
                this.refreshSummaryView();
                return;
            }
        }

        if (this.isLeftPressed()) {
            this.summaryPage = Phaser.Math.Wrap(this.summaryPage - 1, 0, SUMMARY_TABS.length);
            this.refreshSummaryView();
            return;
        }

        if (this.isRightPressed()) {
            this.summaryPage = Phaser.Math.Wrap(this.summaryPage + 1, 0, SUMMARY_TABS.length);
            this.refreshSummaryView();
        }
    }

    handlePokedexInput() {
        if (this.isCancelPressed()) {
            this.openView("start");
            return;
        }

        if (this.isUpPressed()) {
            this.pokedexIndex = Phaser.Math.Wrap(this.pokedexIndex - 1, 0, this.state.pokedex.length);
            this.keepDexIndexVisible();
            this.refreshPokedexView();
            return;
        }

        if (this.isDownPressed()) {
            this.pokedexIndex = Phaser.Math.Wrap(this.pokedexIndex + 1, 0, this.state.pokedex.length);
            this.keepDexIndexVisible();
            this.refreshPokedexView();
        }
    }

    handleBagInput() {
        const items = this.getVisibleBagItems();
        if (this.isCancelPressed()) {
            this.openView("start");
            return;
        }

        if (this.isLeftPressed()) {
            this.bagTabIndex = Phaser.Math.Wrap(this.bagTabIndex - 1, 0, getBagCategories().length);
            this.bagItemIndex = 0;
            this.refreshBagView();
            return;
        }

        if (this.isRightPressed()) {
            this.bagTabIndex = Phaser.Math.Wrap(this.bagTabIndex + 1, 0, getBagCategories().length);
            this.bagItemIndex = 0;
            this.refreshBagView();
            return;
        }

        if (this.isUpPressed()) {
            this.bagItemIndex = Phaser.Math.Wrap(this.bagItemIndex - 1, 0, Math.max(items.length, 1));
            this.refreshBagView();
            return;
        }

        if (this.isDownPressed()) {
            this.bagItemIndex = Phaser.Math.Wrap(this.bagItemIndex + 1, 0, Math.max(items.length, 1));
            this.refreshBagView();
            return;
        }

        if (this.isConfirmPressed() && items.length) {
            const item = items[this.bagItemIndex];
            if (!item) {
                return;
            }

            if (item.effect.type === "heal_hp" || item.effect.type === "heal_status" || item.effect.type === "revive" || item.effect.type === "tm") {
                this.pendingItemId = item.id;
                this.partyIndex = 0;
                this.openView("item-target");
                return;
            }

            this.showMessage("Dat item kun je hier niet gebruiken.");
        }
    }

    handleItemTargetInput() {
        this.handlePartyInput();
    }

    handleSaveInput() {
        if (this.isCancelPressed()) {
            this.openView("start");
            return;
        }

        if (this.isConfirmPressed()) {
            saveGame();
            this.showMessage("SPEL OPGESLAGEN.");
            this.refreshSaveView();
        }
    }

    handleOptionInput() {
        if (this.isCancelPressed()) {
            this.openView("start");
            return;
        }

        if (this.isUpPressed()) {
            this.optionIndex = Phaser.Math.Wrap(this.optionIndex - 1, 0, OPTION_FIELDS.length);
            this.refreshOptionView();
            return;
        }

        if (this.isDownPressed()) {
            this.optionIndex = Phaser.Math.Wrap(this.optionIndex + 1, 0, OPTION_FIELDS.length);
            this.refreshOptionView();
            return;
        }

        if (this.isLeftPressed()) {
            this.cycleOption(-1);
            return;
        }

        if (this.isRightPressed()) {
            this.cycleOption(1);
        }
    }

    cycleOption(direction) {
        const field = OPTION_FIELDS[this.optionIndex];
        const currentValue = this.state.options[field.key];
        const currentIndex = field.values.findIndex((value) => value === currentValue);
        const nextIndex = Phaser.Math.Wrap(currentIndex + direction, 0, field.values.length);
        updateOption(field.key, field.values[nextIndex]);
        this.refreshOptionView();
    }

    refreshStartMenu() {
        this.startName.setText(this.state.player.name.toUpperCase());
        this.startCursor.setVisible(this.cursorVisible);
        this.startCursor.y = 78 + (this.startIndex * 24);
        this.startLabels.forEach((label, index) => {
            label.setColor(index === this.startIndex ? COLORS.cursor : COLORS.text);
        });
    }

    refreshPartyView() {
        this.partyEntries.forEach((entry, index) => {
            const pokemon = this.state.party[index];
            const isSelected = index === this.partyIndex;
            const isSwitchSource = index === this.switchSourceIndex;
            this.drawPartyCard(entry.background, isSelected, isSwitchSource);
            entry.cursor.setVisible(this.cursorVisible && isSelected && this.itemMode === "none" && this.switchSourceIndex === null && this.view === "party");

            if (!pokemon) {
                entry.container.setVisible(false);
                return;
            }

            entry.container.setVisible(true);
            entry.name.setText(pokemon.name.toUpperCase());
            entry.level.setText(`Lv.${pokemon.level}`);
            entry.hpText.setText(`${pokemon.stats.hp}/${pokemon.stats.maxHp}`);
            entry.heldItem.setText(pokemon.heldItem ? `Item: ${pokemon.heldItem.name}` : "");

            const textureKey = getPokemonTextureKey(pokemon.id);
            if (this.scene.textures.exists(textureKey)) {
                entry.sprite.setTexture(textureKey).setVisible(true);
            }
            entry.sprite.clearTint();
            entry.sprite.setAlpha(1);
            if (pokemon.stats.hp <= 0) {
                entry.sprite.setTint(COLORS.faintedTint);
                entry.sprite.setAlpha(0.8);
            }

            const statusCode = this.getStatusCode(pokemon);
            entry.status.setVisible(Boolean(statusCode));
            if (statusCode) {
                entry.status.setText(statusCode);
                entry.status.setStyle({ backgroundColor: this.getStatusColor(statusCode) });
            }

            const hpPct = pokemon.stats.maxHp > 0 ? pokemon.stats.hp / pokemon.stats.maxHp : 0;
            this.drawBar(entry.hpBarBg, 188, 29, 126, 8, COLORS.hpBackground);
            this.drawBar(entry.hpBarFill, 188, 29, Math.round(126 * hpPct), 8, this.getHpColor(hpPct));
        });

        this.partyActionPanel.setVisible(this.itemMode === "action");
        if (this.itemMode === "action") {
            this.partyActionCursor.setVisible(this.cursorVisible);
            this.partyActionCursor.y = 16 + (this.partyActionIndex * 24);
            this.partyActionLabels.forEach((label, index) => {
                label.setColor(index === this.partyActionIndex ? COLORS.cursor : COLORS.text);
            });
        }

        const holdableItems = this.getHoldableItems();
        this.itemPanel.setVisible(this.itemMode === "hold");
        if (this.itemMode === "hold") {
            this.itemTitle.setText("HELD ITEM");
            this.itemCursor.setVisible(this.cursorVisible);
            this.itemCursor.y = 42 + (this.partyActionIndex * 26);
            this.itemLabels.forEach((label, index) => {
                const item = holdableItems[index];
                if (index < holdableItems.length) {
                    label.setText(`${item.name} x${item.quantity}`);
                } else if (index === holdableItems.length) {
                    label.setText("Cancel");
                } else {
                    label.setText("");
                }
                label.setColor(index === this.partyActionIndex ? COLORS.cursor : COLORS.text);
            });
        }
    }

    refreshSummaryView() {
        const pokemon = this.state.party[this.summaryIndex];
        if (!pokemon) {
            return;
        }

        this.summaryHeader.setText(`${pokemon.name.toUpperCase()}  ${SUMMARY_TABS[this.summaryPage]}`);
        this.summaryPageText.setText(`${this.summaryPage + 1}/4`);
        const textureKey = getPokemonTextureKey(pokemon.id);
        if (this.scene.textures.exists(textureKey)) {
            this.summarySprite.setTexture(textureKey).setVisible(true);
        }

        this.summaryInfoLines.forEach((line) => line.setVisible(this.summaryPage === 0));
        this.summaryStatsLines.forEach((line) => line.setVisible(this.summaryPage === 1));
        this.summaryStatBarsBg.forEach((line) => line.clear());
        this.summaryStatBarsFill.forEach((line) => line.clear());
        this.summaryMoveCursor.setVisible(this.summaryPage === 2 && this.cursorVisible);
        this.summaryMoveLabels.forEach((line) => line.setVisible(this.summaryPage === 2));
        this.summaryMovePanel.setVisible(this.summaryPage === 2);
        this.summaryMoveDetail.forEach((line) => line.setVisible(this.summaryPage === 2));
        this.summaryMemoLines.forEach((line) => line.setVisible(this.summaryPage === 3));

        if (this.summaryPage === 0) {
            const nextLevelExp = Math.max(pokemon.exp + 3000, Math.floor(pokemon.exp * 1.28));
            const lines = [
                `No. ${String(pokemon.id).padStart(3, "0")}  Lv. ${pokemon.level}`,
                `OT: ${pokemon.originalTrainer}`,
                `ID: ${String(pokemon.trainerId).padStart(5, "0")}`,
                `EXP: ${pokemon.exp} / ${nextLevelExp}`,
                `${pokemon.type.join(" / ")}`,
                `Item: ${pokemon.heldItem?.name || "Geen"}`,
                `${pokemon.category || ""}`
            ];
            this.summaryInfoLines.forEach((line, index) => line.setText(lines[index] || ""));
            return;
        }

        if (this.summaryPage === 1) {
            const stats = [
                ["Max HP", pokemon.stats.maxHp],
                ["Aanval", pokemon.stats.attack],
                ["Verdediging", pokemon.stats.defense],
                ["Sp.Atk", pokemon.stats.spAttack],
                ["Sp.Def", pokemon.stats.spDefense],
                ["Snelheid", pokemon.stats.speed]
            ];
            stats.forEach(([label, value], index) => {
                this.summaryStatsLines[index].setText(`${label.padEnd(11, " ")} ${String(value)}`);
                this.drawBar(this.summaryStatBarsBg[index], 214, 72 + (index * 46), 200, 10, COLORS.hpBackground);
                this.drawBar(this.summaryStatBarsFill[index], 214, 72 + (index * 46), Math.min(200, Math.round((value / 180) * 200)), 10, COLORS.hpGreen);
            });
            return;
        }

        if (this.summaryPage === 2) {
            const moves = pokemon.moves || [];
            this.summaryMoveCursor.y = 54 + (this.summaryMoveIndex * 58);
            this.summaryMoveLabels.forEach((line, index) => {
                const move = moves[index];
                if (!move) {
                    line.setText("");
                    return;
                }
                line.setColor(this.getPpColor(move));
                line.setText(`${move.displayName}\nPP ${move.currentPp}/${move.maxPp}\n[${move.type}]`);
            });
            const selectedMove = moves[this.summaryMoveIndex];
            const detailLines = selectedMove
                ? [
                    selectedMove.displayName,
                    `${selectedMove.type} - ${selectedMove.category}`,
                    `Kracht: ${selectedMove.power ?? "--"}`,
                    `Acc: ${selectedMove.accuracy ?? "--"}`,
                    selectedMove.desc
                ]
                : ["Geen move"];
            this.summaryMoveDetail.forEach((line, index) => line.setText(detailLines[index] || ""));
            return;
        }

        const memoLines = [
            `Nature: ${pokemon.nature}`,
            `Met op: ${pokemon.met?.mapId || "Onbekend"}`,
            `Niveau bij vangen: ${pokemon.met?.level || pokemon.level}`,
            `Status: ${this.getStatusCode(pokemon) || "OK"}`,
            `Beschrijving:`,
            pokemon.description || "Geen memo beschikbaar."
        ];
        this.summaryMemoLines.forEach((line, index) => line.setText(memoLines[index] || ""));
    }

    refreshPokedexView() {
        const visibleEntries = this.state.pokedex.slice(this.pokedexScroll, this.pokedexScroll + 10);
        this.dexCursor.setVisible(this.cursorVisible);
        this.dexCursor.y = 50 + ((this.pokedexIndex - this.pokedexScroll) * 32);
        visibleEntries.forEach((entry, index) => {
            const label = this.dexEntries[index];
            if (!entry) {
                label.setText("");
                return;
            }
            const isUnseen = entry.state === "unseen";
            label.setText(`#${String(entry.id).padStart(3, "0")} ${isUnseen ? "?????????" : this.getLocalizedDexValue(entry, "name")}`);
            label.setColor((this.pokedexIndex - this.pokedexScroll) === index ? COLORS.cursor : COLORS.text);
        });

        const entry = this.state.pokedex[this.pokedexIndex];
        if (!entry) {
            return;
        }

        const textureKey = getPokemonTextureKey(entry.id);
        if (entry.state !== "unseen" && entry.sprite) {
            this.ensureTexture(textureKey, entry.sprite);
        }
        if (entry.state !== "unseen" && this.scene.textures.exists(textureKey)) {
            this.dexSprite.setTexture(textureKey).setVisible(true);
        } else {
            this.dexSprite.setVisible(false);
        }

        this.dexDetailLines.forEach((line) => line.setText(""));
        this.dexStatLabels.forEach((line) => line.setText(""));
        this.dexStatBarsBg.forEach((bar) => bar.clear());
        this.dexStatBarsFill.forEach((bar) => bar.clear());

        if (entry.state === "unseen") {
            this.dexDetailLines[0].setText("Deze Pokémon is nog niet gezien.");
            return;
        }

        this.dexDetailLines[0].setText(this.getLocalizedDexValue(entry, "name").toUpperCase());
        this.dexDetailLines[1].setText(this.getLocalizedDexValue(entry, "category"));
        this.dexDetailLines[2].setText(entry.state === "caught" ? "[Gevangen]" : "[Gezien]");
        this.dexDetailLines[3].setText(entry.types.join(" / "));
        this.dexDetailLines[4].setText(`Lengte ${entry.height} m  Gewicht ${entry.weight} kg`);
        this.dexDetailLines[5].setText(entry.state === "caught" ? this.getLocalizedDexValue(entry, "description") : "Meer data komt na vangen.");

        if (entry.state === "caught") {
            const stats = [
                ["HP", entry.baseStats.hp],
                ["ATK", entry.baseStats.attack],
                ["DEF", entry.baseStats.defense],
                ["SPA", entry.baseStats.spAtk],
                ["SPD", entry.baseStats.spDef],
                ["SPE", entry.baseStats.speed]
            ];
            stats.forEach(([label, value], index) => {
                this.dexStatLabels[index].setText(`${label} ${String(value).padStart(3, " ")}`);
                this.drawBar(this.dexStatBarsBg[index], 438, 100 + (index * 26), 120, 8, COLORS.hpBackground);
                this.drawBar(this.dexStatBarsFill[index], 438, 100 + (index * 26), Math.min(120, Math.round((value / 160) * 120)), 8, COLORS.hpGreen);
            });
        }
    }

    refreshBagView() {
        const categories = getBagCategories();
        const items = this.getVisibleBagItems();
        this.bagTabLabels.forEach((label, index) => {
            label.setColor(index === this.bagTabIndex ? COLORS.cursor : COLORS.text);
        });
        this.bagCursor.setVisible(this.cursorVisible && items.length > 0);
        this.bagCursor.y = 86 + (this.bagItemIndex * 32);

        this.bagItemLabels.forEach((label, index) => {
            const item = items[index];
            if (!item) {
                label.setText("");
                return;
            }
            label.setText(`${item.name} x${item.quantity}`);
            label.setColor(index === this.bagItemIndex ? COLORS.cursor : COLORS.text);
        });

        const item = items[this.bagItemIndex] || null;
        const details = item
            ? [
                item.name,
                `Categorie: ${categories[this.bagTabIndex]}`,
                `Aantal: ${item.quantity}`,
                `Type: ${item.effect.type}`,
                item.effect.value ? `Waarde: ${item.effect.value}` : "",
                item.effect.status ? `Status: ${item.effect.status}` : "",
                item.desc
            ]
            : ["Geen items in deze tab."];
        this.bagDetailLines.forEach((line, index) => line.setText(details[index] || ""));
    }

    refreshSaveView() {
        const preview = getSavePreview();
        this.saveLines[0].setText(`Trainer: ${preview.playerName}`);
        this.saveLines[1].setText(`Badges: ${preview.badges}`);
        this.saveLines[2].setText(`Pokedex: ${preview.pokedexSeen} seen / ${preview.pokedexCaught} caught`);
        this.saveLines[3].setText(`Speeltijd: ${formatPlayTime(preview.playTime)}`);
        this.saveLines[4].setText(`Save slot: ${preview.saveSlot}`);
        this.saveButton.setColor(COLORS.cursor);
    }

    refreshOptionView() {
        this.optionCursor.setVisible(this.cursorVisible);
        this.optionCursor.y = 66 + (this.optionIndex * 46);
        OPTION_FIELDS.forEach((field, index) => {
            const value = this.state.options[field.key];
            const formattedValue = field.format ? field.format(value) : String(value).toUpperCase();
            this.optionLabels[index].setColor(index === this.optionIndex ? COLORS.cursor : COLORS.text);
            this.optionValues[index].setText(formattedValue);
            this.optionValues[index].setColor(index === this.optionIndex ? COLORS.cursor : COLORS.text);
        });
    }

    drawPartyCard(graphics, isSelected, isSwitchSource) {
        graphics.clear();
        graphics.fillStyle(COLORS.panelBlueDark, 1);
        graphics.lineStyle(2, isSwitchSource ? COLORS.selection : COLORS.panelBackground, 1);
        graphics.fillRoundedRect(0, 0, 700, 46, 4);
        graphics.strokeRoundedRect(0, 0, 700, 46, 4);
        if (isSelected) {
            graphics.lineStyle(3, COLORS.selection, 1);
            graphics.strokeRoundedRect(2, 2, 696, 42, 4);
        }
    }

    drawBar(graphics, x, y, width, height, color) {
        graphics.clear();
        if (width <= 0) {
            return;
        }
        graphics.fillStyle(color, 1);
        graphics.fillRect(x, y, width, height);
    }

    getVisibleBagItems() {
        const category = getBagCategories()[this.bagTabIndex];
        return this.state.bag[category] || [];
    }

    getHoldableItems() {
        return [...(this.state.bag.Berries || []), ...(this.state.bag["Key Items"] || []).filter((item) => item.holdable)];
    }

    keepDexIndexVisible() {
        if (this.pokedexIndex < this.pokedexScroll) {
            this.pokedexScroll = this.pokedexIndex;
        } else if (this.pokedexIndex >= this.pokedexScroll + 10) {
            this.pokedexScroll = this.pokedexIndex - 9;
        }
    }

    getStatusCode(pokemon) {
        if (pokemon.stats.hp <= 0) {
            return "FNT";
        }

        return pokemon.status || "";
    }

    getStatusColor(statusCode) {
        return COLORS.status[statusCode] || COLORS.panelBackground;
    }

    getHpColor(percent) {
        if (percent > 0.5) {
            return COLORS.hpGreen;
        }
        if (percent > 0.25) {
            return COLORS.hpYellow;
        }
        return COLORS.hpRed;
    }

    getPpColor(move) {
        const ratio = move.maxPp > 0 ? move.currentPp / move.maxPp : 0;
        if (move.currentPp <= 0) {
            return "#585858";
        }
        if (ratio <= 0.25) {
            return "#f83800";
        }
        if (ratio <= 0.5) {
            return "#f8d800";
        }
        return "#ffffff";
    }

    getLocalizedDexValue(entry, field) {
        const languageCode = this.state.options?.pokedexLanguage || "en";
        return entry.localizedDex?.[languageCode]?.[field]
            || entry.localizedDex?.en?.[field]
            || entry[field]
            || "";
    }

    showMessage(message, duration = 1200) {
        this.currentMessage = message;
        this.messageText.setText(message);
        this.messageContainer.setVisible(true);

        if (this.messageEvent) {
            this.messageEvent.remove(false);
        }

        this.messageEvent = this.scene.time.delayedCall(duration, () => {
            this.currentMessage = "";
            this.messageContainer.setVisible(false);
            this.messageEvent = null;
        });
    }

    ensureTexture(key, url) {
        if (!key || !url || this.scene.textures.exists(key) || this.loadingTextures.has(key)) {
            return;
        }

        this.loadingTextures.add(key);
        this.scene.load.image(key, url);
        this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
            this.loadingTextures.delete(key);
            this.refreshVisibleView();
        });
        this.scene.load.start();
    }

    isMenuOpenPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.escape) || Phaser.Input.Keyboard.JustDown(this.keys.enter);
    }

    isUpPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.w);
    }

    isDownPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.down) || Phaser.Input.Keyboard.JustDown(this.keys.s);
    }

    isLeftPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.left) || Phaser.Input.Keyboard.JustDown(this.keys.a);
    }

    isRightPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.right) || Phaser.Input.Keyboard.JustDown(this.keys.d);
    }

    isConfirmPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.z);
    }

    isCancelPressed() {
        return Phaser.Input.Keyboard.JustDown(this.keys.escape) || Phaser.Input.Keyboard.JustDown(this.keys.x);
    }
}
