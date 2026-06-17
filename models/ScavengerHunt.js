const mongoose = require("mongoose");

const ScavengerHuntSchema = new mongoose.Schema({
    title: { type: String, required: true },
    ugcName: { type: String, required: true },
    rules: { type: String, required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    copies: { type: Number, required: true },
    remainingCopies: { type: Number, required: true },

    bannerUrl: { type: String, default: "" },

    active: { type: Boolean, default: true },

    sent72Hour: { type: Boolean, default: false },
    sent24Hour: { type: Boolean, default: false },
    liveSent: { type: Boolean, default: false },
    endSent: { type: Boolean, default: false }
});

module.exports = mongoose.model("ScavengerHunt", ScavengerHuntSchema);
