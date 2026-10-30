import {chromium} from 'file:///C:/Users/Ania/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {readFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(root+'store',{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:360,height:640},deviceScaleFactor:3});
await page.goto('http://127.0.0.1:5178');
await page.evaluate(()=>localStorage.setItem('choochoopop.save.v1',JSON.stringify({unlocked:10,stars:{1:3,2:3,3:2,4:3,5:2},hints:20,sound:false,vibrate:false,lang:'en'})));
await page.reload();
await page.waitForTimeout(700);
const captures=[];
async function snap(title,subtitle){await page.waitForTimeout(700);captures.push({image:await page.screenshot(),title,subtitle});}
await snap('سفر ریلی تو شروع می‌شود','Choo Choo Pop');
await page.getByRole('button',{name:'Levels',exact:true}).click();
await snap('هر مرحله، یک مسیر تازه','از آسان تا چالش‌برانگیز');
for(const [n,title,subtitle] of [[1,'ریل‌ها را به هم وصل کن','مسیر ورود تا خروج را پیدا کن'],[3,'با عددها مسیر را پیدا کن','تعداد ریل‌های هر ردیف و ستون مهم است'],[10,'از ستاره‌ها عبور کن','خانه‌های طلایی را در مسیرت قرار بده']]){
 await page.locator('.level-tile').nth(n-1).click();
 if(n===3)for(let k=0;k<3;k++)await page.getByRole('button',{name:'Hint',exact:true}).click();
 await snap(title,subtitle);
 await page.getByRole('button',{name:'Back',exact:true}).click();
}
await page.locator('.level-tile').nth(0).click();
for(let k=0;k<18;k++){
 const hint=page.getByRole('button',{name:'Hint',exact:true});
 if(await hint.isDisabled())break;
 await hint.click();
}
await page.waitForTimeout(4500);
await snap('قطارت را به مقصد برسان','یک پازل آرام و کاملاً آفلاین');
const logo=(await readFile(root+'art/ui/logo.png')).toString('base64');
const sky=(await readFile(root+'art/bg/sky.png')).toString('base64');
const marketing=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
for(let i=0;i<captures.length;i++){
 const c=captures[i];
 await marketing.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#8fd6ff url(data:image/png;base64,${sky}) center/cover;font-family:Tahoma,Arial,sans-serif;color:#12366c}header{height:410px;text-align:center;padding-top:24px}header img{height:180px;max-width:620px;object-fit:contain}h1{direction:rtl;margin:0 0 15px;font-size:64px;font-weight:900;line-height:1.5}p{direction:rtl;margin:0;font-size:29px;font-weight:700}main{width:780px;height:1387px;margin:20px auto 0;border:12px solid #153b77;border-radius:52px;overflow:hidden;box-shadow:0 16px 0 #0b2b56,0 30px 45px #1765aa55;background:#fff}main img{display:block;width:100%;height:100%;object-fit:fill}footer{text-align:center;padding-top:35px;font-size:25px;letter-spacing:4px;font-weight:bold}</style></head><body><header><img src="data:image/png;base64,${logo}"><h1>${c.title}</h1><p>${c.subtitle}</p></header><main><img src="data:image/png;base64,${c.image.toString('base64')}"></main><footer>CHOO CHOO POP</footer></body></html>`);
 await marketing.screenshot({path:root+`store/screenshot-${i+1}.png`});
 console.log(`screenshot-${i+1}.png: ${c.title}`);
}
await browser.close();
