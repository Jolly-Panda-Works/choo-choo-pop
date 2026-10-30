import sharp from 'file:///C:/Users/Ania/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const jobs=JSON.parse(await readFile(new URL('./generated-assets.json',import.meta.url),'utf8'));
const manifest=[];
for(const j of jobs){
 let p=sharp(j.src);
 if(j.file==='resources/icon-foreground.png'){
   const mark=await p.trim({threshold:12}).resize(478,478,{fit:'inside'}).toBuffer();
   p=sharp({create:{width:1024,height:1024,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:mark,gravity:'centre'}]);
 }else if(j.file.startsWith('art/train/')&&j.file!=='art/train/smoke.png'){
   p=p.resize(j.width,j.height,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}});
 }else if(j.alpha && !j.file.startsWith('art/track/') && j.file!=='art/bg/hills.png'){
   p=p.resize(j.width,j.height,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}});
 }else{p=p.resize(j.width,j.height,{fit:'fill'});}
 if(!j.alpha)p=p.flatten({background:'#8FD6FF'}).removeAlpha();
 const data=await p.png({compressionLevel:9,palette:true,colours:256,dither:0.3,effort:10}).toBuffer();
 await writeFile(root+j.file,data);
 const meta=await sharp(data).metadata();
 const stats=await sharp(data).ensureAlpha().stats();
 const alpha=stats.channels[3];
 if(meta.width!==j.width||meta.height!==j.height)throw Error('Wrong size '+j.file);
 if(j.alpha&&alpha.min!==0)throw Error('Missing transparency '+j.file);
 manifest.push({file:j.file,width:meta.width,height:meta.height,transparent:j.alpha,bytes:data.length,tool:'imagegen',prompt:j.prompt});
}
const bgFile='resources/icon-background.png';
await sharp({create:{width:1024,height:1024,channels:3,background:'#8FD6FF'}}).png({compressionLevel:9,palette:true}).toFile(root+bgFile);
manifest.push({file:bgFile,width:1024,height:1024,transparent:false,bytes:(await stat(root+bgFile)).size,tool:'solid-color canvas',prompt:'Flat sky blue #8FD6FF'});
for(let i=1;i<=6;i++){
 const file=`store/screenshot-${i}.png`;
 const data=await sharp(await readFile(root+file)).png({compressionLevel:9,palette:true,colours:256,dither:0.2,effort:10}).toBuffer();
 await writeFile(root+file,data);
 manifest.push({file,width:1080,height:1920,transparent:false,bytes:data.length,tool:'Playwright screenshot + HTML typography',note:'Authentic current game build; new art has not been integrated. Persian promotional headlines.'});
}
await writeFile(root+'asset-manifest.json',JSON.stringify({game:'Choo Choo Pop',date:'2026-10-30',notes:['PNG sprites replace the GLB requests as explicitly selected by user.','Engine, wagons, entry and exit are strict top-down.','Artwork only; source application was not modified.','Audio not included; this request covers image assets.','Generated tile art still requires visual alignment checks when integrated with the game board.','Button nine-slice inset suggestion: 48px on each side at delivered 384x128 size.'],assets:manifest},null,2));
const total=manifest.reduce((s,j)=>s+j.bytes,0);
console.log(JSON.stringify({count:manifest.length,totalBytes:total,totalMiB:total/1048576,checkedDimensions:true,checkedTransparentPNGs:true},null,2));
const cols=6,cellW=240,cellH=205;
const rows=Math.ceil(manifest.length/cols);
const tiles=[];
for(let i=0;i<manifest.length;i++){
 const j=manifest[i];
 const thumb=await sharp(root+j.file).resize(214,160,{fit:'contain',background:'#e9f3fa'}).png().toBuffer();
 const x=(i%cols)*cellW,y=Math.floor(i/cols)*cellH;
 tiles.push({input:thumb,left:x+13,top:y+8});
 const label=Buffer.from(`<svg width="240" height="30"><text x="120" y="16" text-anchor="middle" font-family="Arial" font-size="11" fill="#153b77">${j.file}</text><text x="120" y="29" text-anchor="middle" font-family="Arial" font-size="10" fill="#557088">${j.width} x ${j.height}</text></svg>`);
 tiles.push({input:label,left:x,top:y+170});
}
await sharp({create:{width:cols*cellW,height:rows*cellH,channels:3,background:'#e9f3fa'}}).composite(tiles).png().toFile(root+'preview.png');
