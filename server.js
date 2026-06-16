require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", require("./routes/verify"));
app.use("/api", require("./routes/check"));

app.get("/", (req, res) => {
    res.send("UGC Backend Running");
});

connectDB().then(() => {
    app.listen(process.env.PORT || 3000, () => {
        console.log("Server running");
    });
});