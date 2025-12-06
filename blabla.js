const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("Hello World");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("🚨 Server Error:", err.stack);
  res.status(500).send("Something Broke!");
});

// Start Server
app.listen(PORT, () => {
  console.log("🚀 Server Running on http://localhost:" + PORT);
});
