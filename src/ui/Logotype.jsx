import { useT } from '../i18n.js';

// Logotype of the Home screen. Drop  src/assets/logotype/en.(webp|png|svg)  and  fa.(webp|png|svg)  in the folder
// (see its README.txt): the file of the current language is used. Without a file the title is drawn as text.
const files = import.meta.glob('../assets/logotype/*.{webp,png,svg}', { eager: true, query: '?url', import: 'default' });
const fileOf = (lang) => Object.entries(files).find(([path]) => new RegExp(`/${lang}\\.(webp|png|svg)$`).test(path))?.[1];

export default function Logotype({ className = '' }) {
  const t = useT();
  const src = fileOf(t.lang);
  if (src) return <img className={'logotype ' + className} src={src} alt={t('title')} draggable="false" />;
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
