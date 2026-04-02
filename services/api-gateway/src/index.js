const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "api-gateway", status: "ok" });
});

app.listen(port, () => {
  console.log(`api-gateway listening on ${port}`);
});
