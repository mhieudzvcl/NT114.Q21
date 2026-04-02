const express = require("express");
const app = express();
const port = process.env.PORT || 8081;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "auth-service", status: "ok" });
});

app.listen(port, () => {
  console.log(`auth-service listening on ${port}`);
});
