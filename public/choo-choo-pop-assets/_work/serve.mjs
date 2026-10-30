import { createServer } from 'file:///F:/Jolly%20Panda%20Studio/Web%20Game/choo-choo-pop/node_modules/vite/dist/node/index.js';
import react from 'file:///F:/Jolly%20Panda%20Studio/Web%20Game/choo-choo-pop/node_modules/@vitejs/plugin-react/dist/index.js';
const server = await createServer({
  root: 'F:/Jolly Panda Studio/Web Game/choo-choo-pop',
  configFile: false,
  cacheDir: 'F:/Jolly Panda Studio/- Socials Media Items/Images/choo-choo-pop-assets/_work/vite-cache',
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify('1.0.0') },
  server: {host:'127.0.0.1',port:5178,strictPort:true},
});
await server.listen();
console.log('Preview ready at http://127.0.0.1:5178');
