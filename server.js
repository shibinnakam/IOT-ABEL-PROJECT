// server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const { spawn } = require("child_process");
const fs = require("fs");

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
  detectionResult: { type: String, default: "pending" },
});
const Image = mongoose.model("Image", imageSchema);

// ====== Middleware ======
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// ====== Upload Route ======
app.post("/upload", express.raw({ type: "image/jpeg", limit: "5mb" }), async (req, res) => {
  try {
    if (!req.body || !req.body.length) {
      return res.status(400).send("No image data received");
    }

    // Save temporary file for YOLO detection
    const tempPath = path.join(__dirname, "temp_image.jpg");
    fs.writeFileSync(tempPath, req.body);

    // Respond immediately to ESP32
    res.status(200).send("OK");

    // Spawn Python process for detection
    const pythonPath = path.join(__dirname, "ml_model", "detect_test.py"); // updated script
    const python = spawn("python", [pythonPath, tempPath]);

    python.stdout.on("data", async (data) => {
      const result = data.toString().trim();
      console.log(`🐘 Detection result: ${result}`);

      if (result.includes("elephant")) {
        // Save only elephant images
        const newImage = new Image({
          data: req.body,
          contentType: "image/jpeg",
          detectionResult: result,
        });
        await newImage.save();
        console.log("✅ Elephant image saved to MongoDB!");
      } else {
        console.log("❌ No elephant detected. Image discarded.");
      }

      // Remove temporary file
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    });

    python.stderr.on("data", (data) => {
      console.error("⚠️ Python error:", data.toString());
    });

    python.on("exit", (code) => {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.log(`🐍 Python process exited with code ${code}`);
    });

  } catch (err) {
    console.error("❌ Upload error:", err);
  }
});

// ====== Route to Get Latest Image ======
app.get("/latest", async (req, res) => {
  try {
    const latest = await Image.findOne().sort({ createdAt: -1 });
    if (!latest) return res.status(404).send("No image found");
    res.set("Content-Type", latest.contentType);
    res.send(latest.data);
  } catch (err) {
    console.error("❌ Error fetching latest image:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ====== Route to Get All Images ======
app.get("/images", async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: 1 });
    res.json(images.map(img => ({
      _id: img._id,
      detectionResult: img.detectionResult,
      createdAt: img.createdAt,
    })));
  } catch (err) {
    console.error("❌ Error fetching images:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ====== Route to Serve Image by ID ======
app.get("/image/:id", async (req, res) => {
  try {
    const img = await Image.findById(req.params.id);
    if (!img) return res.status(404).send("Image not found");
    res.set("Content-Type", img.contentType);
    res.send(img.data);
  } catch (err) {
    console.error("❌ Error fetching image:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ====== Serve Main Page ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== Start Server ======
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
