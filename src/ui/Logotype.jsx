import { EDITION } from '../config.js';
import { useT } from '../i18n.js';

// Logotype of the Home screen. Drop  src/assets/logotype/en.(webp|png|svg)  and  fa.(webp|png|svg)  in the folder
// (see its README.txt): the file of the running edition is used. Without a file the title is drawn as text.
const files = import.meta.glob('../assets/logotype/*.{webp,png,svg}', { eager: true, query: '?url', import: 'default' });
const mine = Object.entries(files).find(([path]) => new RegExp(`/${EDITION}\\.(webp|png|svg)$`).test(path));
export const LOGOTYPE_SRC = mine ? mine[1] : null;

export default function Logotype({ className = '' }) {
  const t = useT();
  if (LOGOTYPE_SRC) return <img className={'logotype ' + className} src={LOGOTYPE_SRC} alt={t('title')} draggable="false" />;
  const words = t('title').split(' ');
  const last = words.pop();
  return (
    <h1 className={'game-title ' + className}>
      {words.map((w, i) => (
        <span key={i}>{w} </span>
      ))}
      <span className="pop">{last}</span>
    </h1>
  );
}
