const mongoose = require("mongoose");

const FashionReleaseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    releaseDate: { type: Date, required: true },
    format: { type: String, required: true },
    previewUrl: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },
    announced: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
});

module.exports = mongoose.model("FashionRelease", FashionReleaseSchema);
