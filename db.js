const mongoose = require("mongoose");

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
};

const UserSchema = new mongoose.Schema({
    robloxId: { type: Number, required: true },
    discordId: { type: String, required: true },
    verified: { type: Boolean, default: true }
});

UserSchema.index({ robloxId: 1 }, { unique: true });
UserSchema.index({ discordId: 1 }, { unique: true });

const User = mongoose.model("User", UserSchema);

module.exports = { connectDB, User };
