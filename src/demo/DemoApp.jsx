import { useEffect, useMemo, useState } from 'react';
import Game from '../screens/Game.jsx';
import Logotype from '../ui/Logotype.jsx';
import HomeScene from '../ui/HomeScene.jsx';
import { IconDefs, Stars } from '../ui/icons.jsx';
import { useT } from '../i18n.js';
import { useSave, getState } from '../store.js';
import { hydrateLevel, DIFFICULTY_KEYS, nodeKind } from '../game/levels.js';
import { NODE_BTN } from '../game/mapTheme.js';
import { ART } from '../board/sprites.js';
import appLogo from '../assets/logo.webp';
import { DEMO_LEVELS } from './levels.js';
import { demoUnlocked, demoDownloadUrl } from './rules.js';
export default function DemoApp() {
 const t=useT(), save=useSave(); const [level,setLevel]=useState(null);
 const unlocked=demoUnlocked(save.stars);
 const downloadUrl=demoDownloadUrl(t.lang);
 const puzzle=useMemo(()=>level ? hydrateLevel(DEMO_LEVELS[level-1],DEMO_LEVELS[level-1].sourceId) : null,[level]);
 useEffect(()=>{ document.documentElement.lang=t.lang; document.documentElement.dir=t.dir; document.documentElement.classList.toggle('ed-fa',t.lang==='fa'); document.title='Choo Choo Pop · '+t('demoTitle'); },[t.lang,t.dir]);
 const selectLevel=n=>{if(n>=1 && n<=10 && n<=demoUnlocked(getState().stars)) setLevel(n);};
 const download=()=>window.location.assign(downloadUrl);
 return <div className={'app demo-app '+(level?'on-game':'on-demo')} style={{'--grass': `url(${ART}tiles/grass-b.png)`}}>
   <IconDefs />
   <div className="rotate-hint">{t('portraitOnly')}</div>
   {!level && <HomeScene decor />}
   {level ? <Game key={level} demo levelNo={level} levelOverride={puzzle} onMap={()=>setLevel(null)} onNext={()=>selectLevel(Math.min(10,level+1))} onShop={download} onCoins={download} /> :
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
   <a className="demo-download" href={downloadUrl} aria-label={t('downloadApp')}><img src={appLogo} alt="Choo Choo Pop" /><span><small>{t('downloadApp')}</small><strong>Android APK</strong></span></a>
 </div>;
}
