const express = require("express");
const app = express();
const port = process.env.PORT || 8085;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "notification-service", status: "ok" });
});

app.listen(port, () => {
  console.log(`notification-service listening on ${port}`);
});
