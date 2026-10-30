import { useSave } from './store.js';

const dict = {
  en: {
    title: 'Choo Choo Pop',
    play: 'Play',
    continue: 'Continue',
    levels: 'Levels',
    settings: 'Settings',
    level: 'Level',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
    hint: 'Hint',
    undo: 'Undo',
    restart: 'Restart',
    next: 'Next level',
    replay: 'Play again',
    back: 'Back',
    sound: 'Sound',
    vibration: 'Vibration',
    language: 'Language',
    resetProgress: 'Reset progress',
    resetConfirm: 'Erase all progress?',
    yes: 'Yes, erase',
    cancel: 'Cancel',
    won: 'All aboard!',
    allDone: 'You finished every level. New tracks are coming soon!',
    noHints: 'No hints left. You earn one every 3rd level.',
    countsOff: 'Almost there. Check the numbers!',
    updateAvail: 'New version {v} is available',
    update: 'Update',
    version: 'Version',
    tut1: 'Drag your finger from the green arrow to the red arrow to lay the rails.',
    tut2: 'The numbers show how many rails each row and column needs.',
    tut3: 'Slide back over your track to erase it. Green numbers mean a line is done.',
    tutGiven: 'Gold star tiles must be part of your track.',
    stars: 'Stars',
    offline: 'Plays fully offline',
    portraitOnly: 'Please rotate your phone upright',
  },
  fa: {
    title: 'چو چو پاپ',
    play: 'شروع بازی',
    continue: 'ادامه',
    levels: 'مرحله‌ها',
    settings: 'تنظیمات',
    level: 'مرحله',
    easy: 'آسان',
    medium: 'متوسط',
    hard: 'سخت',
    expert: 'حرفه‌ای',
    hint: 'راهنما',
    undo: 'برگشت',
    restart: 'از اول',
    next: 'مرحله بعد',
    replay: 'دوباره',
    back: 'بازگشت',
    sound: 'صدا',
    vibration: 'لرزش',
    language: 'زبان',
    resetProgress: 'پاک کردن پیشرفت',
    resetConfirm: 'همهٔ پیشرفت پاک شود؟',
    yes: 'بله، پاک کن',
    cancel: 'انصراف',
    won: 'همه سوار شدند!',
    allDone: 'همهٔ مرحله‌ها را تمام کردی. مرحله‌های جدید به‌زودی می‌آیند!',
    noHints: 'راهنما تمام شد. با هر ۳ مرحله یک راهنما می‌گیری.',
    countsOff: 'نزدیکی! عددها را بررسی کن.',
    updateAvail: 'نسخهٔ جدید {v} آماده است',
    update: 'به‌روزرسانی',
    version: 'نسخه',
    tut1: 'انگشتت را از فلش سبز تا فلش قرمز بکش تا ریل بچینی.',
    tut2: 'عددها نشان می‌دهند هر سطر و ستون چند ریل لازم دارد.',
    tut3: 'برای پاک کردن، انگشتت را روی مسیر به عقب بکش. عدد سبز یعنی آن خط کامل است.',
    tutGiven: 'خانه‌های ستاره‌دار حتماً باید جزو مسیر باشند.',
    stars: 'ستاره',
    offline: 'کاملاً آفلاین',
    portraitOnly: 'لطفاً گوشی را عمودی نگه دار',
  },
};

export function useT() {
  const { lang } = useSave();
  const t = (key, vars) => {
    let s = dict[lang]?.[key] ?? dict.en[key] ?? key;
    if (vars) for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
    return s;
  };
  t.lang = lang;
  t.dir = lang === 'fa' ? 'rtl' : 'ltr';
  return t;
}
