// The opening comic, shown panel by panel (screens/Story.jsx). Boxes are % of the page.
//   box:  [x, y, w, h]
//   art:  image of art/
//   text: key of i18n.js, kind: 'cap' | 'say' (tail: 'l' | 'r'), x, w, and y or b (from the bottom), in % of the panel

export const STORY = [
  {
    panels: [
      { box: [0, 0, 100, 38], art: 'story/s01.webp', text: { key: 's01', kind: 'cap', x: 3, b: 5, w: 58 } },
      { box: [0, 40, 48, 60], art: 'story/s02.webp', text: { key: 's02', kind: 'say', x: 6, y: 5, w: 88, tail: 'l' } },
      { box: [52, 40, 48, 60], art: 'story/s03.webp', text: { key: 's03', kind: 'cap', x: 6, y: 5, w: 88 } },
    ],
  },
  {
    panels: [
      { box: [0, 0, 100, 42], art: 'story/s04.webp', text: { key: 's04', kind: 'cap', x: 12, y: 5, w: 76 } },
      { box: [21, 44, 58, 56], art: 'story/s05.webp', text: { key: 's05', kind: 'say', x: 16, y: 5, w: 68, tail: 'l' } },
    ],
  },
  {
    panels: [
      { box: [0, 0, 100, 42], art: 'story/s06.webp', text: { key: 's06', kind: 'cap', x: 10, y: 5, w: 80 } },
      { box: [14, 44, 72, 56], art: 'story/s07.webp', text: { key: 's07', kind: 'say', x: 44, y: 6, w: 54, tail: 'l' } },
    ],
  },
  {
    panels: [
      { box: [0, 0, 100, 49], art: 'story/s08.webp', text: { key: 's08', kind: 'cap', x: 42, b: 4, w: 55 } },
      { box: [0, 51, 100, 49], art: 'story/s09.webp', text: { key: 's09', kind: 'cap', x: 42, b: 4, w: 55 } },
    ],
  },
  {
    panels: [
      { box: [0, 0, 38, 46], art: 'story/s10.webp', text: { key: 's10', kind: 'say', x: 6, y: 4, w: 88, tail: 'l' } },
      { box: [40, 0, 60, 46], art: 'story/s11.webp', text: { key: 's11', kind: 'say', x: 42, y: 6, w: 55, tail: 'l' } },
      { box: [20, 48, 60, 52], art: 'story/s12.webp', text: { key: 's12', kind: 'cap', x: 6, b: 2, w: 88 } },
    ],
  },
  {
    panels: [
      { box: [0, 0, 100, 52], art: 'story/s13.webp', text: { key: 's13', kind: 'cap', x: 5, b: 2, w: 90 } },
      { box: [0, 54, 100, 46], art: 'story/s14.webp', text: { key: 's14', kind: 'say', x: 50, y: 6, w: 47, tail: 'l' } },
    ],
  },
  {
    panels: [
      { box: [0, 0, 48, 44], art: 'story/s15.webp', text: { key: 's15', kind: 'cap', x: 6, b: 4, w: 88 } },
      { box: [52, 0, 48, 44], art: 'story/s16.webp', text: { key: 's16', kind: 'say', x: 6, y: 4, w: 88, tail: 'l' } },
      { box: [0, 46, 100, 54], art: 'story/s17.webp', text: { key: 's17', kind: 'cap', x: 48, y: 5, w: 48 } },
    ],
  },
  {
    panels: [
      { box: [0, 19, 100, 62], art: 'story/s18.webp', text: { key: 's18', kind: 'say', x: 3, y: 9, w: 50, tail: 'r' } },
    ],
  },
];
