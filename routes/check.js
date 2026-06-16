const express = require("express");
const router = express.Router();
const { User } = require("../db");

router.get("/check", async (req, res) => {
    const robloxId = Number(req.query.robloxId);

    if (!robloxId) {
        return res.json({ verified: false });
    }

    const user = await User.findOne({ robloxId });

    if (!user || !user.verified) {
        return res.json({ verified: false });
    }

    return res.json({
        verified: true,
        discordId: user.discordId
    });
});

module.exports = router;