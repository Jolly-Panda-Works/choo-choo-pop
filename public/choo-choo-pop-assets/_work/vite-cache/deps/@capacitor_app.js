import { registerPlugin } from "./@capacitor_core.js";
// ../../Web Game/choo-choo-pop/node_modules/@capacitor/app/dist/esm/index.js
var App = registerPlugin("App", { web: () => import("./web-BXcysOpa.js").then((m) => new m.AppWeb()) });
export { App };
