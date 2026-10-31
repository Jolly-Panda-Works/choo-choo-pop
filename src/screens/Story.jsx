import { useState } from 'react';
import { useT } from '../i18n.js';
import { useSave } from '../store.js';
import { ART } from '../board/sprites.js';
import { sfx } from '../audio.js';
import Panda from '../ui/Panda.jsx';

// Opening story, shown the first time the game starts (and from Settings).
// 1 the panda arrives (intro video)  2 the rails are broken  3 tunnels  4 asks the player for help  5 let's go
const SLIDES = [
  { pose: 'wave', key: 'story1', video: true },
  { pose: 'lever', key: 'story2' },
  { pose: 'whistle', key: 'story3' },
  { pose: 'point', key: 'story4' },
  { pose: 'cheer', key: 'story5' },
];

export default function Story({ onDone }) {
  const t = useT();
  const save = useSave();
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return (
    <main className="screen story">
      <button className="skip" onClick={onDone}>
        {t('skip')}
      </button>
      <div className="story-stage" key={i}>
        {s.video ? (
          <video
            className="story-video"
            src={`${ART}video/intro.mp4`}
            poster={`${ART}video/intro-poster.jpg`}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <Panda pose={s.pose} skin={save.pandaSkin} size={210} variant="card" className="story-panda" />
        )}
        <div className="story-bubble">{t(s.key)}</div>
      </div>
      <div className="dots">
        {SLIDES.map((_, k) => (
          <i key={k} className={k === i ? 'on' : ''} />
        ))}
      </div>
      <button
        className="btn big yellow story-next"
        onClick={() => {
          sfx.click();
          if (last) onDone();
          else setI(i + 1);
        }}
      >
        {last ? t('letsGo') : t('next2')}
      </button>
    </main>
  );
}
