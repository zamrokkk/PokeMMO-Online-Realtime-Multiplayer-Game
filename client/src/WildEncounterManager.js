import Phaser from "phaser";
import { ROUTE_ENCOUNTERS } from "./data/encounters";

export default class WildEncounterManager {
    constructor(scene, battleUi) {
        this.scene = scene;
        this.battleUi = battleUi;
        this.lastGrassTileKey = null;
        this.encounterCooldownUntil = 0;
    }

    update() {
        const encounterConfig = ROUTE_ENCOUNTERS[this.scene.mapName];
        if (!this.scene.player || !this.scene.grassLayer || this.battleUi.isOpen() || !encounterConfig) {
            return;
        }

        if (this.scene.menuUi?.isBlockingGameplayInput() || this.scene.dialogueUi?.isOpen()) {
            return;
        }

        const body = this.scene.player.body;
        if (!body || body.velocity.lengthSq() === 0) {
            return;
        }

        const tile = this.scene.grassLayer.getTileAtWorldXY(this.scene.player.x, this.scene.player.y + 14);
        if (!tile || tile.index < 0 || !this.isEncounterTile(tile)) {
            this.lastGrassTileKey = null;
            return;
        }

        const tileKey = `${tile.x}:${tile.y}`;
        if (tileKey === this.lastGrassTileKey) {
            return;
        }

        this.lastGrassTileKey = tileKey;

        if (this.scene.time.now < this.encounterCooldownUntil) {
            return;
        }

        const encounterRate = this.getEncounterRate(encounterConfig);
        if (Math.random() <= encounterRate) {
            this.encounterCooldownUntil = this.scene.time.now + 3000;
            this.battleUi.tryStartEncounter(this.rollEncounter(encounterConfig));
        }
    }

    getEncounterRate(encounterConfig) {
        const layerRate = this.scene.grassLayer.layer.properties?.find?.((property) => property.name === "encounterRate");
        return typeof layerRate?.value === "number" ? layerRate.value : encounterConfig.encounterRate;
    }

    isEncounterTile(tile) {
        if (tile.properties?.isTallGrass === true) {
            return true;
        }

        const layerTallGrass = this.scene.grassLayer.layer.properties?.find?.((property) => property.name === "isTallGrass");
        return layerTallGrass?.value === true;
    }

    rollEncounter(encounterConfig) {
        const totalWeight = encounterConfig.pokemonPool.reduce((sum, pokemon) => sum + pokemon.weight, 0);
        let roll = Math.random() * totalWeight;

        for (const entry of encounterConfig.pokemonPool) {
            roll -= entry.weight;
            if (roll <= 0) {
                return {
                    pokemonId: entry.pokemonId,
                    level: Phaser.Math.Between(entry.minLevel, entry.maxLevel)
                };
            }
        }

        const fallback = encounterConfig.pokemonPool[encounterConfig.pokemonPool.length - 1];
        return {
            pokemonId: fallback.pokemonId,
            level: Phaser.Math.Between(fallback.minLevel, fallback.maxLevel)
        };
    }
}
