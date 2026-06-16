const express = require("express");
const router = express.Router();
const { User } = require("../db");

const API_KEY = process.env.API_KEY;

router.post("/verify", async (req, res) => {
    const { robloxId, discordId, apiKey } = req.body;

    if (apiKey !== API_KEY) {
        return res.json({ success: false, message: "Unauthorized" });
    }

    if (!robloxId || !discordId) {
        return res.json({ success: false, message: "Missing data" });
    }

    await User.findOneAndUpdate(
        { robloxId },
        {
            robloxId,
            discordId,
            verified: true
        },
        { upsert: true }
    );

    return res.json({ success: true });
});

module.exports = router;