export function demoLanguage(languages = []) {
  for (const language of languages) {
    const base=String(language).toLowerCase().split('-')[0];
    if(base==='fa' || base==='en') return base;
  }
  return 'en';
}
export function demoUnlocked(stars, count=10) {
  let level=1;
  while(level<count && (stars[level] || 0)>0) level++;
  return level;
}
export const demoDownloadUrl = language => `https://jollypanda.ir/${language === 'fa' ? 'fa' : 'en'}/games/choo-choo-pop/`;
