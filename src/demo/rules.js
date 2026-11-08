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

export const DEMO_SOCIALS = [
  { id: 'telegram', url: 'https://t.me/UsefGameLab', fa: 'عضویت در کانال تلگرام', en: 'Join our Telegram channel' },
];
export function demoHintSpend(save) {
  return save.demoHints > 0 ? { demoHints: save.demoHints - 1 } : null;
}
export function demoSocialReward(save, reward) {
  if (reward?.provider !== 'telegram' || reward.amount !== 2 || typeof reward.id !== 'string' || !reward.id || save.demoVerifiedGrants?.includes(reward.id) || save.demoSocialClaimed?.includes('telegram')) return null;
  return { demoHints: save.demoHints + 2, demoVerifiedGrants: [...(save.demoVerifiedGrants || []), reward.id], demoSocialClaimed: [...(save.demoSocialClaimed || []), 'telegram'] };
}
