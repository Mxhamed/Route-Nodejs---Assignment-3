const path = require("node:path");
const fs = require("node:fs");
const zlib = require("node:zlib");

const readStream = function (filePath) {
  return fs.createReadStream(filePath, {
    encoding: "utf-8",
    highWaterMark: 1 * 1024, // 1KB
  });
};

// ─────────────────────────────────────────────

function one(filePath) {
  const absPath = path.resolve(filePath);

  const readableStream = readStream(absPath);

  readableStream.on("data", (chunk) => {
    console.log(chunk);
    console.log("// ─────────────────────────────────────────────");
  });
}

// ─────────────────────────────────────────────

function two(source, dest) {
  const sourcePath = path.resolve(source);
  const destPath = path.resolve(dest);

  const readableStream = readStream(sourcePath);
  const writableStream = fs.createWriteStream(destPath);

  readableStream.pipe(writableStream);
}

// ─────────────────────────────────────────────

function three(source, dest) {
  const sourcePath = path.resolve(source);
  const destPath = path.resolve(dest);

  const gzip = zlib.createGzip();
  const readableStream = readStream(sourcePath);

  readableStream.pipe(gzip).pipe(fs.createWriteStream(destPath));
}

// ─────────────────────────────────────────────
