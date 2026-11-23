import { V5_ART } from '../board/sprites.js';
import { useT } from '../i18n.js';

export default function AdArtwork({ name, style }) {
  const t = useT();

  return (
    <span className={`ad-art ad-art--${name}`} style={style} aria-hidden="true">
      <img src={`${V5_ART}${name}.webp`} alt="" draggable="false" />
      {t.lang === 'fa' && <span className="ad-art-label">{t('adArtworkLabel')}</span>}
    </span>
  );
}
