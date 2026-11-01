import { MAP_ART } from '../board/sprites.js';

// Scene transition between two screens: clouds sweep in from both sides and meet in the middle of the screen
// (phase 'in'), the screen underneath is switched while it is fully covered, then the clouds part again (phase 'out').
// Art: art/map/ui/cloud-1.webp + cloud-2.webp (the same clouds as the stage map).
export const CLOSE_MS = 800; // clouds travelling to the middle (last cloud delay + travel time)
export const OPEN_MS = 760; // clouds parting again

// one row of two clouds every 11% of the height, alternating the cloud picture; side = the edge they come from
const ROWS = [-6, 5, 16, 27, 38, 49, 60, 71, 82, 93];
const CLOUDS = ROWS.flatMap((top, i) => {
  const big = 100 + ((i * 7) % 5) * 6; // width, % of the screen width
  const d = (i % 5) * 38; // stagger (ms): the clouds do not arrive in one line
  return [
    { img: 'cloud-' + ((i % 2) + 1), side: -1, top, w: big, x: 30 + ((i * 11) % 9), d },
    { img: 'cloud-' + (((i + 1) % 2) + 1), side: 1, top: top + 3, w: big - 6, x: 70 - ((i * 7) % 9), d: d + 60 },
  ];
});

export default function CloudWipe({ phase }) {
  if (phase === 'idle') return null;
  return (
    <div className={'cloudwipe ' + phase} aria-hidden="true">
      <div className="cw-fill" />
      {CLOUDS.map((c, i) => (
        <img
          key={i}
          className="cw-cloud"
          src={`${MAP_ART}ui/${c.img}.webp`}
          alt=""
          draggable="false"
          style={{ top: c.top + '%', width: c.w + '%', left: c.x - c.w / 2 + '%', '--sx': c.side * 120, '--d': c.d + 'ms', '--flip': i % 3 === 0 ? -1 : 1 }}
        />
      ))}
    </div>
  );
}
