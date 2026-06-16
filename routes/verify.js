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

    const existingDiscord = await User.findOne({ discordId });
    if (existingDiscord) {
        return res.json({
            success: false,
            message: "This Discord account is already verified to a Roblox account."
        });
    }

    const existingRoblox = await User.findOne({ robloxId });
    if (existingRoblox) {
        return res.json({
            success: false,
            message: "This Roblox account is already verified."
        });
    }

    await User.create({
        robloxId,
        discordId,
        verified: true
    });

    return res.json({ success: true });
});

module.exports = router;
