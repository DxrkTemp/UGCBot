const express = require("express");
const router = express.Router();
const { User } = require("../db");

const API_KEY = process.env.API_KEY;

const requestMap = new Map();

router.post("/verify", async (req, res) => {
    try {

        const ip = req.ip;

        const last = requestMap.get(ip);
        const now = Date.now();

        if (last && now - last < 5000) {
            return res.json({
                success: false,
                message: "Too many requests. Try again later."
            });
        }

        requestMap.set(ip, now);

        const { robloxId, discordId, apiKey } = req.body;

        if (apiKey !== API_KEY) {
            return res.json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (!robloxId || !discordId) {
            return res.json({
                success: false,
                message: "Missing data"
            });
        }

        if (isNaN(robloxId)) {
            return res.json({
                success: false,
                message: "Invalid Roblox ID"
            });
        }

        const existingDiscord = await User.findOne({ discordId });

        if (existingDiscord) {
            return res.json({
                success: false,
                message: "Discord already linked to roblox account"
            });
        }

        const existingRoblox = await User.findOne({ robloxId });

        if (existingRoblox) {
            return res.json({
                success: false,
                message: "Roblox already linked to discord account"
            });
        }

        await User.create({
            robloxId,
            discordId,
            verified: true
        });

        return res.json({
            success: true,
            message: "Verified successfully"
        });

    } catch (err) {
        console.error("Verify error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
});

module.exports = router;
