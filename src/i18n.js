import { EDITION } from './config.js';

// The English build only ships English, the Persian build only Persian (see EDITION).
const dict = {
  en: {
    title: 'Choo Choo Pop',
    play: 'Play',
    continue: 'Continue',
    levels: 'Levels',
    settings: 'Settings',
    level: 'Level',
    tutorial: 'Learn',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    hint: 'Hint',
    undo: 'Undo',
    restart: 'Restart',
    next: 'Next level',
    replay: 'Play again',
    back: 'Back',
    sound: 'Sound',
    vibration: 'Vibration',
    resetProgress: 'Start over',
    resetConfirm: 'Erase all your stars and levels?',
    yes: 'Yes, erase',
    cancel: 'No',
    won: 'All aboard!',
    allDone: 'You finished all 20 levels! More tracks are coming soon!',
    tutDone: 'You know how to play now. Real puzzles start next!',
    noHints: 'No hints left. You get a new one every 2 levels!',
    countsOff: 'Almost! Look at the numbers again.',
    version: 'Version',
    stars: 'Stars',
    offline: 'Plays without internet',
    portraitOnly: 'Please hold your phone upright',
    tut1: 'Touch the green arrow and slide your finger to the red arrow!',
    tut2: 'Rails can turn! Keep sliding until you reach the red arrow.',
    tut3: 'Look at the numbers! They tell how many rails each row and column needs.',
    tut3b: 'A green number means that line is full. Make every number green!',
    tut4: 'Oops! This rail is in the wrong place. Slide your finger back over it to erase it.',
    tut4b: 'Well done! Now follow the numbers to the red arrow.',
    tutWrong: 'Not this way! Slide back to erase, then try again.',
    tut5: 'Gold star tiles must be on your track. Go through the star!',
  },
  fa: {
    title: 'هو هو چی چی',
    play: 'شروع بازی',
    continue: 'ادامه',
    levels: 'مرحله‌ها',
    settings: 'تنظیمات',
    level: 'مرحله',
    tutorial: 'آموزش',
    easy: 'آسان',
    medium: 'متوسط',
    hard: 'سخت',
    hint: 'راهنما',
    undo: 'برگشت',
    restart: 'از اول',
    next: 'مرحله بعد',
    replay: 'دوباره',
    back: 'بازگشت',
    sound: 'صدا',
    vibration: 'لرزش',
    resetProgress: 'شروع دوباره',
    resetConfirm: 'همهٔ ستاره‌ها و مرحله‌ها پاک شود؟',
    yes: 'بله، پاک کن',
    cancel: 'نه',
    won: 'همه سوار شدند!',
    allDone: 'هر ۲۰ مرحله را تمام کردی! مرحله‌های جدید به‌زودی می‌آیند!',
    tutDone: 'حالا بازی را بلدی. مرحله‌های اصلی شروع می‌شود!',
    noHints: 'راهنما تمام شد. با هر ۲ مرحله یک راهنمای تازه می‌گیری!',
    countsOff: 'نزدیک بود! دوباره به عددها نگاه کن.',
    version: 'نسخه',
    stars: 'ستاره',
    offline: 'بدون اینترنت بازی می‌شود',
    portraitOnly: 'لطفاً گوشی را عمودی نگه دار',
    tut1: 'انگشتت را روی فلش سبز بگذار و تا فلش قرمز بکِش!',
    tut2: 'ریل می‌تواند بپیچد! بکِش تا به فلش قرمز برسی.',
    tut3: 'به عددها نگاه کن! هر عدد می‌گوید آن ردیف یا ستون چند ریل می‌خواهد.',
    tut3b: 'عدد سبز یعنی آن خط کامل شده. همهٔ عددها را سبز کن!',
    tut4: 'اوه! این ریل جای اشتباهی است. انگشتت را روی آن به عقب بکِش تا پاک شود.',
    tut4b: 'آفرین! حالا با کمک عددها تا فلش قرمز برو.',
    tutWrong: 'از این طرف نه! به عقب بکِش تا پاک شود و دوباره امتحان کن.',
    tut5: 'خانهٔ ستاره‌دار حتماً باید روی مسیرت باشد. از روی ستاره رد شو!',
  },
};

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function useT() {
  const t = (key, vars) => {
    let s = dict[EDITION][key] ?? dict.en[key] ?? key;
    if (vars) for (const k in vars) s = s.replace(`{${k}}`, vars[k]);
    return s;
  };
  t.lang = EDITION;
  t.dir = EDITION === 'fa' ? 'rtl' : 'ltr';
  /** Numbers shown to the child (Persian digits in the Persian edition). */
  t.n = (x) => (EDITION === 'fa' ? String(x).replace(/\d/g, (d) => FA_DIGITS[d]) : String(x));
  return t;
}

export const formatNumber = (x) => (EDITION === 'fa' ? String(x).replace(/\d/g, (d) => FA_DIGITS[d]) : String(x));
