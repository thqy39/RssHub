import app from "./app.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`RSSHub 已启动: http://localhost:${PORT}`);
});
