// server.js

require("dotenv").config();
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

// ====== MongoDB Connection ======
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ====== MongoDB Schema ======
const imageSchema = new mongoose.Schema({
  data: Buffer,
  contentType: String,
  createdAt: { type: Date, default: Date.now },
});
const Image = mongoose.model("Image", imageSchema);

// ====== Middleware ======
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ====== Multer Setup ======
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, "latest.jpg"),
});
const upload = multer({ storage });

// ====== Upload Route ======
app.post("/upload", express.raw({ type: "image/jpeg", limit: "5mb" }), async (req, res) => {
  try {
    // Save locally
    fs.writeFileSync("uploads/latest.jpg", req.body);

    // Save in MongoDB
    const newImage = new Image({
      data: req.body,
      contentType: "image/jpeg",
    });
    await newImage.save();

    console.log("✅ Image saved to MongoDB and local storage");
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.sendStatus(500);
  }
});

// ====== Route to Get Latest Image from MongoDB ======
app.get("/latest", async (req, res) => {
  try {
    const latest = await Image.findOne().sort({ createdAt: -1 });
    if (!latest) return res.status(404).send("No image found");
    res.set("Content-Type", latest.contentType);
    res.send(latest.data);
  } catch (err) {
    console.error("❌ Error fetching image:", err);
    res.sendStatus(500);
  }
});

// ====== Serve Main Page ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== Start Server ======
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
