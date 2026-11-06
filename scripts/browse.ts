// mise run browse: the browse page, served as the browser tier serves it, by scripts/served.ts, on
// a free loopback port, until SIGINT or SIGTERM stops it. Prints the page's URL.

import { serve } from "@jaimestill/spike-html-apps-tooling/server.js";
import { PAGE, served } from "./served.ts";

const server = await serve(served);
console.log(`browse: ${server.origin}${PAGE} (Ctrl-C stops it)`);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => void server.stop().then(() => process.exit(0)));
}
