import { buildServer } from "./server.ts";
const { app, cfg } = await buildServer();
await app.listen({ host: cfg.host, port: cfg.port });
console.log(`RockIn Local AI Cockpit API http://${cfg.host}:${cfg.port}`);
