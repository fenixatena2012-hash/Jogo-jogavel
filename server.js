const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;
const root = path.join(__dirname, "public");
app.use(express.static(root, { etag: true, maxAge: "1h" }));
app.get("*", (_req, res) => res.sendFile(path.join(root, "index.html")));
app.listen(port, "0.0.0.0", () => console.log(`VoxelCraft Offline running on ${port}`));