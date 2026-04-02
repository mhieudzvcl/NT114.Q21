const express = require("express");
const app = express();
const port = process.env.PORT || 8083;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ service: "product-service", status: "ok" });
});

app.listen(port, () => {
  console.log(`product-service listening on ${port}`);
});
