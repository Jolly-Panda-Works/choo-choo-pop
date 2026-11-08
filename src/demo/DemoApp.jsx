import { useEffect, useMemo, useState } from 'react';
import Game from '../screens/Game.jsx';
import Logotype from '../ui/Logotype.jsx';
import { IconDefs, Stars } from '../ui/icons.jsx';
import { useT } from '../i18n.js';
import { useSave, update } from '../store.js';
import { hydrateLevel, DIFFICULTY_KEYS } from '../game/levels.js';
import { APP_DOWNLOAD_URL } from '../config.js';
import { DEMO_LEVELS } from './levels.js';
export default function DemoApp() {
 const t=useT(), save=useSave(); const [level,setLevel]=useState(null);
 const puzzle=useMemo(()=>level ? hydrateLevel(DEMO_LEVELS[level-1],DEMO_LEVELS[level-1].sourceId) : null,[level]);
 useEffect(()=>{ document.documentElement.lang=t.lang; document.documentElement.dir=t.dir; document.documentElement.classList.toggle('ed-fa',t.lang==='fa'); document.title='Choo Choo Pop · '+t('demoTitle'); },[t.lang,t.dir]);
 const download=()=>window.location.assign(APP_DOWNLOAD_URL);
 return <div className={'app demo-app '+(level?'on-game':'on-demo')}>
   <IconDefs />
   <div className="rotate-hint">{t('portraitOnly')}</div>
   {level ? <Game key={level} demo levelNo={level} levelOverride={puzzle} onMap={()=>setLevel(null)} onNext={()=>setLevel(n=>Math.min(10,n+1))} onShop={download} onCoins={download} /> :
    <main className="demo-menu">
     <Logotype lang={t.lang} />
     <h1>{t('demoTitle')}</h1><p>{t('demoDescription')}</p>
     <a className="btn big yellow" href={APP_DOWNLOAD_URL}>{t('downloadApp')}</a>
     <div className="demo-levels">{DEMO_LEVELS.map((d,i)=><button key={i} onClick={()=>setLevel(i+1)} className={'demo-level '+(save.stars[i+1]?'finished':'')}>
       <b>{t('station')} {t.n(i+1)}</b><span>{t(DIFFICULTY_KEYS[d.difficulty])}</span><Stars n={save.stars[i+1]||0} size={18} />
     </button>)}</div>
     <button className="demo-language" onClick={()=>update({lang:t.lang==='fa'?'en':'fa'})}>{t.lang==='fa'?'English':'فارسی'}</button>
    </main>}
   {level && <a className="demo-download" href={APP_DOWNLOAD_URL}>{t('downloadApp')}</a>}
 </div>;
}
