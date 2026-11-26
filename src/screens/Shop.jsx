import { useEffect, useRef, useState } from 'react';
import { k } from '../ui/v5.jsx';
import BluePopup, { inPopup, rowLook, tabColors } from '../ui/BluePopup.jsx';
import PopList from '../ui/PopList.jsx';
import AdArtwork from '../ui/AdArtwork.jsx';
import { Bulb } from '../ui/icons.jsx';
import { useSave, buyHintPack, addHints, buyPowerup } from '../store.js';
import { useT } from '../i18n.js';
import { HINT_PACKS, POWERUP_PACKS } from '../config.js';
import { ads } from '../services/ads.js';
import { ART } from '../board/sprites.js';
import { sfx } from '../audio.js';


export default function Shop({ onBack }) {
  const save = useSave();
  const t = useT();
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('hints');
  const categories = [{ id: 'hints', label: t('hints') }, { id: 'freeze', label: t('pw_freeze') }, { id: 'peek', label: t('pw_peek') }].filter(c => c.id === 'hints' || save.taught[c.id]);
  const activeCategory = categories.find(c => c.id === category) || categories[0];
  const owned = activeCategory.id === 'hints' ? save.hints : save.powerups[activeCategory.id] || 0;
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const say = (m) => {
    setNote(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(''), 2300);
  };
  const noCoins = () => {
    sfx.error();
    say(t('notEnoughCoins'));
  };

  // one entry per row: { key, icon, name, info, btn: {label, coin?, real?, on?, disabled?, run} }
  const rows = [];
  if (ads.rewardedAvailable())
    rows.push({ category: 'hints', key: 'vid', icon: <AdArtwork name="icon-free-hint" style={{ width: '76%' }} />, count: 1, name: t('freeHint'), info: t('watchShort'), btn: { label: t('free'), run: () => ads.rewarded({ placement: 'shop', kind: 'hint' }, () => addHints(1)) } });
  for (const p of POWERUP_PACKS.filter(p => save.taught[p.power]))
    rows.push({
      category: p.power,
      key: p.id,
      icon: <img src={`${ART}ui/${p.art}`} alt="" draggable="false" style={{ width: '88%', height: '92%', objectFit: 'contain' }} />,
      count: p.count,
      name: t(p.size === 'small' ? 'smallPowerPack' : 'largePowerPack', { power: t('pw_' + p.power) }),
      btn: { label: t.n(p.price), coin: true, run: () => (buyPowerup(p.id) ? (sfx.coins(), say(t('bought'))) : noCoins()) },
    });
  for (const h of HINT_PACKS)
    rows.push({
      category: 'hints',
      key: h.id,
      icon: <Bulb size="72%" />,
      count: h.hints,
      name: t(h.id === 'hints_small' ? 'smallPack' : 'bigPack'),
      info: t('hintsCount', { n: t.n(h.hints) }),
      btn: { label: t.n(h.price), coin: true, run: () => (buyHintPack(h) ? (sfx.coins(), say(t('bought'))) : noCoins()) },
    });
  return (
    <>
      <BluePopup frame="shop" title={t('shop')} onClose={onBack}>
        <nav className="tabs" style={{ ...inPopup(190, 530, 1040, 88), ...tabColors('shop') }} aria-label={t('shopCategories')}>
          {categories.map(({ id, label }) => (
            <button key={id} type="button" className={activeCategory.id === id ? 'on' : ''}
              aria-pressed={activeCategory.id === id} onClick={() => { sfx.click(); setCategory(id); }}>
              {label}
            </button>
          ))}
        </nav>
        <PopList key={activeCategory.id} style={inPopup(160, 634, 1128, 1437)}>
          <div className="shop-products">
            <section className="shop-category-products" aria-label={activeCategory.label} key={activeCategory.id}>
            <div className="shop-category-header"><h3 className="shop-category-heading">{activeCategory.label}</h3><span className="shop-category-owned">{t('shopOwned', { n: t.n(owned) })}</span></div>
            {rows.filter(r => r.category === activeCategory.id).map((r) => {
              const look = rowLook('shop');
              return <div key={r.key} className="shop-product" style={{background:look.color,borderColor:look.edge,color:look.ink}}>
                <div className="shop-product-art">{r.icon}{r.count != null && <span className="shop-product-count">{t.n(r.count)}</span>}</div>
                <div className="shop-product-copy"><div className="shop-product-name">{r.name}</div>{r.info && <div className="shop-product-info">{r.info}</div>}</div>
                <button className="shop-product-buy" onClick={r.btn.run} aria-label={r.name + ' ' + r.btn.label}>
                  {r.btn.coin && <img src={ART+'v5/coin-gold.webp'} alt="" draggable="false" />}<span>{r.btn.label}</span>
                </button>
              </div>;
            })}
            </section>
          </div>
        </PopList>
        {note && <div className="pop-toast" style={{ top: k(900) }}>{note}</div>}
      </BluePopup>
    </>
  );
}
