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

    try {
        const discordExists = await User.findOne({ discordId });
        if (discordExists) {
            return res.json({
                success: false,
                message: "This Discord account is already linked to a Roblox account."
            });
        }

        const robloxExists = await User.findOne({ robloxId });
        if (robloxExists) {
            return res.json({
                success: false,
                message: "This Roblox account is already linked."
            });
        }

        await User.create({
            robloxId,
            discordId,
            verified: true
        });

        return res.json({ success: true });

    } catch (err) {
        console.error("VERIFY ERROR:", err);

        return res.json({
            success: false,
            message: "Already verified or database conflict."
        });
    }
});

module.exports = router;
