import { createApp } from "./app";
import { loadConfig } from "./config";
import { buildGraph, loadDataset } from "./data/loader";

const config = loadConfig();
const dataset = loadDataset(config.dataPath);
const graph = buildGraph(dataset);
const app = createApp(config, graph);

app.listen(config.port, () => {
  console.log(`SkyPath backend listening on port ${config.port}`);
});
