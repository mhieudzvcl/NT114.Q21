const express = require("express");
const app = express();
const port = process.env.PORT || 8084;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "order-service", status: "ok" });
});

app.listen(port, () => {
  console.log(`order-service listening on ${port}`);
});
