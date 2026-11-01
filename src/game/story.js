// The opening comic: 6 pages of 2 or 3 panels, shown panel by panel (screens/Story.jsx).
//
// A page is 5:7. `box` = [x, y, w, h] of a panel in % of the page.
// `text` = { key, kind: 'cap' (narrator) | 'say' (speech), x, y or b (from the bottom), w, tail } in % of the panel: the words come from i18n.js,
// so the art itself never has any text. tail: 'l' | 'r' = speech tail on that side at the bottom of the bubble.
//
// Until the real art is in, a panel is put together from the game's assets:
//   bg:    'sky' | 'grass' | 'dusk' or an image of art/ (covers the panel)
//   scene: [{ src, x, y, w, rot, flip }] or [{ panda: pose, ... }] or [{ num: '3', ... }], x, y = centre, w = width, in % of the panel.
// Real art (docs/STORY_PROMPTS.fa.md): add  art: 'story/p1-1.webp'  to the panel; bg and scene are then ignored.
const TRACK = 'track/straight.png';
const CURVE = 'track/curve.png';

export const STORY = [
  {
    panels: [
      { box: [0, 0, 100, 38], bg: 'sky', art: 'story/p1-1.webp', text: { key: 's1a', kind: 'cap', x: 3, b: 4, w: 58 } },
      {
        box: [0, 40, 48, 60],
        bg: 'sky',
        scene: [{ src: 'bg/cloud-1.png', x: 28, y: 12, w: 44 }, { src: 'bg/hills.png', x: 50, y: 92, w: 230 }, { panda: 'wave', x: 50, y: 62, w: 72 }],
        art: 'story/p1-2.webp', text: { key: 's1b', kind: 'say', x: 6, y: 4, w: 88, tail: 'l' },
      },
      {
        box: [52, 40, 48, 60],
        bg: 'sky',
        scene: [
          { src: 'bg/hills.png', x: 50, y: 80, w: 240 },
          { src: 'ui/tree-rose.webp', x: 26, y: 62, w: 36 },
          { src: 'ui/tree-yellow.webp', x: 74, y: 66, w: 30 },
          { src: 'deco/flower-pink.webp', x: 50, y: 90, w: 26 },
          { src: 'deco/bush.png', x: 82, y: 92, w: 34 },
        ],
        art: 'story/p1-3.webp', text: { key: 's1c', kind: 'cap', x: 6, y: 5, w: 88 },
      },
    ],
  },
  {
    panels: [
      {
        box: [0, 0, 100, 42],
        bg: 'grass',
        scene: [
          { src: CURVE, x: 22, y: 62, w: 24, rot: 20 },
          { src: TRACK, x: 42, y: 74, w: 24, rot: 65 },
          { src: CURVE, x: 58, y: 56, w: 24, rot: 200 },
          { src: TRACK, x: 76, y: 70, w: 24, rot: 120 },
          { src: TRACK, x: 90, y: 46, w: 20, rot: 35 },
        ],
        art: 'story/p2-1.webp', text: { key: 's2a', kind: 'cap', x: 4, y: 7, w: 74 },
      },
      {
        box: [0, 44, 48, 56],
        bg: 'dusk',
        scene: [{ panda: 'lever', x: 50, y: 66, w: 78 }],
        art: 'story/p2-2.webp', text: { key: 's2b', kind: 'say', x: 18, y: 5, w: 64, tail: 'r' },
      },
      {
        box: [52, 44, 48, 56],
        bg: 'grass',
        scene: [
          { src: 'train/engine.png', x: 44, y: 68, w: 62, rot: -24 },
          { src: 'train/wagon-yellow.png', x: 76, y: 88, w: 50, rot: 20 },
          { src: 'train/smoke.png', x: 30, y: 44, w: 26 },
        ],
        art: 'story/p2-3.webp', text: { key: 's2c', kind: 'cap', x: 6, y: 5, w: 88 },
      },
    ],
  },
  {
    panels: [
      {
        box: [0, 0, 100, 49],
        bg: 'grass',
        scene: [
          { src: TRACK, x: 42, y: 62, w: 22 },
          { src: TRACK, x: 64, y: 62, w: 22 },
          { src: TRACK, x: 86, y: 62, w: 22 },
          { src: 'train/engine.png', x: 56, y: 62, w: 26 },
          { src: 'gates/entry.png', x: 20, y: 62, w: 26, rot: 90 },
        ],
        art: 'story/p3-1.webp', text: { key: 's3a', kind: 'cap', x: 4, y: 6, w: 92 },
      },
      {
        box: [0, 51, 100, 49],
        bg: 'grass',
        scene: [
          { src: TRACK, x: 14, y: 40, w: 22 },
          { src: TRACK, x: 36, y: 40, w: 22 },
          { src: TRACK, x: 58, y: 40, w: 22 },
          { src: 'train/engine.png', x: 44, y: 40, w: 26 },
          { src: 'gates/exit.png', x: 80, y: 40, w: 26, rot: 90 },
        ],
        art: 'story/p3-2.webp', text: { key: 's3b', kind: 'cap', x: 4, b: 6, w: 92 },
      },
    ],
  },
  {
    panels: [
      {
        box: [0, 0, 60, 46],
        bg: 'sky',
        scene: [{ src: 'bg/hills.png', x: 50, y: 92, w: 170 }, { panda: 'point', x: 32, y: 64, w: 56 }],
        art: 'story/p4-1.webp', text: { key: 's4a', kind: 'say', x: 34, y: 5, w: 62, tail: 'l' },
      },
      {
        box: [62, 0, 38, 46],
        bg: 'dusk',
        scene: [{ num: '3', x: 30, y: 70, w: 34 }, { num: '5', x: 70, y: 70, w: 34 }],
        art: 'story/p4-2.webp', text: { key: 's4b', kind: 'cap', x: 12, y: 8, w: 76 },
      },
      {
        box: [0, 48, 100, 52],
        bg: 'grass',
        scene: [
          { num: '2', x: 14, y: 30, w: 14 },
          { src: CURVE, x: 34, y: 42, w: 22 },
          { src: TRACK, x: 56, y: 42, w: 22 },
          { src: TRACK, x: 78, y: 42, w: 22 },
          { src: 'train/engine.png', x: 68, y: 42, w: 24 },
        ],
        art: 'story/p4-3.webp', text: { key: 's4c', kind: 'cap', x: 4, y: 5, w: 92 },
      },
    ],
  },
  {
    panels: [
      {
        box: [0, 0, 100, 58],
        bg: 'sky',
        scene: [
          { src: 'bg/cloud-2.png', x: 82, y: 26, w: 30 },
          { src: 'bg/hills.png', x: 50, y: 88, w: 120 },
          { panda: 'ticket', x: 28, y: 62, w: 44 },
        ],
        art: 'story/p5-1.webp', text: { key: 's5a', kind: 'say', x: 50, y: 12, w: 46, tail: 'l' },
      },
      {
        box: [0, 60, 100, 40],
        bg: 'dusk',
        scene: [{ panda: 'salute', x: 74, y: 62, w: 34 }],
        art: 'story/p5-2.webp', text: { key: 's5b', kind: 'say', x: 6, y: 30, w: 52, tail: 'r' },
      },
    ],
  },
  {
    panels: [
      {
        box: [0, 0, 48, 44],
        bg: 'sky',
        scene: [{ src: 'bg/cloud-3.png', x: 76, y: 12, w: 46 }, { panda: 'whistle', x: 50, y: 64, w: 66 }],
        art: 'story/p6-1.webp', text: { key: 's6a', kind: 'say', x: 8, y: 5, w: 66, tail: 'r' },
      },
      {
        box: [52, 0, 48, 44],
        bg: 'grass',
        scene: [
          { src: TRACK, x: 28, y: 66, w: 44 },
          { src: TRACK, x: 72, y: 66, w: 44 },
          { src: 'train/engine.png', x: 54, y: 66, w: 52 },
          { src: 'train/smoke.png', x: 74, y: 48, w: 24 },
        ],
        art: 'story/p6-2.webp', text: { key: 's6b', kind: 'cap', x: 6, y: 5, w: 88 },
      },
      {
        box: [0, 46, 100, 54],
        bg: 'sky',
        scene: [
          { src: 'bg/hills.png', x: 50, y: 84, w: 120 },
          { src: 'ui/tree-rose.webp', x: 88, y: 62, w: 18 },
          { panda: 'cheer', x: 26, y: 58, w: 38 },
        ],
        art: 'story/p6-3.webp', text: { key: 's6c', kind: 'say', x: 46, y: 8, w: 48, tail: 'l' },
      },
    ],
  },
];
