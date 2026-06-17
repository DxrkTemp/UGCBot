const mongoose = require("mongoose");

const AffiliateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    affiliateName: { type: String, required: true },
    releaseDate: { type: Date, required: true },
    announced: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
});

module.exports = mongoose.model("Affiliate", AffiliateSchema);
