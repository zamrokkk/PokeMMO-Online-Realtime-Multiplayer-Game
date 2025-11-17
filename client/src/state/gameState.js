const GAME_STATE_STORAGE_KEY = "pokemmo.game-state.v3";
const POKEMON_CACHE_STORAGE_KEY = "pokemmo.pokemon-cache.v3";
const MOVE_CACHE_STORAGE_KEY = "pokemmo.move-cache.v2";
const SAVE_SLOT_PREFIX = "save_slot_";
const SAVE_DATA_VERSION = 1;

const DEFAULT_TRAINER_NAME = "LANDON";
const DEFAULT_RIVAL_NAME = "BLUE";
const DEFAULT_PLAYER_ID = 12345;
const DEFAULT_MONEY = 3000;
const DEFAULT_SAVE_SLOT = 1;
const DEFAULT_BOX_COUNT = 14;
const DEFAULT_BOX_CAPACITY = 30;
const KANTO_GENERATION_ID = 1;
const KANTO_TARGET_COUNT = 151;
const SUPPORTED_POKEDEX_LANGUAGES = ["en", "de"];
const POKEMON_CACHE_LOCALIZATION_VERSION = 1;

const DEFAULT_OPTIONS = {
    textSpeed: "fast",
    battleScene: true,
    battleStyle: "shift",
    sound: "stereo",
    buttonMode: "normal",
    pokedexLanguage: "en"
};

const DEFAULT_PLAYER_STATE = {
    name: DEFAULT_TRAINER_NAME,
    id: DEFAULT_PLAYER_ID,
    gender: "male",
    rival: DEFAULT_RIVAL_NAME,
    position: {
        mapId: "town",
        x: 352,
        y: 1216,
        facing: "front"
    }
};

const DEFAULT_POKEMON_CENTER_STATE = {
    isInsideCenter: false,
    hasInteractedWithJoy: false,
    healCount: 0
};

const MOVE_IDS = {
    tackle: 33,
    scratch: 10,
    ember: 52,
    "water-gun": 55,
    "vine-whip": 22,
    "thunder-shock": 84,
    confusion: 93,
    "quick-attack": 98,
    bite: 44,
    acid: 51,
    "rock-throw": 88,
    gust: 16,
    lick: 122,
    "dragon-rage": 82,
    "karate-chop": 2,
    peck: 64,
    flamethrower: 53,
    fly: 19
};

const FALLBACK_MOVE_BY_TYPE = {
    Fire: "ember",
    Water: "water-gun",
    Grass: "vine-whip",
    Electric: "thunder-shock",
    Psychic: "confusion",
    Poison: "acid",
    Rock: "rock-throw",
    Ground: "tackle",
    Flying: "gust",
    Ghost: "lick",
    Dragon: "dragon-rage",
    Fighting: "karate-chop",
    Ice: "tackle",
    Normal: "quick-attack",
    Bug: "tackle"
};

const PARTY_SEED = [
    { id: 1, level: 12, exp: 36, stats: { hp: 95, maxHp: 95, attack: 49, defense: 49, spAttack: 65, spDefense: 65, speed: 45 }, status: null },
    { id: 4, level: 12, exp: 41, stats: { hp: 72, maxHp: 95, attack: 52, defense: 43, spAttack: 60, spDefense: 50, speed: 65 }, status: null },
    { id: 7, level: 11, exp: 32, stats: { hp: 84, maxHp: 96, attack: 48, defense: 65, spAttack: 50, spDefense: 64, speed: 43 }, status: null },
    { id: 25, level: 9, exp: 19, stats: { hp: 28, maxHp: 90, attack: 55, defense: 40, spAttack: 50, spDefense: 50, speed: 90 }, status: "PSN" },
    { id: 133, level: 10, exp: 25, stats: { hp: 61, maxHp: 88, attack: 55, defense: 50, spAttack: 45, spDefense: 65, speed: 55 }, status: null },
    { id: 150, level: 50, exp: 5000, stats: { hp: 0, maxHp: 130, attack: 110, defense: 90, spAttack: 154, spDefense: 90, speed: 130 }, status: null }
];

const BADGE_NAMES = [
    "Boulder Badge",
    "Cascade Badge",
    "Thunder Badge",
    "Rainbow Badge",
    "Soul Badge",
    "Marsh Badge",
    "Volcano Badge",
    "Earth Badge"
];

const BAG_CATEGORIES = ["Items", "Poké Balls", "TM/HM", "Berries", "Key Items"];

const BAG_ITEM_SEED = [
    {
        id: "potion",
        name: "Potion",
        category: "Items",
        quantity: 5,
        holdable: false,
        effect: { type: "heal_hp", value: 20 },
        desc: "Herstelt 20 HP van een Pokémon."
    },
    {
        id: "super-potion",
        name: "Super Potion",
        category: "Items",
        quantity: 2,
        holdable: false,
        effect: { type: "heal_hp", value: 50 },
        desc: "Herstelt 50 HP van een Pokémon."
    },
    {
        id: "antidote",
        name: "Antidote",
        category: "Items",
        quantity: 2,
        holdable: false,
        effect: { type: "heal_status", status: "PSN" },
        desc: "Geneest vergiftiging."
    },
    {
        id: "burn-heal",
        name: "Burn Heal",
        category: "Items",
        quantity: 1,
        holdable: false,
        effect: { type: "heal_status", status: "BRN" },
        desc: "Geneest brandwonden."
    },
    {
        id: "paralyze-heal",
        name: "Paralyze Heal",
        category: "Items",
        quantity: 1,
        holdable: false,
        effect: { type: "heal_status", status: "PAR" },
        desc: "Geneest verlamming."
    },
    {
        id: "awakening",
        name: "Awakening",
        category: "Items",
        quantity: 1,
        holdable: false,
        effect: { type: "heal_status", status: "SLP" },
        desc: "Maakt een slapende Pokémon wakker."
    },
    {
        id: "revive",
        name: "Revive",
        category: "Items",
        quantity: 1,
        holdable: false,
        effect: { type: "revive" },
        desc: "Brengt een fainted Pokémon terug met half HP."
    },
    {
        id: "poke-ball",
        name: "Poké Ball",
        category: "Poké Balls",
        quantity: 10,
        holdable: false,
        effect: { type: "capture" },
        desc: "Een capsule om wilde Pokémon te vangen."
    },
    {
        id: "great-ball",
        name: "Great Ball",
        category: "Poké Balls",
        quantity: 3,
        holdable: false,
        effect: { type: "capture" },
        desc: "Betere vangstkans dan een Poké Ball."
    },
    {
        id: "tm35",
        name: "TM35 Flamethrower",
        category: "TM/HM",
        quantity: 1,
        holdable: false,
        effect: { type: "tm", value: MOVE_IDS.flamethrower },
        desc: "Leert FLAMETHROWER aan compatibele Pokémon."
    },
    {
        id: "hm02",
        name: "HM02 Fly",
        category: "TM/HM",
        quantity: 1,
        holdable: false,
        effect: { type: "tm", value: MOVE_IDS.fly },
        desc: "Leert FLY aan compatibele Pokémon."
    },
    {
        id: "oran-berry",
        name: "Oran Berry",
        category: "Berries",
        quantity: 3,
        holdable: true,
        effect: { type: "heal_hp", value: 10 },
        desc: "Een bes die 10 HP herstelt."
    },
    {
        id: "pecha-berry",
        name: "Pecha Berry",
        category: "Berries",
        quantity: 2,
        holdable: true,
        effect: { type: "heal_status", status: "PSN" },
        desc: "Een bes die vergiftiging geneest."
    },
    {
        id: "charcoal",
        name: "Charcoal",
        category: "Key Items",
        quantity: 1,
        holdable: true,
        effect: { type: "key" },
        desc: "Versterkt Fire-type moves als hij wordt vastgehouden."
    },
    {
        id: "town-map",
        name: "Town Map",
        category: "Key Items",
        quantity: 1,
        holdable: false,
        effect: { type: "key" },
        desc: "Toont een kaart van de regio."
    },
    {
        id: "bicycle",
        name: "Bicycle",
        category: "Key Items",
        quantity: 1,
        holdable: false,
        effect: { type: "key" },
        desc: "Een snelle fiets voor lange routes."
    }
];

const NATURES = [
    "Hardy",
    "Bold",
    "Modest",
    "Calm",
    "Timid",
    "Adamant",
    "Jolly",
    "Brave",
    "Relaxed",
    "Naive"
];

const partyListeners = new Set();
const stateListeners = new Set();

let kantoCatalog = {};
let moveCatalog = {};

export const gameState = {
    player: clonePlayer(DEFAULT_PLAYER_STATE),
    party: [],
    box: createEmptyBoxes(),
    pokedex: [],
    bag: createDefaultBag(),
    badges: createDefaultBadges(),
    money: DEFAULT_MONEY,
    playTime: 0,
    options: { ...DEFAULT_OPTIONS },
    saveSlot: DEFAULT_SAVE_SLOT,
    pokemonCenterState: { ...DEFAULT_POKEMON_CENTER_STATE }
};

function canUseStorage() {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseStoredJson(storageKey, fallbackValue) {
    if (!canUseStorage()) {
        return fallbackValue;
    }

    try {
        const rawValue = window.localStorage.getItem(storageKey);
        return rawValue ? JSON.parse(rawValue) : fallbackValue;
    } catch (error) {
        console.warn(`Unable to parse stored value for ${storageKey}`, error);
        return fallbackValue;
    }
}

function persistJson(storageKey, value) {
    if (!canUseStorage()) {
        return;
    }

    try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
        console.warn(`Unable to persist value for ${storageKey}`, error);
    }
}

function extractPersistedState(rawValue) {
    if (!rawValue || typeof rawValue !== "object") {
        return null;
    }

    if (rawValue.gameState && typeof rawValue.gameState === "object") {
        if (Number.isFinite(rawValue.version) && rawValue.version > SAVE_DATA_VERSION) {
            console.warn(`Unsupported save version ${rawValue.version}. Falling back to defaults.`);
            return null;
        }

        return rawValue.gameState;
    }

    return rawValue;
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function toTitleCase(value) {
    if (!value) {
        return "";
    }

    return value
        .split("-")
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(" ");
}

function createEmptyBoxes() {
    return Array.from({ length: DEFAULT_BOX_COUNT }, () => []);
}

function createDefaultBag() {
    return BAG_CATEGORIES.reduce((bag, category) => {
        bag[category] = BAG_ITEM_SEED
            .filter((item) => item.category === category)
            .map((item) => cloneBagItem(item));
        return bag;
    }, {});
}

function createDefaultBadges() {
    return BADGE_NAMES.map((name, index) => ({
        id: index + 1,
        name,
        earned: false
    }));
}

function clonePlayer(player) {
    return {
        ...DEFAULT_PLAYER_STATE,
        ...player,
        position: {
            ...DEFAULT_PLAYER_STATE.position,
            ...(player?.position || {})
        }
    };
}

function cloneBadge(badge) {
    return {
        id: badge.id,
        name: badge.name,
        earned: Boolean(badge.earned)
    };
}

function cloneBagItem(item) {
    return {
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: Math.max(0, item.quantity ?? 0),
        holdable: Boolean(item.holdable),
        effect: {
            ...(item.effect || {})
        },
        desc: item.desc || ""
    };
}

function cloneMove(move) {
    if (!move) {
        return null;
    }

    const maxPp = Math.max(1, move.maxPp ?? move.pp ?? 1);
    return {
        id: move.id,
        name: move.name,
        displayName: move.displayName || toTitleCase(move.name),
        type: move.type,
        damageClass: move.damageClass || move.category || "physical",
        category: move.category || move.damageClass || "physical",
        power: move.power ?? null,
        accuracy: move.accuracy ?? null,
        maxPp,
        pp: maxPp,
        currentPp: clamp(move.currentPp ?? move.pp ?? maxPp, 0, maxPp),
        desc: move.desc || ""
    };
}

function clonePokedexEntry(entry) {
    return {
        id: entry.id,
        name: entry.name,
        category: entry.category || "",
        types: Array.isArray(entry.types) ? [...entry.types] : [],
        height: entry.height ?? 0,
        weight: entry.weight ?? 0,
        description: entry.description || "",
        sprite: entry.sprite || "",
        state: entry.state || "unseen",
        localizedDex: cloneLocalizedDex(entry.localizedDex),
        baseStats: {
            hp: entry.baseStats?.hp ?? 0,
            attack: entry.baseStats?.attack ?? 0,
            defense: entry.baseStats?.defense ?? 0,
            spAtk: entry.baseStats?.spAtk ?? 0,
            spDef: entry.baseStats?.spDef ?? 0,
            speed: entry.baseStats?.speed ?? 0
        }
    };
}

function cloneLocalizedDex(localizedDex) {
    return SUPPORTED_POKEDEX_LANGUAGES.reduce((result, languageCode) => {
        result[languageCode] = {
            name: localizedDex?.[languageCode]?.name || "",
            category: localizedDex?.[languageCode]?.category || "",
            description: localizedDex?.[languageCode]?.description || ""
        };
        return result;
    }, {});
}

function clonePokemon(pokemon) {
    return {
        ...pokemon,
        type: Array.isArray(pokemon.type) ? [...pokemon.type] : [],
        moves: Array.isArray(pokemon.moves) ? pokemon.moves.map(cloneMove).filter(Boolean) : [],
        stats: {
            hp: pokemon.stats?.hp ?? 0,
            maxHp: pokemon.stats?.maxHp ?? 0,
            attack: pokemon.stats?.attack ?? 0,
            defense: pokemon.stats?.defense ?? 0,
            spAttack: pokemon.stats?.spAttack ?? pokemon.stats?.spAtk ?? 0,
            spDefense: pokemon.stats?.spDefense ?? pokemon.stats?.spDef ?? 0,
            speed: pokemon.stats?.speed ?? 0
        },
        status: pokemon.status ?? null,
        heldItem: pokemon.heldItem ? cloneBagItem(pokemon.heldItem) : null,
        originalTrainer: pokemon.originalTrainer || DEFAULT_TRAINER_NAME,
        trainerId: pokemon.trainerId ?? DEFAULT_PLAYER_ID,
        met: {
            mapId: pokemon.met?.mapId || "town",
            level: pokemon.met?.level ?? pokemon.level ?? 1
        },
        nature: pokemon.nature || NATURES[pokemon.id % NATURES.length]
    };
}

function cloneParty(party) {
    return (party || []).map(clonePokemon);
}

function cloneBoxes(boxes) {
    if (!Array.isArray(boxes)) {
        return createEmptyBoxes();
    }

    return Array.from({ length: DEFAULT_BOX_COUNT }, (_, boxIndex) => {
        const box = boxes[boxIndex];
        return Array.isArray(box) ? box.slice(0, DEFAULT_BOX_CAPACITY).map(clonePokemon) : [];
    });
}

function cloneBag(bag) {
    const result = createDefaultBag();

    BAG_CATEGORIES.forEach((category) => {
        if (Array.isArray(bag?.[category])) {
            result[category] = bag[category].map(cloneBagItem).filter((item) => item.quantity > 0);
        }
    });

    return result;
}

function cloneGameState(state = gameState) {
    return {
        player: clonePlayer(state.player),
        party: cloneParty(state.party),
        box: cloneBoxes(state.box),
        pokedex: (state.pokedex || []).map(clonePokedexEntry),
        bag: cloneBag(state.bag),
        badges: (state.badges || []).map(cloneBadge),
        money: state.money ?? DEFAULT_MONEY,
        playTime: state.playTime ?? 0,
        options: {
            ...DEFAULT_OPTIONS,
            ...(state.options || {})
        },
        saveSlot: state.saveSlot ?? DEFAULT_SAVE_SLOT,
        pokemonCenterState: {
            ...DEFAULT_POKEMON_CENTER_STATE,
            ...(state.pokemonCenterState || {})
        }
    };
}

function normalizeBag(bag) {
    const normalizedBag = {};

    BAG_CATEGORIES.forEach((category) => {
        const items = Array.isArray(bag?.[category]) ? bag[category] : [];
        normalizedBag[category] = items
            .map(cloneBagItem)
            .filter((item) => item.quantity > 0)
            .sort((first, second) => first.name.localeCompare(second.name));
    });

    return normalizedBag;
}

function getDefaultMoveIds() {
    return Object.values(MOVE_IDS);
}

function getPokemonCache() {
    return parseStoredJson(POKEMON_CACHE_STORAGE_KEY, {});
}

function persistPokemonCache(cache) {
    persistJson(POKEMON_CACHE_STORAGE_KEY, cache);
}

function getMoveCache() {
    return parseStoredJson(MOVE_CACHE_STORAGE_KEY, {});
}

function persistMoveCache(cache) {
    persistJson(MOVE_CACHE_STORAGE_KEY, cache);
}

function buildMoveDescription(payload) {
    const englishEntry = (payload.effect_entries || []).find((entry) => entry.language?.name === "en")
        || (payload.flavor_text_entries || []).find((entry) => entry.language?.name === "en");
    return englishEntry?.short_effect || englishEntry?.effect || englishEntry?.flavor_text?.replace(/\s+/g, " ") || "Geen beschrijving beschikbaar.";
}

function normalizeMoveForPokemon(move) {
    const normalizedMove = cloneMove(move);
    normalizedMove.currentPp = clamp(normalizedMove.currentPp, 0, normalizedMove.maxPp);
    return normalizedMove;
}

function normalizePokemon(pokemon, fallbackPokemon = null) {
    const catalogEntry = getCatalogEntry(pokemon?.id) || getCatalogEntry(fallbackPokemon?.id) || null;
    const basePokemon = fallbackPokemon ? clonePokemon(fallbackPokemon) : {
        id: catalogEntry?.id,
        name: catalogEntry?.name || "",
        sprite: catalogEntry?.frontSprite || "",
        backSprite: catalogEntry?.backSprite || "",
        type: catalogEntry?.type || [],
        category: catalogEntry?.category || "",
        description: catalogEntry?.description || "",
        height: catalogEntry?.height || 0,
        weight: catalogEntry?.weight || 0,
        moves: (catalogEntry?.moves || []).map(normalizeMoveForPokemon),
        stats: {
            hp: catalogEntry?.baseStats?.hp || 0,
            maxHp: catalogEntry?.baseStats?.hp || 1,
            attack: catalogEntry?.baseStats?.attack || 0,
            defense: catalogEntry?.baseStats?.defense || 0,
            spAttack: catalogEntry?.baseStats?.spAtk || 0,
            spDefense: catalogEntry?.baseStats?.spDef || 0,
            speed: catalogEntry?.baseStats?.speed || 0
        },
        heldItem: null,
        originalTrainer: DEFAULT_TRAINER_NAME,
        trainerId: DEFAULT_PLAYER_ID,
        met: { mapId: "town", level: pokemon?.level || 1 },
        nature: NATURES[(pokemon?.id || 0) % NATURES.length]
    };

    const nextPokemon = {
        ...basePokemon,
        ...pokemon,
        id: pokemon?.id ?? basePokemon.id,
        name: pokemon?.name || basePokemon.name || catalogEntry?.name || "",
        sprite: pokemon?.sprite || basePokemon.sprite || catalogEntry?.frontSprite || "",
        backSprite: pokemon?.backSprite || basePokemon.backSprite || catalogEntry?.backSprite || catalogEntry?.frontSprite || "",
        type: Array.isArray(pokemon?.type) && pokemon.type.length
            ? [...pokemon.type]
            : Array.isArray(basePokemon.type) && basePokemon.type.length
                ? [...basePokemon.type]
                : [...(catalogEntry?.type || [])],
        category: pokemon?.category || basePokemon.category || catalogEntry?.category || "",
        description: pokemon?.description || basePokemon.description || catalogEntry?.description || "",
        height: pokemon?.height ?? basePokemon.height ?? catalogEntry?.height ?? 0,
        weight: pokemon?.weight ?? basePokemon.weight ?? catalogEntry?.weight ?? 0,
        level: pokemon?.level ?? basePokemon.level ?? 5,
        exp: pokemon?.exp ?? basePokemon.exp ?? 0,
        moves: Array.isArray(pokemon?.moves) && pokemon.moves.length
            ? pokemon.moves.map(normalizeMoveForPokemon).filter(Boolean)
            : Array.isArray(basePokemon.moves) && basePokemon.moves.length
                ? basePokemon.moves.map(normalizeMoveForPokemon).filter(Boolean)
                : (catalogEntry?.moves || []).map(normalizeMoveForPokemon).filter(Boolean),
        stats: {
            hp: pokemon?.stats?.hp ?? basePokemon.stats?.hp ?? 0,
            maxHp: pokemon?.stats?.maxHp ?? basePokemon.stats?.maxHp ?? 1,
            attack: pokemon?.stats?.attack ?? basePokemon.stats?.attack ?? 0,
            defense: pokemon?.stats?.defense ?? basePokemon.stats?.defense ?? 0,
            spAttack: pokemon?.stats?.spAttack ?? pokemon?.stats?.spAtk ?? basePokemon.stats?.spAttack ?? 0,
            spDefense: pokemon?.stats?.spDefense ?? pokemon?.stats?.spDef ?? basePokemon.stats?.spDefense ?? 0,
            speed: pokemon?.stats?.speed ?? basePokemon.stats?.speed ?? 0
        },
        status: pokemon?.status ?? basePokemon.status ?? null,
        heldItem: pokemon?.heldItem ? cloneBagItem(pokemon.heldItem) : basePokemon.heldItem ? cloneBagItem(basePokemon.heldItem) : null,
        originalTrainer: pokemon?.originalTrainer || basePokemon.originalTrainer || gameState.player.name,
        trainerId: pokemon?.trainerId ?? basePokemon.trainerId ?? gameState.player.id,
        met: {
            mapId: pokemon?.met?.mapId || basePokemon.met?.mapId || gameState.player.position.mapId,
            level: pokemon?.met?.level ?? basePokemon.met?.level ?? pokemon?.level ?? 1
        },
        nature: pokemon?.nature || basePokemon.nature || NATURES[(pokemon?.id || 0) % NATURES.length]
    };

    nextPokemon.stats.maxHp = Math.max(1, nextPokemon.stats.maxHp);
    nextPokemon.stats.hp = clamp(nextPokemon.stats.hp, 0, nextPokemon.stats.maxHp);
    nextPokemon.moves = nextPokemon.moves.slice(0, 4);

    return nextPokemon;
}

function normalizeParty(party) {
    const incomingParty = Array.isArray(party) && party.length ? party : PARTY_SEED;
    const normalizedParty = incomingParty
        .slice(0, 6)
        .map((pokemon) => normalizePokemon(pokemon, PARTY_SEED.find((entry) => entry.id === pokemon.id) || null));

    return normalizedParty.length ? normalizedParty : PARTY_SEED.slice(0, 1).map((pokemon) => normalizePokemon(pokemon, pokemon));
}

function normalizeBadges(badges) {
    if (!Array.isArray(badges)) {
        return createDefaultBadges();
    }

    return BADGE_NAMES.map((name, index) => {
        const persistedBadge = badges[index];
        return {
            id: index + 1,
            name,
            earned: Boolean(persistedBadge?.earned)
        };
    });
}

function buildPokedexEntry(id, state = "unseen") {
    const entry = getCatalogEntry(id);
    return {
        id,
        name: entry?.name || `Pokémon ${id}`,
        category: entry?.category || "",
        types: entry?.type || [],
        height: entry?.height || 0,
        weight: entry?.weight || 0,
        description: entry?.description || "",
        sprite: entry?.frontSprite || "",
        localizedDex: cloneLocalizedDex(entry?.localizedDex),
        baseStats: {
            hp: entry?.baseStats?.hp || 0,
            attack: entry?.baseStats?.attack || 0,
            defense: entry?.baseStats?.defense || 0,
            spAtk: entry?.baseStats?.spAtk || 0,
            spDef: entry?.baseStats?.spDef || 0,
            speed: entry?.baseStats?.speed || 0
        },
        state
    };
}

function normalizePokedex(pokedex, party = []) {
    const incomingMap = new Map((Array.isArray(pokedex) ? pokedex : []).map((entry) => [entry.id, clonePokedexEntry(entry)]));
    const caughtIds = new Set(party.map((pokemon) => pokemon.id));

    for (const pokemonId of caughtIds) {
        const existingEntry = incomingMap.get(pokemonId);
        incomingMap.set(pokemonId, {
            ...buildPokedexEntry(pokemonId, "caught"),
            ...(existingEntry || {}),
            state: "caught"
        });
    }

    return Array.from({ length: KANTO_TARGET_COUNT }, (_, index) => {
        const pokemonId = index + 1;
        const existingEntry = incomingMap.get(pokemonId);
        const defaultState = caughtIds.has(pokemonId) ? "caught" : existingEntry?.state || "unseen";
        return {
            ...buildPokedexEntry(pokemonId, defaultState),
            ...(existingEntry || {}),
            state: mergeDexState(defaultState, existingEntry?.state)
        };
    });
}

function mergeDexState(firstState = "unseen", secondState = "unseen") {
    const priority = {
        unseen: 0,
        seen: 1,
        caught: 2
    };

    return priority[firstState] >= priority[secondState] ? firstState : secondState;
}

function loadPersistedGameState() {
    const persistedState = extractPersistedState(parseStoredJson(GAME_STATE_STORAGE_KEY, null));
    if (!persistedState) {
        return {
            player: clonePlayer(DEFAULT_PLAYER_STATE),
            party: PARTY_SEED.map((pokemon) => clonePokemon(pokemon)),
            box: createEmptyBoxes(),
            pokedex: [],
            bag: createDefaultBag(),
            badges: createDefaultBadges(),
            money: DEFAULT_MONEY,
            playTime: 0,
            options: { ...DEFAULT_OPTIONS },
            saveSlot: DEFAULT_SAVE_SLOT,
            pokemonCenterState: { ...DEFAULT_POKEMON_CENTER_STATE }
        };
    }

    const legacyTrainerName = persistedState.trainerName || persistedState.player?.name || DEFAULT_TRAINER_NAME;

    return {
        player: {
            ...clonePlayer(DEFAULT_PLAYER_STATE),
            ...(persistedState.player || {}),
            name: legacyTrainerName,
            position: {
                ...DEFAULT_PLAYER_STATE.position,
                ...(persistedState.player?.position || {})
            }
        },
        party: Array.isArray(persistedState.party) && persistedState.party.length
            ? persistedState.party.map((pokemon) => clonePokemon(pokemon))
            : PARTY_SEED.map((pokemon) => clonePokemon(pokemon)),
        box: cloneBoxes(persistedState.box),
        pokedex: Array.isArray(persistedState.pokedex) ? persistedState.pokedex.map(clonePokedexEntry) : [],
        bag: normalizeBag(persistedState.bag || createDefaultBag()),
        badges: normalizeBadges(persistedState.badges),
        money: persistedState.money ?? DEFAULT_MONEY,
        playTime: persistedState.playTime ?? 0,
        options: {
            ...DEFAULT_OPTIONS,
            ...(persistedState.options || {})
        },
        saveSlot: persistedState.saveSlot ?? DEFAULT_SAVE_SLOT,
        pokemonCenterState: {
            ...DEFAULT_POKEMON_CENTER_STATE,
            ...(persistedState.pokemonCenterState || {})
        }
    };
}

function notifyStateListeners() {
    const snapshot = getGameState();
    stateListeners.forEach((listener) => listener(snapshot));
}

function notifyPartyListeners() {
    const snapshot = getParty();
    partyListeners.forEach((listener) => listener(snapshot));
}

function commitGameState({ notifyParty = true } = {}) {
    persistGameState();
    if (notifyParty) {
        notifyPartyListeners();
    }
    notifyStateListeners();
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status} for ${url}`);
    }
    return response.json();
}

async function fetchGenerationOneSpeciesIds() {
    const payload = await fetchJson(`https://pokeapi.co/api/v2/generation/${KANTO_GENERATION_ID}`);
    return (payload.pokemon_species || [])
        .map((species) => Number(species.url.match(/\/(\d+)\/?$/)?.[1]))
        .filter((id) => Number.isFinite(id))
        .sort((first, second) => first - second);
}

async function fetchMoveCatalog() {
    const cache = getMoveCache();
    const missingMoveIds = getDefaultMoveIds().filter((moveId) => !cache[moveId]);

    for (const moveId of missingMoveIds) {
        const payload = await fetchJson(`https://pokeapi.co/api/v2/move/${moveId}`);
        cache[moveId] = {
            id: payload.id,
            name: payload.name,
            displayName: toTitleCase(payload.name),
            power: payload.power ?? null,
            accuracy: payload.accuracy ?? null,
            type: toTitleCase(payload.type?.name),
            damageClass: payload.damage_class?.name || "physical",
            category: payload.damage_class?.name || "physical",
            pp: payload.pp || 15,
            maxPp: payload.pp || 15,
            currentPp: payload.pp || 15,
            desc: buildMoveDescription(payload)
        };
    }

    moveCatalog = cache;
    persistMoveCache(cache);
    return cache;
}

function pickMove(types, availableMoveNames, fallbackMoveNames) {
    const preferredNames = [...fallbackMoveNames, "tackle", "quick-attack"];
    for (const moveName of preferredNames) {
        if (availableMoveNames.has(moveName) && moveCatalog[MOVE_IDS[moveName]]) {
            return cloneMove(moveCatalog[MOVE_IDS[moveName]]);
        }
    }

    const primaryTypeMove = FALLBACK_MOVE_BY_TYPE[types[0]] || "tackle";
    return cloneMove(moveCatalog[MOVE_IDS[primaryTypeMove]]) || cloneMove(moveCatalog[MOVE_IDS.tackle]);
}

function normalizeFlavorText(flavorText) {
    return (flavorText || "")
        .replace(/\s+/g, " ")
        .replace(/[\f\n\r]+/g, " ")
        .trim();
}

function getLocalizedSpeciesText(speciesPayload, languageCode, pokemonPayload) {
    const localizedName = (speciesPayload?.names || []).find((entry) => entry.language?.name === languageCode)?.name
        || toTitleCase(pokemonPayload.name);
    const localizedGenus = (speciesPayload?.genera || []).find((entry) => entry.language?.name === languageCode)?.genus || "";
    const localizedFlavor = normalizeFlavorText(
        (speciesPayload?.flavor_text_entries || []).find((entry) => entry.language?.name === languageCode)?.flavor_text
    ) || "No Pokédex data available.";

    return {
        name: localizedName,
        category: localizedGenus,
        description: localizedFlavor
    };
}

function buildMovesForPokemon(types, rawMoves) {
    const availableMoveNames = new Set((rawMoves || []).map((moveInfo) => moveInfo.move?.name).filter(Boolean));
    const fallbackNames = [];

    types.forEach((typeName) => {
        const fallbackMove = FALLBACK_MOVE_BY_TYPE[typeName];
        if (fallbackMove) {
            fallbackNames.push(fallbackMove);
        }
    });

    fallbackNames.push("tackle", "quick-attack", "scratch");

    const moves = [];
    for (const moveName of fallbackNames) {
        if (!MOVE_IDS[moveName]) {
            continue;
        }

        const move = pickMove(types, availableMoveNames, [moveName]);
        if (move && !moves.find((entry) => entry.name === move.name)) {
            moves.push(move);
        }

        if (moves.length >= 4) {
            break;
        }
    }

    while (moves.length < 2) {
        const fallbackMove = cloneMove(moveCatalog[MOVE_IDS.tackle]);
        if (!fallbackMove || moves.find((entry) => entry.name === fallbackMove.name)) {
            break;
        }
        moves.push(fallbackMove);
    }

    return moves.map(normalizeMoveForPokemon);
}

function extractBaseStats(payload) {
    const getBaseStat = (name) => payload.stats.find((statInfo) => statInfo.stat?.name === name)?.base_stat || 0;
    return {
        hp: getBaseStat("hp"),
        attack: getBaseStat("attack"),
        defense: getBaseStat("defense"),
        spAtk: getBaseStat("special-attack"),
        spDef: getBaseStat("special-defense"),
        speed: getBaseStat("speed")
    };
}

function buildCatalogEntry(pokemonPayload, speciesPayload) {
    const types = (pokemonPayload.types || []).map((typeInfo) => toTitleCase(typeInfo.type?.name)).filter(Boolean);
    const localizedDex = SUPPORTED_POKEDEX_LANGUAGES.reduce((result, languageCode) => {
        result[languageCode] = getLocalizedSpeciesText(speciesPayload, languageCode, pokemonPayload);
        return result;
    }, {});
    const englishDex = localizedDex.en;

    return {
        id: pokemonPayload.id,
        name: englishDex.name,
        frontSprite: pokemonPayload.sprites?.front_default || "",
        backSprite: pokemonPayload.sprites?.back_default || pokemonPayload.sprites?.front_default || "",
        sprite: pokemonPayload.sprites?.front_default || "",
        type: types,
        height: (pokemonPayload.height || 0) / 10,
        weight: (pokemonPayload.weight || 0) / 10,
        category: englishDex.category,
        description: englishDex.description,
        localizedDex,
        baseStats: extractBaseStats(pokemonPayload),
        moves: buildMovesForPokemon(types, pokemonPayload.moves || [])
    };
}

async function fetchKantoCatalog() {
    const cache = getPokemonCache();
    const hasCompleteCatalog = cache.__meta?.kantoComplete
        && cache.__meta?.localizationVersion === POKEMON_CACHE_LOCALIZATION_VERSION
        && Object.keys(cache).filter((key) => key !== "__meta").length >= KANTO_TARGET_COUNT;

    if (hasCompleteCatalog) {
        kantoCatalog = cache;
        return cache;
    }

    await fetchMoveCatalog();
    const speciesIds = await fetchGenerationOneSpeciesIds();
    const missingSpeciesIds = speciesIds.filter((id) => {
        const entry = cache[id];
        return !entry
            || !entry.localizedDex?.en?.name
            || !entry.localizedDex?.de?.name;
    });
    const batchSize = 10;

    for (let index = 0; index < missingSpeciesIds.length; index += batchSize) {
        const batchIds = missingSpeciesIds.slice(index, index + batchSize);
        const batchEntries = await Promise.all(batchIds.map(async (id) => {
            const pokemonPayload = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`);
            const speciesPayload = pokemonPayload.species?.url ? await fetchJson(pokemonPayload.species.url) : null;
            return buildCatalogEntry(pokemonPayload, speciesPayload);
        }));

        batchEntries.forEach((entry) => {
            cache[entry.id] = entry;
        });
    }

    cache.__meta = {
        kantoComplete: true,
        generationId: KANTO_GENERATION_ID,
        localizationVersion: POKEMON_CACHE_LOCALIZATION_VERSION,
        updatedAt: Date.now()
    };

    kantoCatalog = cache;
    persistPokemonCache(cache);
    return cache;
}

function getCatalogEntry(id) {
    return kantoCatalog[id] || getPokemonCache()[id] || null;
}

function scaleStats(baseStats, level) {
    return {
        maxHp: Math.max(10, Math.floor(baseStats.hp + level * 3)),
        hp: Math.max(10, Math.floor(baseStats.hp + level * 3)),
        attack: Math.max(5, Math.floor(baseStats.attack + level * 2)),
        defense: Math.max(5, Math.floor(baseStats.defense + level * 2)),
        spAttack: Math.max(5, Math.floor(baseStats.spAtk + level * 2)),
        spDefense: Math.max(5, Math.floor(baseStats.spDef + level * 2)),
        speed: Math.max(5, Math.floor(baseStats.speed + level * 2))
    };
}

function enrichSeedPokemon(seedPokemon) {
    const catalogEntry = getCatalogEntry(seedPokemon.id) || {};
    return normalizePokemon({
        ...seedPokemon,
        name: catalogEntry.name || seedPokemon.name,
        sprite: catalogEntry.frontSprite || seedPokemon.sprite,
        backSprite: catalogEntry.backSprite || catalogEntry.frontSprite || seedPokemon.backSprite || seedPokemon.sprite,
        type: catalogEntry.type?.length ? catalogEntry.type : seedPokemon.type,
        category: catalogEntry.category || "",
        description: catalogEntry.description || "",
        height: catalogEntry.height || 0,
        weight: catalogEntry.weight || 0,
        moves: catalogEntry.moves || [],
        originalTrainer: DEFAULT_TRAINER_NAME,
        trainerId: DEFAULT_PLAYER_ID,
        met: {
            mapId: "town",
            level: seedPokemon.level
        }
    }, seedPokemon);
}

function markPartyCaughtInDex() {
    const caughtIds = new Set(gameState.party.map((pokemon) => pokemon.id));
    gameState.pokedex = gameState.pokedex.map((entry) => ({
        ...entry,
        state: caughtIds.has(entry.id) ? "caught" : entry.state
    }));
}

function upsertBagItemInBag(bag, item) {
    if (!item?.category || !item.id || !bag) {
        return bag;
    }

    const nextBag = cloneBag(bag);
    const categoryItems = nextBag[item.category] || [];
    const existingItem = categoryItems.find((entry) => entry.id === item.id);

    if (existingItem) {
        existingItem.quantity += item.quantity;
    } else if ((item.quantity ?? 0) > 0) {
        categoryItems.push(cloneBagItem(item));
    }

    nextBag[item.category] = categoryItems
        .filter((entry) => entry.quantity > 0)
        .sort((first, second) => first.name.localeCompare(second.name));

    return nextBag;
}

function getBagItemById(itemId, bag = gameState.bag) {
    for (const category of BAG_CATEGORIES) {
        const item = (bag[category] || []).find((entry) => entry.id === itemId);
        if (item) {
            return item;
        }
    }

    return null;
}

export async function initializeGameState() {
    moveCatalog = getMoveCache();
    await fetchMoveCatalog();
    await fetchKantoCatalog();

    const persistedState = loadPersistedGameState();
    const enrichedParty = persistedState.party.map((pokemon) => enrichSeedPokemon(pokemon));

    gameState.player = clonePlayer(persistedState.player);
    gameState.party = normalizeParty(enrichedParty);
    gameState.box = cloneBoxes(persistedState.box);
    gameState.pokedex = normalizePokedex(persistedState.pokedex, gameState.party);
    gameState.bag = normalizeBag(persistedState.bag);
    gameState.badges = normalizeBadges(persistedState.badges);
    gameState.money = persistedState.money ?? DEFAULT_MONEY;
    gameState.playTime = persistedState.playTime ?? 0;
    gameState.options = {
        ...DEFAULT_OPTIONS,
        ...(persistedState.options || {})
    };
    gameState.saveSlot = persistedState.saveSlot ?? DEFAULT_SAVE_SLOT;
    gameState.pokemonCenterState = {
        ...DEFAULT_POKEMON_CENTER_STATE,
        ...(persistedState.pokemonCenterState || {})
    };

    markPartyCaughtInDex();
    persistGameState();
    notifyPartyListeners();
    notifyStateListeners();
    return getGameState();
}

export function persistGameState() {
    persistJson(GAME_STATE_STORAGE_KEY, {
        version: SAVE_DATA_VERSION,
        timestamp: Date.now(),
        gameState: cloneGameState()
    });
}

export function getGameState() {
    return cloneGameState();
}

export function getParty() {
    return cloneParty(gameState.party);
}

export function getTrainerName() {
    return gameState.player.name;
}

export function getPlayerData() {
    return clonePlayer(gameState.player);
}

export function getPokemonCenterState() {
    return {
        ...gameState.pokemonCenterState
    };
}

export function getPokedex() {
    return gameState.pokedex.map(clonePokedexEntry);
}

export function getBag() {
    return cloneBag(gameState.bag);
}

export function getOptions() {
    return {
        ...DEFAULT_OPTIONS,
        ...(gameState.options || {})
    };
}

export function getBadges() {
    return gameState.badges.map(cloneBadge);
}

export function getPlayTime() {
    return gameState.playTime;
}

export function formatPlayTime(playTime = gameState.playTime) {
    const totalSeconds = Math.max(0, Math.floor(playTime));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function subscribeToParty(listener) {
    partyListeners.add(listener);
    listener(getParty());

    return () => {
        partyListeners.delete(listener);
    };
}

export function subscribeToGameState(listener) {
    stateListeners.add(listener);
    listener(getGameState());

    return () => {
        stateListeners.delete(listener);
    };
}

export function setTrainerName(trainerName) {
    gameState.player.name = trainerName || DEFAULT_TRAINER_NAME;
    commitGameState({ notifyParty: false });
}

export function updatePlayerData(updater) {
    const nextPlayer = typeof updater === "function" ? updater(getPlayerData()) : updater;
    gameState.player = clonePlayer({
        ...gameState.player,
        ...(nextPlayer || {}),
        position: {
            ...gameState.player.position,
            ...(nextPlayer?.position || {})
        }
    });
    commitGameState({ notifyParty: false });
    return getPlayerData();
}

export function updatePlayerPosition(position) {
    return updatePlayerData((player) => ({
        ...player,
        position: {
            ...player.position,
            ...(position || {})
        }
    }));
}

export function incrementPlayTime(seconds = 1) {
    gameState.playTime = Math.max(0, gameState.playTime + seconds);
    commitGameState({ notifyParty: false });
    return gameState.playTime;
}

export function tickPlaySession(position, seconds = 1) {
    gameState.playTime = Math.max(0, gameState.playTime + seconds);
    gameState.player = clonePlayer({
        ...gameState.player,
        position: {
            ...gameState.player.position,
            ...(position || {})
        }
    });
    commitGameState({ notifyParty: false });
    return getGameState();
}

export function setOptions(nextOptions) {
    gameState.options = {
        ...DEFAULT_OPTIONS,
        ...gameState.options,
        ...(nextOptions || {})
    };
    commitGameState({ notifyParty: false });
    return getOptions();
}

export function updateOption(optionKey, optionValue) {
    return setOptions({
        [optionKey]: optionValue
    });
}

export function updatePokemonCenterState(updater) {
    const nextState = typeof updater === "function"
        ? updater(getPokemonCenterState())
        : updater;

    gameState.pokemonCenterState = {
        ...DEFAULT_POKEMON_CENTER_STATE,
        ...gameState.pokemonCenterState,
        ...(nextState || {})
    };

    commitGameState({ notifyParty: false });
    return getPokemonCenterState();
}

export function updateParty(updater) {
    const nextParty = typeof updater === "function" ? updater(getParty()) : updater;
    gameState.party = normalizeParty(nextParty);
    markPartyCaughtInDex();
    commitGameState();
    return getParty();
}

export function updatePokemon(id, updater) {
    return updateParty((party) => party.map((pokemon) => {
        if (pokemon.id !== id) {
            return pokemon;
        }

        const nextPokemon = typeof updater === "function" ? updater(clonePokemon(pokemon)) : updater;
        return normalizePokemon({
            ...pokemon,
            ...nextPokemon,
            stats: {
                ...pokemon.stats,
                ...(nextPokemon?.stats || {})
            }
        }, pokemon);
    }));
}

export function swapPartyMembers(indexA, indexB) {
    if (indexA === indexB || indexA < 0 || indexB < 0 || indexA >= gameState.party.length || indexB >= gameState.party.length) {
        return false;
    }

    const nextParty = getParty();
    [nextParty[indexA], nextParty[indexB]] = [nextParty[indexB], nextParty[indexA]];
    updateParty(nextParty);
    return true;
}

export function updateMovePp(pokemonIndex, moveIndex, amount = -1) {
    if (pokemonIndex < 0 || pokemonIndex >= gameState.party.length) {
        return null;
    }

    const nextParty = getParty();
    const pokemon = nextParty[pokemonIndex];
    const move = pokemon?.moves?.[moveIndex];
    if (!move) {
        return null;
    }

    move.currentPp = clamp(move.currentPp + amount, 0, move.maxPp);
    updateParty(nextParty);
    return cloneMove(move);
}

export function restorePartyMovePp() {
    updateParty((party) => party.map((pokemon) => ({
        ...pokemon,
        moves: (pokemon.moves || []).map((move) => ({
            ...move,
            currentPp: move.maxPp
        }))
    })));
}

export function markPokemonSeen(pokemonId) {
    const nextEntries = gameState.pokedex.map((entry) => {
        if (entry.id !== pokemonId) {
            return entry;
        }

        return {
            ...entry,
            state: mergeDexState("seen", entry.state)
        };
    });

    gameState.pokedex = nextEntries;
    commitGameState({ notifyParty: false });
    return getPokedex();
}

export function markPokemonCaught(pokemonId) {
    const nextEntries = gameState.pokedex.map((entry) => {
        if (entry.id !== pokemonId) {
            return entry;
        }

        return {
            ...entry,
            state: "caught"
        };
    });

    gameState.pokedex = nextEntries;
    commitGameState({ notifyParty: false });
    return getPokedex();
}

export function getPokedexCounts() {
    return gameState.pokedex.reduce((counts, entry) => {
        if (entry.state === "seen" || entry.state === "caught") {
            counts.seen += 1;
        }
        if (entry.state === "caught") {
            counts.caught += 1;
        }
        return counts;
    }, { seen: 0, caught: 0 });
}

export function getPokemonTextureKey(id) {
    return `pokemon-party-front-${id}`;
}

export function getPokemonBackTextureKey(id) {
    return `pokemon-party-back-${id}`;
}

export function getWildPokemonTextureKey(id) {
    return `pokemon-wild-front-${id}`;
}

export function getPokemonSpriteEntries() {
    const dedupe = new Map();
    const addEntry = (key, url) => {
        if (key && url && !dedupe.has(key)) {
            dedupe.set(key, { key, url });
        }
    };

    gameState.party.forEach((pokemon) => {
        addEntry(getPokemonTextureKey(pokemon.id), pokemon.sprite);
        addEntry(getPokemonBackTextureKey(pokemon.id), pokemon.backSprite);
    });

    gameState.pokedex
        .filter((entry) => entry.state !== "unseen")
        .forEach((entry) => addEntry(getPokemonTextureKey(entry.id), entry.sprite));

    return Array.from(dedupe.values());
}

export function createWildPokemon(level) {
    const speciesIds = Object.keys(kantoCatalog)
        .filter((key) => key !== "__meta")
        .map((key) => Number(key))
        .sort((first, second) => first - second);
    const randomId = speciesIds[Math.floor(Math.random() * speciesIds.length)];
    return createBattlePokemonFromCatalog(randomId, level);
}

export function createBattlePokemonFromCatalog(id, level) {
    const entry = getCatalogEntry(id);
    if (!entry) {
        return null;
    }

    const stats = scaleStats(entry.baseStats, level);
    return normalizePokemon({
        id: entry.id,
        name: entry.name,
        sprite: entry.frontSprite,
        backSprite: entry.backSprite,
        type: entry.type,
        category: entry.category,
        description: entry.description,
        height: entry.height,
        weight: entry.weight,
        level,
        exp: 0,
        moves: entry.moves.map(normalizeMoveForPokemon),
        stats,
        status: null,
        heldItem: null,
        originalTrainer: "WILD",
        trainerId: 0,
        met: {
            mapId: gameState.player.position.mapId,
            level
        },
        nature: NATURES[id % NATURES.length]
    });
}

export function getBattleReadyParty() {
    return getParty().map((pokemon) => normalizePokemon(pokemon));
}

export function isPartyFullyHealed(party = getParty()) {
    return party.every((pokemon) => {
        const movesAreFull = (pokemon.moves || []).every((move) => move.currentPp >= move.maxPp);
        return pokemon.stats.hp >= pokemon.stats.maxHp && !pokemon.status && movesAreFull;
    });
}

export function healParty() {
    const healedParty = updateParty((party) => party.map((pokemon) => ({
        ...pokemon,
        status: null,
        moves: (pokemon.moves || []).map((move) => ({
            ...move,
            currentPp: move.maxPp
        })),
        stats: {
            ...pokemon.stats,
            hp: pokemon.stats.maxHp
        }
    })));

    updatePokemonCenterState((state) => ({
        ...state,
        hasInteractedWithJoy: true,
        healCount: (state.healCount || 0) + 1
    }));

    return healedParty;
}

export function getFirstAvailablePartyIndex(party = getParty()) {
    return party.findIndex((pokemon) => pokemon.stats.hp > 0);
}

export function getMoveColor(typeName) {
    const colorMap = {
        Fire: "#f83800",
        Water: "#6890f0",
        Grass: "#78c850",
        Electric: "#f8d800",
        Psychic: "#f85888",
        Poison: "#a040a0",
        Rock: "#b8a038",
        Ground: "#e0c068",
        Flying: "#a890f0",
        Ghost: "#705898",
        Dragon: "#7038f8",
        Fighting: "#c03028",
        Ice: "#98d8d8",
        Normal: "#a8a878",
        Bug: "#a8b820"
    };

    return colorMap[typeName] || "#f0f0f0";
}

export function getEncounterLevelForMap(mapName) {
    const encounterBands = {
        route1: { min: 3, max: 10 },
        route2: { min: 6, max: 12 },
        town: { min: 2, max: 6 },
        ashveld: { min: 5, max: 10 },
        crysthaven: { min: 8, max: 14 }
    };

    const band = encounterBands[mapName] || encounterBands.route1;
    return PhaserMathBetween(band.min, band.max);
}

export function getBagCategories() {
    return [...BAG_CATEGORIES];
}

export function getBagItemsByCategory(category) {
    return (gameState.bag[category] || []).map(cloneBagItem);
}

export function assignHeldItem(partyIndex, itemId) {
    const nextParty = getParty();
    const nextBag = cloneBag(gameState.bag);
    const pokemon = nextParty[partyIndex];
    const bagItem = getBagItemById(itemId, nextBag);

    if (!pokemon || !bagItem || !bagItem.holdable || bagItem.quantity <= 0) {
        return {
            success: false,
            message: "Dat item kan niet worden vastgehouden."
        };
    }

    if (pokemon.heldItem) {
        return {
            success: false,
            message: `${pokemon.name} houdt al een item vast.`
        };
    }

    pokemon.heldItem = cloneBagItem({
        ...bagItem,
        quantity: 1
    });
    bagItem.quantity -= 1;
    gameState.party = normalizeParty(nextParty);
    gameState.bag = normalizeBag(nextBag);
    commitGameState();
    return {
        success: true,
        message: `${pokemon.name} houdt nu ${bagItem.name}.`
    };
}

export function takeHeldItem(partyIndex) {
    const nextParty = getParty();
    const pokemon = nextParty[partyIndex];
    if (!pokemon?.heldItem) {
        return {
            success: false,
            message: "Deze Pokémon houdt niets vast."
        };
    }

    const itemName = pokemon.heldItem.name;
    const nextBag = upsertBagItemInBag(gameState.bag, {
        ...pokemon.heldItem,
        quantity: 1
    });
    pokemon.heldItem = null;
    gameState.party = normalizeParty(nextParty);
    gameState.bag = normalizeBag(nextBag);
    commitGameState();
    return {
        success: true,
        message: `${itemName} werd terug in de BAG geplaatst.`
    };
}

export function useBagItem(itemId, partyIndex) {
    const nextParty = getParty();
    const nextBag = cloneBag(gameState.bag);
    const pokemon = nextParty[partyIndex];
    const bagItem = getBagItemById(itemId, nextBag);

    if (!pokemon || !bagItem || bagItem.quantity <= 0) {
        return {
            success: false,
            message: "Dat item is niet beschikbaar."
        };
    }

    if (bagItem.effect.type === "key" || bagItem.effect.type === "capture") {
        return {
            success: false,
            message: "Dat item kun je hier niet gebruiken."
        };
    }

    if (bagItem.effect.type === "tm") {
        const moveTemplate = moveCatalog[bagItem.effect.value];
        if (!moveTemplate) {
            return {
                success: false,
                message: "Deze TM is onbekend."
            };
        }

        const alreadyKnowsMove = pokemon.moves.some((move) => move.id === moveTemplate.id);
        if (alreadyKnowsMove) {
            return {
                success: false,
                message: `${pokemon.name} kent deze move al.`
            };
        }

        const moveType = moveTemplate.type;
        const compatible = pokemon.type.includes(moveType) || moveType === "Normal" || moveType === "Flying";
        if (!compatible) {
            return {
                success: false,
                message: `${pokemon.name} kan deze TM niet leren.`
            };
        }

        if (pokemon.moves.length >= 4) {
            pokemon.moves[pokemon.moves.length - 1] = normalizeMoveForPokemon(moveTemplate);
        } else {
            pokemon.moves.push(normalizeMoveForPokemon(moveTemplate));
        }

        bagItem.quantity -= 1;
        gameState.party = normalizeParty(nextParty);
        gameState.bag = normalizeBag(nextBag);
        commitGameState();
        return {
            success: true,
            message: `${pokemon.name} leerde ${moveTemplate.displayName}!`
        };
    }

    if (bagItem.effect.type === "heal_hp") {
        if (pokemon.stats.hp <= 0) {
            return {
                success: false,
                message: "Een fainted Pokémon heeft eerst een Revive nodig."
            };
        }

        if (pokemon.stats.hp >= pokemon.stats.maxHp) {
            return {
                success: false,
                message: `${pokemon.name} heeft al volle HP.`
            };
        }

        pokemon.stats.hp = Math.min(
            pokemon.stats.hp + (bagItem.effect.value ?? 0),
            pokemon.stats.maxHp
        );
        if (bagItem.effect.status) {
            pokemon.status = bagItem.effect.status === pokemon.status ? null : pokemon.status;
        }
        bagItem.quantity -= 1;
        gameState.party = normalizeParty(nextParty);
        gameState.bag = normalizeBag(nextBag);
        commitGameState();
        return {
            success: true,
            message: `${pokemon.name} herstelde HP!`
        };
    }

    if (bagItem.effect.type === "heal_status") {
        const targetStatus = bagItem.effect.status;
        if (!pokemon.status || (targetStatus && pokemon.status !== targetStatus)) {
            return {
                success: false,
                message: `${pokemon.name} heeft dat niet nodig.`
            };
        }

        pokemon.status = null;
        bagItem.quantity -= 1;
        gameState.party = normalizeParty(nextParty);
        gameState.bag = normalizeBag(nextBag);
        commitGameState();
        return {
            success: true,
            message: `${pokemon.name} is weer in orde!`
        };
    }

    if (bagItem.effect.type === "revive") {
        if (pokemon.stats.hp > 0) {
            return {
                success: false,
                message: `${pokemon.name} is niet fainted.`
            };
        }

        pokemon.stats.hp = Math.max(1, Math.floor(pokemon.stats.maxHp / 2));
        pokemon.status = null;
        bagItem.quantity -= 1;
        gameState.party = normalizeParty(nextParty);
        gameState.bag = normalizeBag(nextBag);
        commitGameState();
        return {
            success: true,
            message: `${pokemon.name} kwam weer bij bewustzijn!`
        };
    }

    return {
        success: false,
        message: "Dat item doet hier niets."
    };
}

export function saveGame() {
    const counts = getPokedexCounts();
    const saveData = {
        version: SAVE_DATA_VERSION,
        timestamp: Date.now(),
        playerName: gameState.player.name,
        badges: gameState.badges.filter((badge) => badge.earned).length,
        pokedexSeen: counts.seen,
        pokedexCaught: counts.caught,
        playTime: gameState.playTime,
        gameState: cloneGameState()
    };

    persistJson(`${SAVE_SLOT_PREFIX}${gameState.saveSlot}`, saveData);
    persistGameState();
    return saveData;
}

export function getSavePreview() {
    const counts = getPokedexCounts();
    return {
        playerName: gameState.player.name,
        badges: gameState.badges.filter((badge) => badge.earned).length,
        pokedexSeen: counts.seen,
        pokedexCaught: counts.caught,
        playTime: gameState.playTime,
        saveSlot: gameState.saveSlot
    };
}

export function getSaveSlotData(saveSlot = gameState.saveSlot) {
    const rawData = parseStoredJson(`${SAVE_SLOT_PREFIX}${saveSlot}`, null);
    if (!rawData || typeof rawData !== "object") {
        return null;
    }

    if (Number.isFinite(rawData.version) && rawData.version > SAVE_DATA_VERSION) {
        return null;
    }

    return rawData;
}

function PhaserMathBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
