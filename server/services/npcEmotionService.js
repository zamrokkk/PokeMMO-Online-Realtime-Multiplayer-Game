const fs = require("fs");
const path = require("path");
const { Molroo } = require("@molroo-io/sdk");
const { validateNpcPlacements } = require("./mapSpawnValidator");

let createOpenAI;
try {
    ({ createOpenAI } = require("@ai-sdk/openai"));
} catch (error) {
    createOpenAI = null;
}

const CACHE_FILE = path.join(__dirname, "..", ".molroo-npc-cache.json");
const WORLD_NAME = "PokeMMO Echo Town";
const WORLD_DESCRIPTION = "A retro Pokemon-style town mystery where five emotionally aware NPCs react to the player's choices.";

const NEUTRAL_EMOTION = {
    label: "neutral",
    intensity: 0.18,
    vad: { V: 0, A: 0, D: 0 }
};

const CHOICES = {
    TALK: { id: "TALK", label: "PRAAT" },
    LISTEN: { id: "LISTEN", label: "LUISTER" },
    ASK: { id: "ASK", label: "VRAAG DOOR" },
    SHARE: { id: "SHARE", label: "DEEL CLUE" },
    PRESS: { id: "PRESS", label: "ZET DRUK" },
    REUNITE: { id: "REUNITE", label: "VERENIG DORP" },
    GOODBYE: { id: "GOODBYE", label: "TOT ZIENS" }
};

const ACTION_APPRAISALS = [
    {
        name: "greet",
        description: "A warm greeting that invites conversation.",
        appraisalVector: {
            goalRelevance: 0.6,
            goalCongruence: 0.6,
            expectedness: 0.6,
            controllability: 0.7,
            agency: 0.3,
            normCompatibility: 0.8,
            internalStandards: 0.7,
            adjustmentPotential: 0.8,
            urgency: 0.2
        }
    },
    {
        name: "comfort",
        description: "A careful, empathic response meant to calm someone down.",
        appraisalVector: {
            goalRelevance: 0.8,
            goalCongruence: 0.9,
            expectedness: 0.7,
            controllability: 0.7,
            agency: 0.2,
            normCompatibility: 0.9,
            internalStandards: 0.9,
            adjustmentPotential: 0.8,
            urgency: 0.3
        }
    },
    {
        name: "ask_for_help",
        description: "A request for information or cooperation.",
        appraisalVector: {
            goalRelevance: 0.9,
            goalCongruence: 0.5,
            expectedness: 0.5,
            controllability: 0.5,
            agency: 0.4,
            normCompatibility: 0.8,
            internalStandards: 0.6,
            adjustmentPotential: 0.6,
            urgency: 0.5
        }
    },
    {
        name: "share_clue",
        description: "The player shares a discovery that changes the conversation.",
        appraisalVector: {
            goalRelevance: 0.9,
            goalCongruence: 0.8,
            expectedness: 0.4,
            controllability: 0.6,
            agency: 0.4,
            normCompatibility: 0.9,
            internalStandards: 0.8,
            adjustmentPotential: 0.8,
            urgency: 0.5
        }
    },
    {
        name: "accuse",
        description: "A confrontational accusation that raises tension.",
        appraisalVector: {
            goalRelevance: 0.9,
            goalCongruence: 0.2,
            expectedness: 0.4,
            controllability: 0.3,
            agency: 0.8,
            normCompatibility: 0.3,
            internalStandards: 0.4,
            adjustmentPotential: 0.4,
            urgency: 0.8
        }
    },
    {
        name: "reunite_town",
        description: "A hopeful invitation to bring everyone together and resolve the mystery.",
        appraisalVector: {
            goalRelevance: 1,
            goalCongruence: 1,
            expectedness: 0.6,
            controllability: 0.7,
            agency: 0.5,
            normCompatibility: 1,
            internalStandards: 1,
            adjustmentPotential: 1,
            urgency: 0.6
        }
    }
];

const NPC_DEFINITIONS = [
    {
        id: "lyra",
        name: "Lyra",
        title: "Town Nurse",
        map: "town",
        x: 318,
        y: 1186,
        spriteKey: "players",
        spriteFrame: "nurse_front.png",
        clueId: "sleep_hum",
        clueTitle: "Slaaphum",
        clueText: "Lyra heard Sol humming in his sleep about a gate that sings under moonlight.",
        shareNeed: 0,
        revealThreshold: 2,
        pressThreshold: 3,
        speakingStyle: "Gentle, composed, and warm. Speaks like someone steadying a room in crisis.",
        description: "The nurse who keeps Echo Town calm, but she has been carrying everyone's worry alone.",
        personality: { O: 0.71, C: 0.84, E: 0.52, A: 0.89, N: 0.46, H: 0.82 },
        goals: [
            { id: "lyra-keep-calm", content: "Keep the town calm before moonrise.", priority: 0.92, mutable: true, status: "active" },
            { id: "lyra-protect-sol", content: "Protect Sol from the Lantern's strange whispers.", priority: 0.88, mutable: true, status: "active" }
        ],
        opening: "Lyra folds a towel with measured hands. \"The whole town is holding its breath tonight.\"",
        support: "Lyra's shoulders loosen. \"Thank you. Everyone comes to me frightened, and I forgot I was allowed to be frightened too.\"",
        guarded: "\"I want to help, but I can't scatter panic across town. Earn a little trust first.\"",
        pressure: "\"Please don't turn this into a hunt. Sol is scared enough already.\"",
        completion: "\"Hear that? The lantern finally sounds like a lullaby again.\""
    },
    {
        id: "piper",
        name: "Piper",
        title: "Courier",
        map: "town",
        x: 412,
        y: 1188,
        spriteKey: "players",
        spriteFrame: "femaletrainer_front.png",
        clueId: "ribbon_fence",
        clueTitle: "Zilveren Lint",
        clueText: "Piper's courier satchel snagged on the west fence, and a silver ribbon tore free beside it.",
        shareNeed: 0,
        revealThreshold: 2,
        pressThreshold: 2,
        speakingStyle: "Fast, bright, and restless. Her words arrive in nervous bursts.",
        description: "A courier who hides nerves behind speed and jokes. She saw more than she admits at first.",
        personality: { O: 0.63, C: 0.62, E: 0.86, A: 0.67, N: 0.58, H: 0.7 },
        goals: [
            { id: "piper-save-festival", content: "Make sure the town's festival still happens.", priority: 0.9, mutable: true, status: "active" },
            { id: "piper-drop-guilt", content: "Stop blaming herself for missing the torn ribbon clue earlier.", priority: 0.74, mutable: true, status: "active" }
        ],
        opening: "Piper bounces on her heels. \"If I stop moving, I start thinking. Bad trade tonight.\"",
        support: "\"Okay. Deep breath. Right. I can actually remember what I saw if I stop sprinting inside my own head.\"",
        guarded: "\"I know things, sure, but I'm not blurting them into the wind unless I know you're serious.\"",
        pressure: "\"Hey, easy. I already feel guilty enough.\"",
        completion: "\"The whole square is talking again. That's better than silence.\""
    },
    {
        id: "sable",
        name: "Sable",
        title: "Tinker",
        map: "town",
        x: 528,
        y: 1182,
        spriteKey: "players",
        spriteFrame: "boss_front.png",
        clueId: "crate_confession",
        clueTitle: "Kratbekentenis",
        clueText: "Sable hid the Echo Lantern inside a route crate because its whispering frightened Sol.",
        shareNeed: 2,
        revealThreshold: 4,
        pressThreshold: 2,
        speakingStyle: "Low, clipped, defensive, but unexpectedly sincere when cornered by kindness.",
        description: "A mechanic whose instincts are protective, even when his choices look suspicious.",
        personality: { O: 0.59, C: 0.81, E: 0.33, A: 0.48, N: 0.52, H: 0.76 },
        goals: [
            { id: "sable-protect-kids", content: "Keep dangerous things away from frightened children.", priority: 0.95, mutable: true, status: "active" },
            { id: "sable-avoid-villain", content: "Avoid being treated like the villain of the town.", priority: 0.79, mutable: true, status: "active" }
        ],
        opening: "Sable keeps one hand on a wrench. \"People get loud when they don't understand a machine.\"",
        support: "\"...You really came to hear me out? Fine. That's rarer than it should be.\"",
        guarded: "\"Not talking. Not until you bring me something real.\"",
        pressure: "\"Push harder and I shut down. Simple as that.\"",
        completion: "\"Maybe next time I tell the truth before I build a hiding place.\""
    },
    {
        id: "orin",
        name: "Orin",
        title: "Stargazer",
        map: "town",
        x: 176,
        y: 1054,
        spriteKey: "players",
        spriteFrame: "professor_right_walk.002.png",
        clueId: "moon_chorus",
        clueTitle: "Maankoor",
        clueText: "Orin explains that the Lantern mirrors fear; if the town gathers calmly, it will harmonize instead of whisper.",
        shareNeed: 1,
        revealThreshold: 2,
        pressThreshold: 5,
        speakingStyle: "Measured, poetic, and precise. He sounds like he thinks in constellations.",
        description: "The observatory keeper who understands the Echo Lantern better than anyone, but blames himself for its side effects.",
        personality: { O: 0.94, C: 0.76, E: 0.42, A: 0.74, N: 0.38, H: 0.84 },
        goals: [
            { id: "orin-repair-trust", content: "Repair the town's trust before moonrise.", priority: 0.97, mutable: true, status: "active" },
            { id: "orin-turn-fear", content: "Turn fear into wonder when the Lantern is returned.", priority: 0.94, mutable: true, status: "active" }
        ],
        opening: "Orin watches the sky. \"Every mystery is just a feeling waiting for enough witnesses.\"",
        support: "\"Then perhaps tonight can still become a chorus instead of a warning.\"",
        guarded: "\"Patterns first. Conclusions later.\"",
        pressure: "\"Urgency without clarity is just another storm.\"",
        completion: "\"Listen closely. The Lantern is finally answering hope instead of fear.\""
    },
    {
        id: "bram",
        name: "Bram",
        title: "Route Guard",
        map: "route1",
        x: 418,
        y: 118,
        spriteKey: "players",
        spriteFrame: "knight_back_walk.002.png",
        clueId: "route_dust",
        clueTitle: "Sterstof",
        clueText: "Bram found silver dust and a humming crate on Route 1, just past the gate.",
        shareNeed: 0,
        revealThreshold: 2,
        pressThreshold: 2,
        speakingStyle: "Grounded, spare, direct. He says little, but what he says matters.",
        description: "The route guard who notices details and resents panic more than danger.",
        personality: { O: 0.45, C: 0.88, E: 0.37, A: 0.66, N: 0.34, H: 0.79 },
        goals: [
            { id: "bram-safe-road", content: "Keep the road safe without feeding rumors.", priority: 0.93, mutable: true, status: "active" },
            { id: "bram-guide-player", content: "Guide the player toward the real trail, not the loudest suspect.", priority: 0.81, mutable: true, status: "active" }
        ],
        opening: "Bram scans the road. \"Tracks don't lie. People do.\"",
        support: "\"Good. Someone else is looking at the ground instead of the gossip.\"",
        guarded: "\"You want facts? Bring patience.\"",
        pressure: "\"Bad way to get help. Try again.\"",
        completion: "\"Town sounds different already. Less fear in the air.\""
    },
    {
        id: "mirelle",
        name: "Mirelle",
        title: "Ashveld Nurse",
        map: "ashveld",
        x: 432,
        y: 414,
        spriteKey: "players",
        spriteFrame: "nurse_front.png",
        clueId: "ashveld-heartbeat",
        clueTitle: "Ashveld Hartslag",
        clueText: "Mirelle keeps Ashveld steady by listening for what people refuse to say out loud.",
        shareNeed: 99,
        revealThreshold: 99,
        pressThreshold: 99,
        speakingStyle: "Soft-spoken, observant, and comforting without sounding distant.",
        description: "The Pokecenter nurse in Ashveld who notices stress before anyone else names it.",
        personality: { O: 0.62, C: 0.91, E: 0.41, A: 0.92, N: 0.34, H: 0.86 },
        goals: [
            { id: "mirelle-keep-town-rested", content: "Keep Ashveld from spiraling into exhausted worry.", priority: 0.89, mutable: true, status: "active" }
        ],
        opening: "Mirelle folds a blanket. \"Ashveld sleeps lightly. People here hear every rumor twice.\"",
        support: "\"That's better. Calm voices travel farther than panic.\"",
        guarded: "\"Questions are fine. I just won't turn the center into a rumor mill.\"",
        pressure: "\"This is a place to recover, not to corner people.\"",
        completion: "\"Even the town's heartbeat sounds steadier tonight.\""
    },
    {
        id: "tavi",
        name: "Tavi",
        title: "Ashveld Shopkeep",
        map: "ashveld",
        x: 706,
        y: 446,
        spriteKey: "players",
        spriteFrame: "tuxemartemployee_front.png",
        clueId: "ashveld-ledger",
        clueTitle: "Ashveld Voorraadboek",
        clueText: "Tavi tracks the town by what vanishes from the shelves before storms.",
        shareNeed: 99,
        revealThreshold: 99,
        pressThreshold: 99,
        speakingStyle: "Quick, practical, and a little theatrical when the shop is quiet.",
        description: "Ashveld's Pokemart clerk, equal parts gossip filter and logistics machine.",
        personality: { O: 0.58, C: 0.87, E: 0.71, A: 0.68, N: 0.29, H: 0.77 },
        goals: [
            { id: "tavi-keep-stock-moving", content: "Keep supplies flowing even when the roads feel uncanny.", priority: 0.82, mutable: true, status: "active" }
        ],
        opening: "Tavi taps a ledger. \"If fear goes up, antidotes and ropes disappear first. Towns always tell on themselves.\"",
        support: "\"There we go. A sensible conversation. Much cheaper than a panic.\"",
        guarded: "\"You'll get a cleaner answer if you stop asking like you're auditing me.\"",
        pressure: "\"Push any harder and I start charging consultation fees.\"",
        completion: "\"Trade's back to normal. That's how you know a town forgave the day.\""
    },
    {
        id: "rowan",
        name: "Rowan",
        title: "Ashveld Caretaker",
        map: "ashveld",
        x: 678,
        y: 832,
        spriteKey: "players",
        spriteFrame: "professor_front.png",
        clueId: "ashveld-bells",
        clueTitle: "Ashveld Klokken",
        clueText: "Rowan times his rounds to the old bells because silence unsettles the square.",
        shareNeed: 99,
        revealThreshold: 99,
        pressThreshold: 99,
        speakingStyle: "Measured and reflective, with the patience of someone who works around old things.",
        description: "Caretaker of Ashveld's memorial hall, more interested in preserving calm than spectacle.",
        personality: { O: 0.81, C: 0.79, E: 0.36, A: 0.84, N: 0.27, H: 0.88 },
        goals: [
            { id: "rowan-keep-square-calm", content: "Keep the memorial square peaceful as travelers pass through.", priority: 0.9, mutable: true, status: "active" }
        ],
        opening: "Rowan watches the square. \"A town breathes through its pauses. Ashveld has learned not to fear them.\"",
        support: "\"You noticed that too. Most people only hear noise, not rhythm.\"",
        guarded: "\"I don't mind questions. I mind careless ones.\"",
        pressure: "\"Pressure ruins old masonry and good conversation in equal measure.\"",
        completion: "\"The bells sound lighter when people stop bracing for the worst.\""
    },
    {
        id: "selene",
        name: "Selene",
        title: "Gym Guide",
        map: "crysthaven",
        x: 1232,
        y: 574,
        spriteKey: "players",
        spriteFrame: "girl1_front.png",
        clueId: "crysthaven-gymlight",
        clueTitle: "Gymlicht",
        clueText: "Selene says Crysthaven's gym glow is the city's way of refusing to dim itself.",
        shareNeed: 99,
        revealThreshold: 99,
        pressThreshold: 99,
        speakingStyle: "Bright, confident, and encouraging, like someone used to welcoming challengers.",
        description: "A gym guide who treats confidence as something people can borrow until it becomes their own.",
        personality: { O: 0.69, C: 0.74, E: 0.83, A: 0.81, N: 0.22, H: 0.75 },
        goals: [
            { id: "selene-keep-city-brave", content: "Keep Crysthaven feeling bold and alive for newcomers.", priority: 0.85, mutable: true, status: "active" }
        ],
        opening: "Selene grins toward the gym facade. \"Crysthaven likes its challenges visible. No hiding from growth here.\"",
        support: "\"Exactly. Nerves are just unused courage.\"",
        guarded: "\"I can help, but not if you're trying to turn every answer into a shortcut.\"",
        pressure: "\"That attitude won't get you far in a gym or a city.\"",
        completion: "\"Now that's the Crysthaven tempo I like.\""
    },
    {
        id: "corin",
        name: "Corin",
        title: "Canal Fisher",
        map: "crysthaven",
        x: 594,
        y: 702,
        spriteKey: "players",
        spriteFrame: "knight_front.png",
        clueId: "crysthaven-current",
        clueTitle: "Stadsstroom",
        clueText: "Corin measures the city by current and crowd the same way: both drift where space allows.",
        shareNeed: 99,
        revealThreshold: 99,
        pressThreshold: 99,
        speakingStyle: "Blunt, weathered, and surprisingly philosophical in short bursts.",
        description: "A fisher who understands flow, patience, and the value of staying still long enough to notice change.",
        personality: { O: 0.54, C: 0.8, E: 0.31, A: 0.72, N: 0.21, H: 0.83 },
        goals: [
            { id: "corin-watch-currents", content: "Read the city's mood the same way he reads water.", priority: 0.79, mutable: true, status: "active" }
        ],
        opening: "Corin squints down the street. \"Cities have currents too. Stand still and you'll feel which way people are leaning.\"",
        support: "\"Good. Not every answer needs to splash to matter.\"",
        guarded: "\"You'll hear more if you stop yanking at the line.\"",
        pressure: "\"Rush the pull and the catch tears loose.\"",
        completion: "\"Smooth water, smooth streets. That's enough for me.\""
    },
    {
        id: "mara",
        name: "Mara",
        title: "City Architect",
        map: "crysthaven",
        x: 530,
        y: 1076,
        spriteKey: "players",
        spriteFrame: "omnichannelceo_front.png",
        clueId: "crysthaven-blueprint",
        clueTitle: "Blauwdruk",
        clueText: "Mara says every district needs one place to gather and one place to breathe.",
        shareNeed: 99,
        revealThreshold: 99,
        pressThreshold: 99,
        speakingStyle: "Precise, elegant, and quietly demanding of coherence.",
        description: "The planner behind Crysthaven's layout, always thinking in avenues, sight lines, and mood.",
        personality: { O: 0.88, C: 0.9, E: 0.49, A: 0.63, N: 0.19, H: 0.8 },
        goals: [
            { id: "mara-protect-layout", content: "Keep Crysthaven structured without making it cold.", priority: 0.91, mutable: true, status: "active" }
        ],
        opening: "Mara studies the avenue. \"Good cities direct people without making them feel handled.\"",
        support: "\"Yes. Design is just empathy that learned geometry.\"",
        guarded: "\"A useful question deserves a precise answer. An impatient one does not.\"",
        pressure: "\"If you want clarity, stop mistaking force for direction.\"",
        completion: "\"The whole boulevard reads cleaner when people aren't carrying so much tension.\""
    },
    {
        id: "jules",
        name: "Jules",
        title: "Market Runner",
        map: "crysthaven",
        x: 1090,
        y: 1110,
        spriteKey: "players",
        spriteFrame: "red_front.png",
        clueId: "crysthaven-post",
        clueTitle: "Marktpost",
        clueText: "Jules knows every shortcut in Crysthaven and half the stories attached to them.",
        shareNeed: 99,
        revealThreshold: 99,
        pressThreshold: 99,
        speakingStyle: "Energetic, playful, and always one step from running off to the next errand.",
        description: "A courier who turns the city's long avenues into a playground of momentum.",
        personality: { O: 0.73, C: 0.64, E: 0.91, A: 0.7, N: 0.24, H: 0.68 },
        goals: [
            { id: "jules-keep-city-moving", content: "Keep the markets and messages flowing without bottlenecks.", priority: 0.84, mutable: true, status: "active" }
        ],
        opening: "Jules bounces in place. \"If I stop moving, Crysthaven feels twice as big. So I don't stop moving.\"",
        support: "\"There it is. You get the city. Keep pace, don't fight it.\"",
        guarded: "\"I can answer, sure, but not while you're trying to sprint through the conversation.\"",
        pressure: "\"Too much pressure and I just vanish into the next alley.\"",
        completion: "\"That's the city back on its feet. Fast, bright, impossible to pin down.\""
    }
];

const RESOLVED_NPC_DEFINITIONS = validateNpcPlacements(NPC_DEFINITIONS);

class NpcEmotionService {
    constructor() {
        this.molroo = null;
        this.world = null;
        this.openaiProvider = null;
        this.cache = { worldId: null, personas: {} };
        this.initPromise = null;
        this.playerStates = new Map();
        this.npcState = new Map(RESOLVED_NPC_DEFINITIONS.map((npc) => [npc.id, {
            ...npc,
            emotion: { ...NEUTRAL_EMOTION },
            molrooPersonaId: null,
            worldPersonaId: null
        }]));
    }

    async init() {
        if (!this.initPromise) {
            this.initPromise = this.initialize().catch((error) => {
                this.initPromise = null;
                console.warn("NPC emotion service init failed", error);
            });
        }

        return this.initPromise;
    }

    async initialize() {
        this.cache = this.readCache();
        const molrooApiKey = process.env.MOLROO_API_KEY;
        if (!molrooApiKey) {
            return;
        }

        this.molroo = new Molroo({ apiKey: molrooApiKey });
        this.openaiProvider = this.createOpenAIProvider();
        this.world = await this.ensureWorld();
        await this.ensureActions();
        await this.ensurePersonas();
    }

    createOpenAIProvider() {
        if (!createOpenAI || !process.env.OPENAI_API_KEY) {
            return null;
        }

        try {
            const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
            return openai("gpt-4o-mini");
        } catch (error) {
            console.warn("Unable to create OpenAI provider for Molroo", error);
            return null;
        }
    }

    async ensureWorld() {
        if (this.cache.worldId) {
            try {
                return await this.molroo.getWorld(this.cache.worldId);
            } catch (error) {
                console.warn("Cached Molroo world not found, recreating", error.message);
            }
        }

        const worlds = await this.molroo.listWorlds({ limit: 50 });
        const existingWorld = worlds.worlds.find((world) => world.name === WORLD_NAME);
        if (existingWorld) {
            this.cache.worldId = existingWorld.id;
            this.writeCache();
            return await this.molroo.getWorld(existingWorld.id);
        }

        const world = await this.molroo.createWorld({
            name: WORLD_NAME,
            description: WORLD_DESCRIPTION,
            accessPolicy: "closed",
            responseRule: "target"
        });

        this.cache.worldId = world.id;
        this.writeCache();
        return world;
    }

    async ensureActions() {
        if (!this.world) {
            return;
        }

        const existingActions = await this.world.listActions();
        const actionNames = new Set(existingActions.map((action) => action.name));

        for (const action of ACTION_APPRAISALS) {
            if (actionNames.has(action.name)) {
                continue;
            }

            await this.world.createAction(action);
        }
    }

    async ensurePersonas() {
        if (!this.world) {
            return;
        }

        const worldPersonas = await this.world.listPersonas();
        const personaSummaries = await this.molroo.listPersonas();

        for (const definition of RESOLVED_NPC_DEFINITIONS) {
            const cachedPersona = this.cache.personas[definition.id] || {};
            let standalonePersonaId = cachedPersona.personaId || null;
            let worldPersonaId = cachedPersona.worldPersonaId || null;

            const existingWorldPersona = worldPersonas.find((persona) => {
                const displayName = getRawValue(persona, "displayName", "display_name");
                return displayName === definition.name;
            });

            if (existingWorldPersona) {
                worldPersonaId = getRawValue(existingWorldPersona, "id");
                standalonePersonaId = standalonePersonaId || getRawValue(existingWorldPersona, "personaConfigId", "persona_config_id");
            }

            if (!standalonePersonaId) {
                const matchingStandalone = personaSummaries.personas.find((persona) => {
                    const identity = persona.config?.identity || {};
                    return identity.extensions?.pokemmoNpcId === definition.id;
                });

                if (matchingStandalone) {
                    standalonePersonaId = matchingStandalone.id;
                }
            }

            if (!standalonePersonaId) {
                const persona = await this.molroo.createPersona({
                    identity: {
                        name: definition.name,
                        role: definition.title,
                        speakingStyle: definition.speakingStyle,
                        description: definition.description,
                        extensions: {
                            pokemmoNpcId: definition.id,
                            map: definition.map
                        }
                    },
                    personality: definition.personality,
                    goals: definition.goals
                });

                standalonePersonaId = persona.id;
            }

            if (!worldPersonaId) {
                const worldPersonaRef = await this.world.addPersona({
                    personaId: standalonePersonaId,
                    displayName: definition.name
                });
                worldPersonaId = worldPersonaRef.id;
            }

            this.cache.personas[definition.id] = {
                personaId: standalonePersonaId,
                worldPersonaId
            };
            this.writeCache();

            const npcState = this.npcState.get(definition.id);
            npcState.molrooPersonaId = standalonePersonaId;
            npcState.worldPersonaId = worldPersonaId;
        }
    }

    readCache() {
        try {
            if (!fs.existsSync(CACHE_FILE)) {
                return { worldId: null, personas: {} };
            }

            return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
        } catch (error) {
            console.warn("Unable to read Molroo NPC cache", error);
            return { worldId: null, personas: {} };
        }
    }

    writeCache() {
        try {
            fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2));
        } catch (error) {
            console.warn("Unable to write Molroo NPC cache", error);
        }
    }

    getPlayerState(playerId) {
        if (!this.playerStates.has(playerId)) {
            this.playerStates.set(playerId, {
                trust: {},
                clues: [],
                histories: {},
                flags: {
                    finaleUnlocked: false,
                    storyComplete: false
                }
            });
        }

        const playerState = this.playerStates.get(playerId);
        for (const npc of RESOLVED_NPC_DEFINITIONS) {
            if (typeof playerState.trust[npc.id] !== "number") {
                playerState.trust[npc.id] = 0;
            }

            if (!Array.isArray(playerState.histories[npc.id])) {
                playerState.histories[npc.id] = [];
            }
        }

        return playerState;
    }

    async listNpcs(playerId, mapName) {
        await this.init();
        const playerState = this.getPlayerState(playerId);

        return {
            npcs: RESOLVED_NPC_DEFINITIONS
                .filter((npc) => !mapName || npc.map === mapName)
                .map((npc) => this.serializeNpc(npc.id, playerState)),
            story: this.serializeStory(playerState)
        };
    }

    async interact(playerId, npcId, choiceId) {
        await this.init();

        const npc = this.npcState.get(npcId);
        if (!npc) {
            throw new Error(`Unknown NPC: ${npcId}`);
        }

        const playerState = this.getPlayerState(playerId);
        const resolvedChoice = CHOICES[choiceId] ? choiceId : "TALK";
        const outcome = this.resolveStoryBeat(playerState, npc, resolvedChoice);
        const result = await this.generateResponse(playerId, playerState, npc, outcome);

        return {
            npc: this.serializeNpc(npc.id, playerState),
            response: result,
            story: this.serializeStory(playerState)
        };
    }

    serializeNpc(npcId, playerState) {
        const npc = this.npcState.get(npcId);
        return {
            id: npc.id,
            name: npc.name,
            title: npc.title,
            map: npc.map,
            x: npc.x,
            y: npc.y,
            spriteKey: npc.spriteKey,
            spriteFrame: npc.spriteFrame,
            emotion: npc.emotion || NEUTRAL_EMOTION,
            trust: playerState.trust[npc.id] || 0,
            availableChoices: this.getChoicesForNpc(playerState, npc)
        };
    }

    serializeStory(playerState) {
        return {
            clueCount: playerState.clues.length,
            clues: playerState.clues.map((clueId) => {
                const owner = RESOLVED_NPC_DEFINITIONS.find((npc) => npc.clueId === clueId);
                return {
                    id: clueId,
                    title: owner?.clueTitle || clueId,
                    text: owner?.clueText || clueId
                };
            }),
            finaleUnlocked: playerState.flags.finaleUnlocked,
            storyComplete: playerState.flags.storyComplete
        };
    }

    getChoicesForNpc(playerState, npc) {
        const choices = [
            CHOICES.TALK,
            CHOICES.LISTEN,
            CHOICES.ASK
        ];

        if (playerState.clues.length > 0) {
            choices.push(CHOICES.SHARE);
        }

        choices.push(CHOICES.PRESS);

        if (npc.id === "orin" && playerState.flags.finaleUnlocked && !playerState.flags.storyComplete) {
            choices.push(CHOICES.REUNITE);
        }

        choices.push(CHOICES.GOODBYE);
        return choices;
    }

    resolveStoryBeat(playerState, npc, choiceId) {
        const trustBefore = playerState.trust[npc.id] || 0;
        let trustDelta = 0;
        let unlockedClue = null;
        let specialHint = "";
        let actionName = "greet";
        let tone = "neutral";

        if (playerState.flags.storyComplete) {
            return {
                choiceId,
                actionName: "greet",
                tone: "calm",
                trustDelta: 0,
                unlockedClue: null,
                specialHint: npc.completion,
                isGuarded: false
            };
        }

        switch (choiceId) {
        case "TALK":
            trustDelta = trustBefore === 0 ? 1 : 0;
            specialHint = npc.opening;
            actionName = "greet";
            tone = "warm";
            break;
        case "LISTEN":
            trustDelta = 2;
            specialHint = npc.support;
            actionName = "comfort";
            tone = "comfort";
            break;
        case "ASK":
            trustDelta = 1;
            actionName = "ask_for_help";
            if (trustBefore + trustDelta >= npc.revealThreshold) {
                unlockedClue = this.unlockClue(playerState, npc.clueId);
                specialHint = unlockedClue ? npc.clueText : `\"You've heard the important part already,\" ${npc.name} says.`;
                tone = unlockedClue ? "reveal" : "repeat";
            } else {
                specialHint = npc.guarded;
                tone = "guarded";
            }
            break;
        case "SHARE":
            trustDelta = 2;
            actionName = "share_clue";
            if (playerState.clues.length >= npc.shareNeed) {
                unlockedClue = this.unlockClue(playerState, npc.clueId);
                specialHint = unlockedClue ? npc.clueText : `${npc.name} nods. \"That fits the rest of the pattern.\"`;
                tone = unlockedClue ? "reveal" : "share";
            } else {
                specialHint = "\"Bring me something sharper than a hunch,\" the NPC says.";
                tone = "guarded";
            }
            break;
        case "PRESS":
            trustDelta = -1;
            actionName = "accuse";
            if (trustBefore >= npc.pressThreshold || playerState.clues.length >= Math.max(1, npc.shareNeed)) {
                unlockedClue = this.unlockClue(playerState, npc.clueId);
                specialHint = unlockedClue ? npc.clueText : npc.pressure;
                tone = unlockedClue ? "shaken_reveal" : "tense";
            } else {
                specialHint = npc.pressure;
                tone = "tense";
            }
            break;
        case "REUNITE":
            trustDelta = 1;
            actionName = "reunite_town";
            if (npc.id === "orin" && playerState.flags.finaleUnlocked) {
                playerState.flags.storyComplete = true;
                specialHint = "Orin finally smiles. \"Bring the town together at the square. Calm voices will turn the Lantern from whispers into song.\"";
                tone = "resolution";
            } else {
                specialHint = "\"Not yet,\" Orin says. \"The town still needs more truth than hope.\"";
                tone = "guarded";
            }
            break;
        case "GOODBYE":
            actionName = "greet";
            specialHint = `"Until later," ${npc.name} says.`;
            tone = "farewell";
            break;
        default:
            specialHint = npc.opening;
        }

        playerState.trust[npc.id] = clamp(trustBefore + trustDelta, 0, 7);
        playerState.flags.finaleUnlocked = this.isFinaleUnlocked(playerState);

        return {
            choiceId,
            actionName,
            tone,
            trustDelta,
            unlockedClue,
            specialHint,
            isGuarded: tone === "guarded"
        };
    }

    unlockClue(playerState, clueId) {
        if (playerState.clues.includes(clueId)) {
            return null;
        }

        playerState.clues.push(clueId);
        return clueId;
    }

    isFinaleUnlocked(playerState) {
        return playerState.clues.includes("crate_confession") && playerState.clues.length >= 4;
    }

    async generateResponse(playerId, playerState, npc, outcome) {
        let emotion = npc.emotion || NEUTRAL_EMOTION;
        let text;

        if (this.world && npc.worldPersonaId) {
            try {
                const persona = this.world.persona(npc.worldPersonaId, this.openaiProvider ? { llm: this.openaiProvider } : undefined);
                if (this.openaiProvider) {
                    const history = playerState.histories[npc.id];
                    const prompt = this.buildAiPrompt(playerState, npc, outcome);
                    const result = await persona.react(outcome.actionName, {
                        actor: playerId,
                        actorType: "user",
                        prompt,
                        history
                    });

                    emotion = normalizeEmotion(result.emotion);
                    text = result.narrative;
                    history.push({ role: "user", content: prompt });
                    history.push({ role: "assistant", content: text });
                    if (history.length > 12) {
                        playerState.histories[npc.id] = history.slice(-12);
                    }
                } else {
                    const result = await persona.interact(outcome.actionName, {
                        actor: playerId,
                        actorType: "user",
                        stimulusDescription: this.buildAiPrompt(playerState, npc, outcome)
                    });
                    emotion = normalizeEmotion(result.emotion);
                    text = this.buildFallbackText(playerState, npc, outcome, emotion);
                }
            } catch (error) {
                console.warn(`Molroo interaction failed for ${npc.id}`, error.message);
                text = this.buildFallbackText(playerState, npc, outcome, emotion);
            }
        } else {
            emotion = this.createLocalEmotion(npc, outcome);
            text = this.buildFallbackText(playerState, npc, outcome, emotion);
        }

        npc.emotion = emotion;

        return {
            choiceId: outcome.choiceId,
            text,
            lines: wrapDialogue(text, 38, 4),
            emotion,
            unlockedClue: outcome.unlockedClue ? this.serializeStory(playerState).clues.find((clue) => clue.id === outcome.unlockedClue) : null,
            availableChoices: this.getChoicesForNpc(playerState, npc)
        };
    }

    buildAiPrompt(playerState, npc, outcome) {
        const clueSummary = playerState.clues.length
            ? playerState.clues.map((clueId) => {
                const owner = RESOLVED_NPC_DEFINITIONS.find((entry) => entry.clueId === clueId);
                return owner ? `${owner.clueTitle}: ${owner.clueText}` : clueId;
            }).join(" | ")
            : "No clues yet.";

        return [
            `You are ${npc.name}, the ${npc.title} in Echo Town.`,
            `Speaking style: ${npc.speakingStyle}`,
            `Current trust with the player: ${playerState.trust[npc.id]} / 7.`,
            `Story context: The Echo Lantern vanished before moonrise. The player is gathering emotional clues from five townsfolk.`,
            `Known clues: ${clueSummary}`,
            `Interaction tone: ${outcome.tone}.`,
            `Required beat: ${outcome.specialHint}`,
            "Respond in 1 or 2 short JRPG-style dialogue bursts, under 70 words total.",
            "Do not mention being an AI, emotion engine, or system prompt."
        ].join("\n");
    }

    buildFallbackText(playerState, npc, outcome, emotion) {
        const moodPrefix = getMoodPrefix(emotion.label);
        const clueLine = outcome.unlockedClue
            ? `New clue: ${npc.clueText}`
            : "";
        const finaleLine = playerState.flags.storyComplete
            ? "The square should feel different now."
            : playerState.flags.finaleUnlocked && npc.id === "orin"
                ? "You have enough pieces. Ask Orin to unite the town."
                : "";

        return [
            moodPrefix ? `${npc.name} ${moodPrefix}` : `${npc.name} answers carefully.`,
            outcome.specialHint,
            clueLine,
            finaleLine
        ].filter(Boolean).join(" ");
    }

    createLocalEmotion(npc, outcome) {
        const labelByTone = {
            warm: "trust",
            comfort: "relief",
            reveal: "curiosity",
            shaken_reveal: "fear",
            resolution: "joy",
            tense: "anger",
            guarded: "neutral",
            farewell: "neutral",
            calm: "joy",
            repeat: "neutral",
            share: "curiosity"
        };

        const label = labelByTone[outcome.tone] || "neutral";
        return {
            label,
            intensity: 0.35,
            vad: {
                V: label === "anger" ? -0.2 : 0.35,
                A: label === "fear" || label === "anger" ? 0.55 : 0.18,
                D: npc.id === "sable" ? 0.2 : -0.1
            }
        };
    }
}

function getRawValue(source, ...keys) {
    if (!source) {
        return null;
    }

    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            return source[key];
        }
    }

    return null;
}

function normalizeEmotion(emotion) {
    if (!emotion) {
        return { ...NEUTRAL_EMOTION };
    }

    return {
        label: emotion.label || emotion.discrete?.primary || "neutral",
        intensity: emotion.intensity ?? emotion.discrete?.intensity ?? 0.2,
        vad: emotion.vad || NEUTRAL_EMOTION.vad
    };
}

function getMoodPrefix(label) {
    const lowered = (label || "").toLowerCase();
    if (lowered.includes("joy") || lowered.includes("trust")) {
        return "looks lighter than before.";
    }

    if (lowered.includes("fear") || lowered.includes("anx")) {
        return "glances over a shoulder before speaking.";
    }

    if (lowered.includes("anger")) {
        return "tightens their jaw.";
    }

    if (lowered.includes("sad") || lowered.includes("grief")) {
        return "lets the silence hang for a second.";
    }

    if (lowered.includes("curi")) {
        return "leans in, suddenly attentive.";
    }

    if (lowered.includes("relief")) {
        return "breathes out slowly.";
    }

    return "";
}

function wrapDialogue(text, lineLength, maxLines) {
    const words = (text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let currentLine = "";

    for (const word of words) {
        const nextLine = currentLine ? `${currentLine} ${word}` : word;
        if (nextLine.length > lineLength) {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
        } else {
            currentLine = nextLine;
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.slice(0, maxLines);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

module.exports = new NpcEmotionService();
