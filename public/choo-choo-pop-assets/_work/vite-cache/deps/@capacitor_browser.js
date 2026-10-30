import { registerPlugin } from "./@capacitor_core.js";
// ../../Web Game/choo-choo-pop/node_modules/@capacitor/browser/dist/esm/index.js
var Browser = registerPlugin("Browser", { web: () => import("./web--xbECXJq.js").then((m) => new m.BrowserWeb()) });
export { Browser };
