// Puzzle identity ignores metadata, lane ordering, rotations, reflections and
// travel direction. Clues and mandatory stars remain part of the puzzle.
export function puzzleKey(d) {
  const lanes = d.lanes || [{ entry: d.entry, exit: d.exit, solution: d.solution }];
  const keys = [];
  for (let mirror = 0; mirror < 2; mirror++) for (let turns = 0; turns < 4; turns++) {
    let h = d.rows, w = d.cols;
    const point = (r, c) => {
      let hh = d.rows, ww = d.cols;
      if (mirror) c = ww - 1 - c;
      for (let t = 0; t < turns; t++) { [r,c] = [c,hh-1-r]; [hh,ww] = [ww,hh]; }
      return [r,c];
    };
    if (turns % 2) [h,w] = [w,h];
    const cell = i => { const [r,c] = point(Math.floor(i / d.cols), i % d.cols); return r*w+c; };
    const gate = g => {
      const [r,c] = point(g[0],g[1]);
      let side = mirror ? [0,3,2,1][g[2]] : g[2];
      side = (side+turns)%4;
      return [r,c,side];
    };
    const transformed = lanes.map(l => {
      const a=gate(l.entry), b=gate(l.exit);
      return [a,b].sort((x,y)=>JSON.stringify(x).localeCompare(JSON.stringify(y)));
    }).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const rows=Array(h).fill(0), cols=Array(w).fill(0);
    for (const l of lanes) for (const i of l.solution) { const j=cell(i); rows[Math.floor(j/w)]++; cols[j%w]++; }
    const walls=(d.walls||[]).map(pair=>pair.map(cell).sort((a,b)=>a-b)).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const fixed=(d.fixed||[]).map(f=>[cell(f.cell),f.sides.map(side=>((mirror?[0,3,2,1][side]:side)+turns)%4).sort()]).sort((a,b)=>a[0]-b[0]);
    keys.push(JSON.stringify([walls,fixed,h,w,transformed,rows,cols,(d.blocks||[]).map(cell).sort((a,b)=>a-b),(d.given||[]).map(cell).sort((a,b)=>a-b)]));
  }
  return keys.sort()[0];
}
