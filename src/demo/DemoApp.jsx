import { useEffect, useMemo, useState } from 'react';
import { screenViewed, track } from '../services/analytics.js';
import Game from '../screens/Game.jsx';
import Logotype from '../ui/Logotype.jsx';
import HomeScene from '../ui/HomeScene.jsx';
import { IconDefs, Stars } from '../ui/icons.jsx';
import { useT } from '../i18n.js';
import { useSave, getState, update, claimDemoSocial } from '../store.js';
import { hydrateLevel, DIFFICULTY_KEYS, nodeKind } from '../game/levels.js';
import { NODE_BTN } from '../game/mapTheme.js';
import { ART } from '../board/sprites.js';
import appLogo from '../assets/logo.webp';
import Panda from '../ui/Panda.jsx';

import { DEMO_LEVELS } from './levels.js';
import { demoUnlocked, demoDownloadUrl, DEMO_SOCIALS } from './rules.js';
export default function DemoApp() {
 const t=useT(), save=useSave(); const [level,setLevel]=useState(null);
 const [finished,setFinished]=useState(false);
 const [noHints,setNoHints]=useState(false);
 const [rewardStatus,setRewardStatus]=useState('');
 useEffect(()=>{
   if(!noHints || save.demoSocialPending!=='telegram' || save.demoSocialClaimed.includes('telegram'))return;
   let active=true, checking=false;
   const check=async()=>{
     if(checking || document.visibilityState==='hidden')return;
     checking=true;
     try {
       const response=await fetch('/api/social/telegram/auto-check',{method:'POST',cache:'no-store'});
       if(!response.ok)throw new Error();
       const result=await response.json();
       if(!active)return;
       if(result.reward && claimDemoSocial(result.reward)){setNoHints(false);return;}
       setRewardStatus(result.expired?'expired':result.unavailable?'unavailable':String(result.progress || 0));
     }catch{if(active)setRewardStatus('unavailable');}
     finally{checking=false;}
   };
   check();const timer=setInterval(check,12000);window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);
   return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);};
 },[noHints,save.demoSocialPending,save.demoSocialClaimed]);
 useEffect(() => screenViewed(noHints ? 'demo_hints' : finished ? 'demo_ending' : level ? 'game' : 'demo_map'), [level, finished, noHints]);
 const fa=t.lang==='fa';
 const unlocked=demoUnlocked(save.stars);
 const downloadUrl=demoDownloadUrl(t.lang);
 const puzzle=useMemo(()=>level ? hydrateLevel(DEMO_LEVELS[level-1],DEMO_LEVELS[level-1].sourceId) : null,[level]);
 useEffect(()=>{ document.documentElement.lang=t.lang; document.documentElement.dir=t.dir; document.documentElement.classList.toggle('ed-fa',t.lang==='fa'); document.title='Choo Choo Pop · '+t('demoTitle'); },[t.lang,t.dir]);
 const selectLevel=n=>{if(n>=1 && n<=10 && n<=demoUnlocked(getState().stars)) setLevel(n);};
 const clicked = placement => track('download_clicked', { placement, destination_store: 'website', level_id: level || 0 });
 const download = () => { clicked('game'); window.open(downloadUrl, '_blank', 'noopener,noreferrer'); };
 const openTelegram=()=>{
   update({demoSocialPending:'telegram'});
   fetch('/api/social/telegram/prepare',{method:'POST'}).catch(()=>{});
 };
 return <div className={'app demo-app '+(level?'on-game':'on-demo')} style={{'--grass': `url(${ART}tiles/grass-b.png)`}}>
   <IconDefs />
   <div className="rotate-hint">{t('portraitOnly')}</div>
   {!level && <HomeScene decor />}
   {finished ? <main className="demo-ending"><Panda pose="cheer" size={180}/><h1>{fa?'آفرین! دمو را تمام کردی!':'You finished the demo!'}</h1><p>{t('demoFinished')}</p><a className="btn big yellow" onClick={() => clicked('ending')} href={downloadUrl} target="_blank" rel="noopener noreferrer">{fa?'ادامهٔ بازی در اپ':'Keep playing in the app'}</a><button className="btn" onClick={()=>{setFinished(false);setLevel(null);}}>{t('backToMap')}</button></main> : level ? <Game key={level} demo paused={noHints} onDemoNoHints={()=>setNoHints(true)} onDemoComplete={()=>setFinished(true)} levelNo={level} levelOverride={puzzle} onMap={()=>setLevel(null)} onNext={()=>selectLevel(Math.min(10,level+1))} onShop={download} onCoins={download} /> :
    <main className="demo-menu">
     <Logotype />
     <h1>{t('demoTitle')}</h1><p>{t('demoDescription')}</p>
     <div className="demo-levels">{DEMO_LEVELS.map((d,i)=>{
       const locked=i+1>unlocked;
       return <button key={i} disabled={locked} onClick={()=>selectLevel(i+1)} aria-label={t('station')+' '+t.n(i+1)+' · '+t(locked?'locked':DIFFICULTY_KEYS[d.difficulty])} className={'demo-level '+(save.stars[i+1]?'finished':'')+(locked?' locked':'')}>
         <span className="demo-node" style={{backgroundImage:`url(${ART}map/ui/btn-${NODE_BTN[nodeKind(d.difficulty)]}.webp)`}}><span className="demo-node-number">{t.n(i+1)}</span>{locked && <img className="demo-node-lock" src={ART+'v5/lock-s.webp'} alt="" />}</span>
         <Stars n={save.stars[i+1]||0} size={30} />
       </button>;
     })}</div>
    </main>}
   <a className="demo-download" onClick={() => clicked('map')} href={downloadUrl} target="_blank" rel="noopener noreferrer" aria-label={t('downloadApp')}><img src={appLogo} alt="Choo Choo Pop" /><span><small>{t('downloadApp')}</small><strong>Android APK</strong></span></a>
   {noHints && <div className="pop-back"><section className="demo-reward-popup" role="dialog" aria-modal="true" aria-labelledby="demo-reward-title">
     <img className="demo-reward-frame" src={ART+'v5/frame-missions.webp'} alt="" draggable="false" />
     <button className="demo-reward-close" aria-label={fa?'بستن':'Close'} onClick={()=>setNoHints(false)} />
     <h2 id="demo-reward-title">{fa?'راهنمای بیشتر':'More hints'}</h2>
     <div className="demo-reward-content">
       <p className="demo-hints-alert">{fa?'راهنماها تمام شدند!':'Out of hints!'}</p>
       <span className="demo-hint-gift">+{t.n(2)} <img src={ART+'ui/bulb.png'} alt="" />{t('hint')}</span>
       {save.demoSocialClaimed.includes('telegram') ? <p className="small">{fa?'پاداش تلگرام دریافت شده':'Telegram reward claimed'}</p> : <div className="demo-telegram-entry"><a className="btn green demo-telegram-single" href={DEMO_SOCIALS[0].url} onClick={openTelegram} target="_blank" rel="noopener noreferrer"><img src={ART+'ui/social-telegram-v1.png'} width="32" height="32" alt="" /><span>{fa?'تلگرام':'Telegram'}</span></a><span className="demo-auto-status" aria-live="polite">{save.demoSocialPending==='telegram' ? (rewardStatus==='expired' ? (fa?'مهلت تمام شد؛ تلگرام را دوباره باز کن':'Time expired · open Telegram again') : (fa?'بررسی خودکار پس از بازگشت':'Checking automatically on return')) : ''}</span></div>}
       <span className="demo-reward-or">{fa?'یا':'Or'}</span>
       <a className="btn big yellow demo-continue-download" onClick={() => clicked('hint_limit')} href={downloadUrl} target="_blank" rel="noopener noreferrer"><strong>{fa?'دانلود بازی':'Download game'}</strong></a>
     </div>
   </section></div>}
 </div>;
}
