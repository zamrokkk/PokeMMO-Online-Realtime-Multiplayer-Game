const express = require("express");
const npcEmotionService = require("../services/npcEmotionService");

const router = express.Router();

router.get("/npcs", async (request, response) => {
    try {
        const playerId = String(request.query.playerId || "guest");
        const map = request.query.map ? String(request.query.map) : undefined;
        const payload = await npcEmotionService.listNpcs(playerId, map);
        response.json(payload);
    } catch (error) {
        response.status(500).json({
            error: "NPC_LIST_FAILED",
            message: error.message
        });
    }
});

router.post("/npcs/:npcId/interact", async (request, response) => {
    try {
        const playerId = String(request.body.playerId || "guest");
        const choiceId = String(request.body.choiceId || "TALK");
        const payload = await npcEmotionService.interact(playerId, request.params.npcId, choiceId);
        response.json(payload);
    } catch (error) {
        response.status(500).json({
            error: "NPC_INTERACT_FAILED",
            message: error.message
        });
    }
});

module.exports = router;
