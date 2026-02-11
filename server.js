const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mime = require("mime-types");

const app = express();
const PORT = process.env.PORT || 3000;
const VIDEO_DIR = process.env.VIDEO_DIR || path.join(__dirname, "videos");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function sanitizeName(filename) {
  const base = path.basename(filename);
  return base.replace(/[^\w.\- ]+/g, "_");
}

function uniqueName(dirPath, filename) {
  const parsed = path.parse(filename);
  let candidate = filename;
  let counter = 1;
  while (fs.existsSync(path.join(dirPath, candidate))) {
    candidate = `${parsed.name}-${counter}${parsed.ext}`;
    counter += 1;
  }
  return candidate;
}

ensureDir(VIDEO_DIR);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, VIDEO_DIR);
  },
  filename: (_req, file, cb) => {
    const sanitized = sanitizeName(file.originalname || "video");
    const finalName = uniqueName(VIDEO_DIR, sanitized);
    cb(null, finalName);
  }
});

const upload = multer({ storage });

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/videos", (_req, res) => {
  fs.readdir(VIDEO_DIR, { withFileTypes: true }, (err, entries) => {
    if (err) {
      res.status(500).json({ error: "无法读取视频目录" });
      return;
    }
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const fullPath = path.join(VIDEO_DIR, entry.name);
        const stat = fs.statSync(fullPath);
        return {
          name: entry.name,
          size: stat.size,
          mtime: stat.mtimeMs
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
    res.json({ files });
  });
});

app.post("/api/videos", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "未选择文件" });
    return;
  }
  res.json({ name: req.file.filename });
});

app.get("/api/videos/:name/download", (req, res) => {
  const name = sanitizeName(req.params.name);
  const filePath = path.join(VIDEO_DIR, name);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "文件不存在" });
    return;
  }
  res.download(filePath, name);
});

app.get("/api/videos/:name", (req, res) => {
  const name = sanitizeName(req.params.name);
  const filePath = path.join(VIDEO_DIR, name);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "文件不存在" });
    return;
  }
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const contentType = mime.lookup(filePath) || "application/octet-stream";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType
    });
    file.pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Length": fileSize,
    "Content-Type": contentType
  });
  fs.createReadStream(filePath).pipe(res);
});

app.listen(PORT, () => {
  console.log(`Video manager running at http://localhost:${PORT}`);
  console.log(`Video dir: ${VIDEO_DIR}`);
});
