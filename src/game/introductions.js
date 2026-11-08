import { POWERUP_TEACH, TIMER_FIRST_LEVEL } from './constants.js';
export const CONTROL_LESSONS = [
  { id:'undo', level:1, title:'undo', text:'teachUndo', art:'undo.png' },
  { id:'redo', level:1, title:'redo', text:'teachRedo', art:'undo.png', mirror:true },
  { id:'restart', level:1, title:'restart', text:'teachRestart', art:'restart.png' },
  { id:'hint', level:10, title:'hint', text:'teachHint', bulb:true },
  { id:'notes', level:21, title:'notes', text:'teachNotes', art:'icon-notes-v1.png' },
  { id:'timer', level:TIMER_FIRST_LEVEL, title:'solveTime', text:'teachTimer', art:'timer-trough-v1.png' },
];
export function introductionLessons(level, taught = {}, powers = {}) {
  return [
    ...CONTROL_LESSONS.filter(l => level.id >= l.level && !taught[l.id]),
    ...Object.entries(POWERUP_TEACH).filter(([id,n]) => level.id >= n && !powers[id]).map(([id]) => ({id:'power_'+id,power:id,title:'pw_'+id,text:'pwi_'+id})),
    ...(level.lesson && !taught[level.lesson] ? [{id:level.lesson,title:'newRule',text:level.lesson}] : []),
  ];
}
