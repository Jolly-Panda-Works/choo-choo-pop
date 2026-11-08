import { verifyTelegram, signReceipt, readReceipt, isMember, accountKey } from './telegram.js';
import { fetchPosts, reactionProgress, MISSION_MS } from './reactions.js';

const cookie = (name,value,age=600) => `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
const cookies = request => Object.fromEntries((request.headers.get('Cookie') || '').split(';').map(s=>s.trim().split('=')));
const json = data => Response.json(data,{headers:{'Cache-Control':'no-store'}});
const ready = env => !!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_BOT_USERNAME && env.TELEGRAM_CHANNEL && env.SOCIAL_CLAIMS);
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function page(message, content='', status=200) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Choo Choo Pop · Telegram</title><style>body{font:18px system-ui;text-align:center;background:#dcf5cf;color:#17405c;padding:8vh 24px}main{max-width:400px;margin:auto;background:#fff8e7;border:4px solid #ffc848;border-radius:28px;padding:28px}a{color:#1676a3}</style><main><h1>Choo Choo Pop</h1><p>${escape(message)}</p>${content}<p><a href="/">Return to game · بازگشت به بازی</a></p></main></html>`,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src https://telegram.org; frame-src https://oauth.telegram.org; style-src 'unsafe-inline'; img-src https:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"}});
}
function missionPage(mission,channel,progress=0,expired=false) {
 const name=channel.replace(/^@/,'');
 const links=(mission?.posts || []).map((p,i)=>`<p><a target="_blank" rel="noopener" href="https://t.me/${escape(name)}/${p.id}">Post ${i+1} · پست ${i+1}</a></p>`).join('');
 return page(expired ? 'Time expired. Start a new 10-minute mission. زمان تمام شد؛ مأموریت تازه شروع کن.' : `React to all 3 posts within 10 minutes, then check. به هر سه پست تا ۱۰ دقیقه واکنش بده و بررسی کن. (${progress}/3)`,`${links}<form method="post" action="/api/social/telegram/mission/${expired?'start':'check'}"><button>${expired?'Start again · شروع دوباره':'Check reactions · بررسی واکنش‌ها'}</button></form><small>Counts may update slowly. This is an approximate check. آمار ممکن است با تأخیر برسد؛ بررسی تقریبی است.</small>`);
}
async function handleMission(request,env,restart=false,view=false) {
 if(!ready(env))return page('Verification unavailable. بررسی در دسترس نیست.','',503);
 const c=cookies(request), identity=await readReceipt(c.tg_identity || '',env.TELEGRAM_BOT_TOKEN,c.tg_session);
 if(!identity?.user)return page('Please log in again. دوباره وارد تلگرام شو.','<a href="/api/social/telegram/start">Log in · ورود</a>',403);
 try {
  const stub=env.SOCIAL_CLAIMS.get(env.SOCIAL_CLAIMS.idFromName(identity.id));
  const current=await (await stub.fetch('https://internal/mission/read',{method:'POST',body:JSON.stringify({session:c.tg_session})})).json();
  if(current.claimed)return page('Reward already received. این پاداش قبلاً دریافت شده است.');
  if(restart){
   const posts=(await fetchPosts(env.TELEGRAM_CHANNEL)).slice(0,3);
   const data=await (await stub.fetch('https://internal/mission/start',{method:'POST',body:JSON.stringify({session:c.tg_session,posts})})).json();
   return missionPage(data.mission,env.TELEGRAM_CHANNEL);
  }
  if(view)return missionPage(current.mission,env.TELEGRAM_CHANNEL,0,!current.mission || Date.now()>current.mission.expires);
  if(!current.mission || Date.now()>current.mission.expires)return missionPage(current.mission,env.TELEGRAM_CHANNEL,0,true);
  const membership=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getChatMember`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHANNEL,user_id:Number(identity.user)}),signal:AbortSignal.timeout(10000)});
  const member=await membership.json();
  if(!membership.ok || !member.ok || !isMember(member.result))return page('Channel membership is required. ابتدا عضو کانال شو.','',403);
  const counts=await fetchPosts(env.TELEGRAM_CHANNEL,Math.max(...current.mission.posts.map(p=>p.id))+1);
  const outcome=await (await stub.fetch('https://internal/mission/check',{method:'POST',body:JSON.stringify({session:c.tg_session,counts})})).json();
  if(!outcome.id)return missionPage(current.mission,env.TELEGRAM_CHANNEL,outcome.progress,outcome.expired);
  const receipt=await signReceipt({id:outcome.id,provider:'telegram',session:c.tg_session,expires:Date.now()+86400000},env.TELEGRAM_BOT_TOKEN);
  const result=page('Done! Return to the game tab for 2 hints. انجام شد! برای دریافت ۲ راهنما به تب بازی برگرد.');
  result.headers.append('Set-Cookie',cookie('tg_reward',receipt,86400));return result;
 }catch{return page('Counts are unavailable. Try again shortly. آمار فعلاً در دسترس نیست؛ کمی بعد بررسی کن.','',502);}
}
export default {
 async fetch(request,env) {
  const url=new URL(request.url);
  if (!url.pathname.startsWith('/api/social/')) return env.ASSETS.fetch(request);
  if(request.method==='POST' && url.pathname==='/api/social/telegram/auto-check') {
   if(request.headers.get('Origin')!==url.origin || !ready(env))return new Response('Unavailable',{status:403});
   const c=cookies(request);
   const previous=await readReceipt(c.tg_reward || '',env.TELEGRAM_BOT_TOKEN,c.tg_session);
   if(previous?.id)return json({reward:{provider:'telegram',id:previous.id,amount:2}});
   const prepared=await readReceipt(c.tg_prepared || '',env.TELEGRAM_BOT_TOKEN,c.tg_session);
   if(!prepared?.posts)return json({reward:null,expired:true});
   try {
    const stub=env.SOCIAL_CLAIMS.get(env.SOCIAL_CLAIMS.idFromName('browser:'+c.tg_session));
    await stub.fetch('https://internal/mission/start',{method:'POST',body:JSON.stringify({session:c.tg_session,posts:prepared.posts,started:prepared.started})});
    const counts=await fetchPosts(env.TELEGRAM_CHANNEL,Math.max(...prepared.posts.map(p=>p.id))+1);
    const outcome=await (await stub.fetch('https://internal/mission/check',{method:'POST',body:JSON.stringify({session:c.tg_session,counts})})).json();
    if(!outcome.id)return json({reward:null,progress:outcome.progress || 0,expired:outcome.expired || false});
    const receipt=await signReceipt({id:outcome.id,provider:'telegram',session:c.tg_session,expires:Date.now()+86400000},env.TELEGRAM_BOT_TOKEN);
    const result=json({reward:{provider:'telegram',id:outcome.id,amount:2}});result.headers.append('Set-Cookie',cookie('tg_reward',receipt,86400));return result;
   }catch{return json({reward:null,unavailable:true});}
  }
  if(request.method==='POST' && url.pathname==='/api/social/telegram/prepare') {
   if(request.headers.get('Origin')!==url.origin || !ready(env))return new Response('Unavailable',{status:403});
   try {
    const c=cookies(request),session=/^[a-f0-9-]{36}$/.test(c.tg_session || '')?c.tg_session:crypto.randomUUID();
    const old=await readReceipt(c.tg_prepared || '',env.TELEGRAM_BOT_TOKEN,session);
    if(old)return json({ok:true});
    const posts=(await fetchPosts(env.TELEGRAM_CHANNEL)).slice(0,3),started=Date.now();
    const value=await signReceipt({provider:'telegram',session,posts,started,expires:started+MISSION_MS},env.TELEGRAM_BOT_TOKEN);
    const response=json({ok:true});response.headers.append('Set-Cookie',cookie('tg_session',session,86400*365));response.headers.append('Set-Cookie',cookie('tg_prepared',value,600));return response;
   }catch{return json({ok:false});}
  }
  if(request.method === 'POST' && ['/api/social/telegram/mission/check','/api/social/telegram/mission/start'].includes(url.pathname)) {
   if(request.headers.get('Origin')!==url.origin)return new Response('Forbidden',{status:403});
   return handleMission(request,env,url.pathname.endsWith('/start'));
  }
  if(request.method !== 'GET') return new Response('Method not allowed',{status:405});
  if(url.pathname === '/api/social/status') {
   const c=cookies(request);
   const receipt=ready(env) ? await readReceipt(c.tg_reward || '',env.TELEGRAM_BOT_TOKEN,c.tg_session) : null;
   return json({ready:ready(env), reward:receipt ? {provider:'telegram',id:receipt.id,amount:2} : null});
  }
  if(!ready(env)) return page('Telegram verification is being configured. بررسی عضویت به‌زودی فعال می‌شود.', '',503);
  if(url.pathname === '/api/social/telegram/mission')return handleMission(request,env,false,true);
  if(url.pathname === '/api/social/telegram/start') {
   const c=cookies(request), session=/^[a-f0-9-]{36}$/.test(c.tg_session || '') ? c.tg_session : crypto.randomUUID(), state=crypto.randomUUID();
   const callback=url.origin+'/api/social/telegram/callback?state='+state;
   const response=page('Connect Telegram to verify your membership. برای بررسی عضویت، وارد تلگرام شو.',`<script async src="https://telegram.org/js/telegram-widget.js?22" data-telegram-login="${escape(env.TELEGRAM_BOT_USERNAME)}" data-size="large" data-auth-url="${escape(callback)}"></script>`);
   response.headers.append('Set-Cookie',cookie('tg_session',session,86400*365));
   response.headers.append('Set-Cookie',cookie('tg_state',state));
   return response;
  }
  if(url.pathname === '/api/social/telegram/callback') {
   const c=cookies(request);
   if (!c.tg_state || !c.tg_session || url.searchParams.getAll('state').length!==1 || url.searchParams.get('state')!==c.tg_state) return page('Login expired. Please try again. ورود منقضی شد؛ دوباره تلاش کن.','',403);
   const user=await verifyTelegram(url.searchParams,env.TELEGRAM_BOT_TOKEN);
   if(!user) return page('Could not verify Telegram login. ورود تلگرام تأیید نشد.','',403);
   try {
    const response=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getChatMember`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHANNEL,user_id:Number(user)}),signal:AbortSignal.timeout(10000)});
    const membership=await response.json();
    if(!response.ok || !membership.ok) return page('Verification unavailable. Please try later. بررسی عضویت فعلاً ممکن نیست.','',502);
    if(!isMember(membership.result)) return page('Join the channel, then check again. ابتدا عضو کانال شو و دوباره بررسی کن.', '<a href="https://t.me/UsefGameLab" target="_blank" rel="noopener">Join channel · عضویت در کانال</a><p><a href="/api/social/telegram/start">Check again · بررسی دوباره</a></p>');
    const id=env.SOCIAL_CLAIMS.idFromName(await accountKey(user));
    const prepared=await readReceipt(c.tg_prepared || '',env.TELEGRAM_BOT_TOKEN,c.tg_session);
    const posts=prepared?.posts || (await fetchPosts(env.TELEGRAM_CHANNEL)).slice(0,3);
    const responseMission=await env.SOCIAL_CLAIMS.get(id).fetch('https://internal/mission/start',{method:'POST',body:JSON.stringify({session:c.tg_session,posts,started:prepared?.started})});
    const data=await responseMission.json();
    if(data.claimed)return page('This account already received its reward. این حساب قبلاً پاداش گرفته است.');
    if(data.busy)return page('A mission is already running in another browser. مأموریت در مرورگر دیگری فعال است؛ ۱۰ دقیقه بعد تلاش کن.');
    const identity=await signReceipt({id:await accountKey(user),user,provider:'telegram',session:c.tg_session,expires:Date.now()+3600000},env.TELEGRAM_BOT_TOKEN);
    const result=missionPage(data.mission,env.TELEGRAM_CHANNEL);
    result.headers.append('Set-Cookie',cookie('tg_identity',identity,3600));
    result.headers.append('Set-Cookie',cookie('tg_state','',0));
    return result;
   } catch {return page('Verification unavailable. Please try later. بررسی عضویت فعلاً ممکن نیست.','',502);}
  }
  return new Response('Not found',{status:404});
 }
};
export class SocialClaims {
 constructor(state) {this.state=state;}
 async fetch(request) {
  const {session,posts,counts,started}=await request.json();
  const path=new URL(request.url).pathname;
  if (!/^[a-f0-9-]{36}$/.test(session || '')) return json({id:null});
  const result=await this.state.storage.transaction(async tx=>{
   const old=await tx.get('grant');
   if(old)return {claimed:true,id:path==='/mission/check' && old.session===session ? old.id : null};
   let mission=await tx.get('mission');
   if(path==='/mission/read')return {mission:mission?.session===session ? mission : null};
   if(path==='/mission/start'){
    if(!mission || Date.now()>mission.expires){
     if(!Array.isArray(posts) || posts.length!==3 || new Set(posts.map(p=>p.id)).size!==3 || !posts.every(p=>Number.isSafeInteger(p.id) && p.id>0 && Number.isSafeInteger(p.count) && p.count>=0))return {error:'posts'};
     const begin=Number.isSafeInteger(started) && started<=Date.now() && started>Date.now()-MISSION_MS ? started : Date.now();
     mission={session,posts,started:begin,expires:begin+MISSION_MS};await tx.put('mission',mission);
    }
    return mission.session===session ? {mission} : {busy:true};
   }
   if(path!=='/mission/check' || mission?.session!==session || !Array.isArray(counts))return {id:null};
   const progress=reactionProgress(mission,counts);
   if(!progress.complete)return progress;
   const value={session,id:crypto.randomUUID()};await tx.put('grant',value);return {id:value.id,...progress};
  });
  return json(result);
 }
}
