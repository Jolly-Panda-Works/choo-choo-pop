import { useEffect, useRef, useState } from 'react';
import { rect, rowRect, k, fs } from '../ui/v5.jsx';
import BluePopup, { LIST, ROW_X, inPopup, RowBg, rowLook, tabColors } from '../ui/BluePopup.jsx';
import PopList from '../ui/PopList.jsx';
import { Icon } from '../ui/icons.jsx';
import { useSave, starBalance, buyLook, equipLook } from '../store.js';
import { useT } from '../i18n.js';
import { TRAIN_SKINS, RAIL_SKINS } from '../game/skins.js';
import { loadSprites, holdSprites, getTrainSet, getRailSet, getSprites, ART } from '../board/sprites.js';
import { sfx } from '../audio.js';

// Train and rail colours, bought only with the stars earned by solving stations.
const PITCH = 285;
const ROW0 = 21;
const TABS_Y = 626;
const LIST_Y = 718;
const DIVIDER = 100;
const TABS = [
  { id: 'train', label: 'tabTrain', list: TRAIN_SKINS, owned: 'ownedTrain', cur: 'trainSkin' },
  { id: 'rail', label: 'tabRails', list: RAIL_SKINS, owned: 'ownedRail', cur: 'railSkin' },
];

function Preview({ kind, skin }) {
  const ref = useRef(null);
  useEffect(() => {
    let live = true;
    loadSprites().then(() => {
      if (!live || !ref.current) return;
      const g = ref.current.getContext('2d');
      g.clearRect(0, 0, 200, 100);
      if (kind === 'rail') {
        const { straight } = getRailSet(skin);
        g.drawImage(straight, 0, 0, 100, 100);
        g.drawImage(straight, 100, 0, 100, 100);
        return;
      }
      const sp = getSprites();
      const set = getTrainSet(skin);
      const draw = (img, trim, x) => {
        const s = 96 / trim.w;
        g.drawImage(img, trim.x, trim.y, trim.w, trim.h, x, 50 - (trim.h * s) / 2, trim.w * s, trim.h * s);
      };
      draw(set.wagons[0], sp.wagonTrim, 4);
      draw(set.engine, sp.engineTrim, 100);
    });
    return () => {
      live = false;
    };
  }, [kind, skin]);
  return <canvas ref={ref} width="200" height="100" style={{ width: '100%', height: 'auto' }} />;
}

export default function Customize({ onBack }) {
  const save = useSave();
  const t = useT();
  const [tab, setTab] = useState('train');
  const [note, setNote] = useState('');
  const timer = useRef();
  useEffect(holdSprites, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const say = (m) => {
    setNote(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(''), 2300);
  };
  const cfg = TABS.find((x) => x.id === tab);
  const mine = cfg.list.filter((s) => save[cfg.owned].includes(s.id));
  const forSale = cfg.list.filter((s) => !save[cfg.owned].includes(s.id));
  const pick = (skin, has) => {
    if (!has && !buyLook(tab, skin)) {
      sfx.error();
      return say(t('notEnoughStars'));
    }
    equipLook(tab, skin.id);
    sfx.hint();
  };

  return (
    <BluePopup frame="custom" title={t('customize')} onClose={onBack} stars={starBalance(save)}>
      <div className="tabs" style={{ ...inPopup(190, TABS_Y, 1040, 88), ...tabColors('custom') }}>
        {TABS.map((x) => (
          <button key={x.id} className={tab === x.id ? 'on' : ''} onClick={() => (sfx.click(), setTab(x.id))}>
            {t(x.label)}
          </button>
        ))}
      </div>

      <PopList key={tab} style={inPopup(LIST[0], LIST_Y, LIST[2] - LIST[0], LIST[3] - LIST_Y)}>
        <div style={{ position: 'relative', height: k(ROW0 + cfg.list.length * PITCH + (mine.length && forSale.length ? DIVIDER : 0)) }}>
          {mine.length > 0 && forSale.length > 0 && (
            <div className="look-divider" style={{ ...rect(ROW_X, ROW0 + mine.length * PITCH, 1152, DIVIDER - 17), ...fs(38), color: rowLook('custom', 1).ink }}>
              <span>{t('forSale')}</span>
            </div>
          )}
          {[...mine, ...forSale].map((s, i) => {
            const has = i < mine.length;
            const on = save[cfg.cur] === s.id;
            const look = rowLook('custom', i);
            const top = ROW0 + i * PITCH + (mine.length && !has ? DIVIDER : 0);
            return (
              <div key={s.id} className="prow" style={{ top: k(top), left: k(ROW_X), width: k(1152), height: k(268) }}>
                <RowBg look={look} />
                <div className="ptxt" style={rowRect(30, 44, 360, 180)}>
                  <Preview kind={tab} skin={s.id} />
                </div>
                <div className="ptxt" style={{ ...rowRect(410, 90, 360, 90), ...fs(48), color: look.ink, whiteSpace: 'normal' }}>{t('skin_' + s.id)}</div>
                <button className="pbtn" disabled={on} style={rowRect(790, 66, 302, 129)} onClick={() => pick(s, has)}>
                  <img className="v5pic" alt="" draggable="false" src={`${ART}v5/sbtn-${on ? 'green' : look.btn}.webp`} style={rowRect(0, 0, 302, 129)} />
                  <span style={{ ...rowRect(0, 0, 302, 118), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: k(10), ...fs(has && !on ? 40 : 46) }}>
                    {on ? (
                      <Icon name="tick" />
                    ) : has ? (
                      t('use')
                    ) : (
                      <>
                        <img alt="" draggable="false" src={`${ART}map/ui/star-gold.webp`} style={{ width: k(54), height: k(54) }} />
                        {t.n(s.stars)}
                      </>
                    )}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </PopList>
      {note && <div className="pop-toast" style={{ top: k(900) }}>{note}</div>}
    </BluePopup>
  );
}
