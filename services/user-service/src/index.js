const express = require("express");
const app = express();
const port = process.env.PORT || 8082;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "user-service", status: "ok" });
});

app.listen(port, () => {
  console.log(`user-service listening on ${port}`);
});
