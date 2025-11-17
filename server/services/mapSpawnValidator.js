const fs = require("fs");
const path = require("path");

const MAP_DIRECTORY = path.join(__dirname, "..", "..", "client", "src", "assets", "tilemaps");
const mapCache = new Map();

function loadMap(mapName) {
    if (mapCache.has(mapName)) {
        return mapCache.get(mapName);
    }

    const mapPath = path.join(MAP_DIRECTORY, `${mapName}.json`);
    if (!fs.existsSync(mapPath)) {
        mapCache.set(mapName, null);
        return null;
    }

    const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
    const worldLayer = map.layers.find((layer) => layer.name === "World");
    const grassLayer = map.layers.find((layer) => layer.name === "Grass");
    const indoorLayer = map.layers.find((layer) => layer.name === "IndoorZones");
    const collidableTiles = new Set();

    for (const tileset of map.tilesets || []) {
        for (const tile of tileset.tiles || []) {
            const collides = tile.properties?.some((property) => property.name === "collides" && property.value === true);
            if (collides) {
                collidableTiles.add((tileset.firstgid || 1) + tile.id);
            }
        }
    }

    const metadata = {
        ...map,
        worldLayer,
        grassLayer,
        indoorZones: indoorLayer?.objects || [],
        collidableTiles
    };

    mapCache.set(mapName, metadata);
    return metadata;
}

function getTileIndex(map, layer, tileX, tileY) {
    if (!map || !layer || tileX < 0 || tileY < 0 || tileX >= map.width || tileY >= map.height) {
        return 0;
    }

    return layer.data[(tileY * map.width) + tileX] || 0;
}

function tileFootPosition(map, tileX, tileY) {
    return {
        x: (tileX * map.tilewidth) + (map.tilewidth / 2),
        y: ((tileY + 1) * map.tileheight) - 2
    };
}

function pointToTile(map, x, y) {
    return {
        tileX: Math.max(0, Math.min(map.width - 1, Math.floor(x / map.tilewidth))),
        tileY: Math.max(0, Math.min(map.height - 1, Math.floor((Math.max(0, y - 2)) / map.tileheight)))
    };
}

function isIndoorTile(map, tileX, tileY) {
    const position = tileFootPosition(map, tileX, tileY);
    return map.indoorZones.some((zone) => (
        position.x >= zone.x
        && position.x < zone.x + zone.width
        && position.y >= zone.y
        && position.y < zone.y + zone.height
    ));
}

function getTileProperties(mapName, tileX, tileY) {
    const map = loadMap(mapName);
    if (!map) {
        return {
            isWalkable: true,
            isIndoor: false,
            isTallGrass: false,
            encounterRate: 0,
            isBlocking: false
        };
    }

    const worldTile = getTileIndex(map, map.worldLayer, tileX, tileY);
    const grassTile = getTileIndex(map, map.grassLayer, tileX, tileY);
    const encounterRateProperty = map.grassLayer?.properties?.find((property) => property.name === "encounterRate");
    const isBlocking = map.collidableTiles.has(worldTile);

    return {
        isWalkable: !isBlocking,
        isIndoor: isIndoorTile(map, tileX, tileY),
        isTallGrass: grassTile > 0,
        encounterRate: typeof encounterRateProperty?.value === "number" ? encounterRateProperty.value : 0,
        isBlocking
    };
}

function isValidNpcSpawn(mapName, tileX, tileY, occupiedTiles = new Set()) {
    const map = loadMap(mapName);
    if (!map || tileX < 0 || tileY < 0 || tileX >= map.width || tileY >= map.height) {
        return false;
    }

    const tileProperties = getTileProperties(mapName, tileX, tileY);
    return tileProperties.isWalkable && !tileProperties.isIndoor && !occupiedTiles.has(`${tileX}:${tileY}`);
}

function resolveNpcSpawn(npc, occupiedTiles = new Set()) {
    const map = loadMap(npc.map);
    if (!map) {
        return { x: npc.x, y: npc.y };
    }

    const origin = pointToTile(map, npc.x, npc.y);
    if (isValidNpcSpawn(npc.map, origin.tileX, origin.tileY, occupiedTiles)) {
        occupiedTiles.add(`${origin.tileX}:${origin.tileY}`);
        return { x: npc.x, y: npc.y };
    }

    for (let radius = 1; radius <= 12; radius += 1) {
        for (let y = origin.tileY - radius; y <= origin.tileY + radius; y += 1) {
            for (let x = origin.tileX - radius; x <= origin.tileX + radius; x += 1) {
                if (Math.abs(origin.tileX - x) !== radius && Math.abs(origin.tileY - y) !== radius) {
                    continue;
                }

                if (!isValidNpcSpawn(npc.map, x, y, occupiedTiles)) {
                    continue;
                }

                occupiedTiles.add(`${x}:${y}`);
                return tileFootPosition(map, x, y);
            }
        }
    }

    occupiedTiles.add(`${origin.tileX}:${origin.tileY}`);
    return tileFootPosition(map, origin.tileX, origin.tileY);
}

function validateNpcPlacements(npcs) {
    const occupiedByMap = new Map();

    return npcs.map((npc) => {
        if (!occupiedByMap.has(npc.map)) {
            occupiedByMap.set(npc.map, new Set());
        }

        const position = resolveNpcSpawn(npc, occupiedByMap.get(npc.map));
        return {
            ...npc,
            x: position.x,
            y: position.y
        };
    });
}

module.exports = {
    getTileProperties,
    isValidNpcSpawn,
    validateNpcPlacements
};
