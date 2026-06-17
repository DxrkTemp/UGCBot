const mongoose = require("mongoose");

const PaidLimitedSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    price: { type: String, default: "Not Set" },       
    copies: { type: Number, default: 0 },             

    releaseDate: { type: Date, required: true },

    bannerUrl: { type: String, default: "" },

    announced: { type: Boolean, default: false },
    removed: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
});

module.exports = mongoose.model("PaidLimited", PaidLimitedSchema);
