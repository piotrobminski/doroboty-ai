import { fileURLToPath } from "node:url";

const port = process.env.UI_KIT_PORT || "8952";
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error("UI_KIT_PORT must be an integer from 1 to 65535.");
}
process.env.PORT = port;
console.log(`Technologia po ludzku gallery: http://127.0.0.1:${port}/ui-examples.html`);
console.log(
  `Reference root: ${fileURLToPath(new URL("./technologia-po-ludzku/", import.meta.url))}`,
);
await import("./technologia-po-ludzku/scripts/serve.mjs");
