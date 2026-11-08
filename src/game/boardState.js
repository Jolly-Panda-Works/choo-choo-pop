import { startPaths, stepOnto } from './logic.js';
export const boardSignature = level => JSON.stringify([level.rows,level.cols,level.lanes,level.given,level.blocks,level.fixed,level.walls]);
export const freshBoard = level => ({ paths: startPaths(level), notes: {} });
export function restoreDraft(level, draft) {
  if (!draft || draft.signature !== boardSignature(level)) return null;
  const valid = board => {
    if (!board || !Array.isArray(board.paths) || board.paths.length !== level.lanes.length) return false;
    let paths = level.lanes.map(l => [l.solution[0]]);
    for (let li=0;li<paths.length;li++) {
      const p=board.paths[li];
      if (!Array.isArray(p) || p[0] !== paths[li][0]) return false;
      for (const cell of p.slice(1)) {
        if (!Number.isInteger(cell) || cell<0 || cell>=level.rows*level.cols) return false;
        const next=stepOnto(level,paths,li,cell);
        if(next===paths || next[li].length!==paths[li].length+1) return false;
        paths=next;
      }
    }
    return Object.entries(board.notes || {}).every(([cell,n]) => Number.isInteger(+cell) && +cell>=0 && +cell<level.rows*level.cols && (n===1 || n===2));
  };
  if (!valid(draft.present)) return null;
  return { ...draft, past: (draft.past||[]).filter(valid).slice(-200), future: (draft.future||[]).filter(valid).slice(-200) };
}
export const pushBoard = (history, present) => JSON.stringify(history.present)===JSON.stringify(present) ? history : ({past:[...history.past,history.present].slice(-200),present,future:[]});
export const undoBoard = h => h.past.length ? {past:h.past.slice(0,-1),present:h.past.at(-1),future:[h.present,...h.future]} : h;
export const redoBoard = h => h.future.length ? {past:[...h.past,h.present],present:h.future[0],future:h.future.slice(1)} : h;
