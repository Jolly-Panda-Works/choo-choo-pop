import { UI_ART } from '../board/sprites.js';
import { ua } from '../anim/ua.js';

/**
 * Sky scene of the menu screens (Home, levels, shop, settings): the "home" art of the v4 UI kit.
 * sky + drifting clouds + grass hill at the bottom. `decor` adds the two candy trees (Home and the levels screen).
 * The island map (art/map/bg) is NOT used here - it belongs to the stage map only.
 */
export default function HomeScene({ decor = false }) {
  return (
    <div className="scene" aria-hidden="true">
      <img className="scene-sky" src={`${UI_ART}home-sky.webp`} alt="" draggable="false" />
      <img className={'scene-cloud l ' + ua('level-scene-portrait-clouds-cloud-i1dle')} src={`${UI_ART}home-cloud-left.webp`} alt="" draggable="false" />
      <img className={'scene-cloud r ' + ua('level-scene-portrait-clouds-cloud2-idle')} src={`${UI_ART}home-cloud-right.webp`} alt="" draggable="false" />
      <img className="scene-floor" src={`${UI_ART}home-floor.webp`} alt="" draggable="false" />
      {decor && (
        <>
          <img className="scene-tree rose" src={`${UI_ART}tree-rose.webp`} alt="" draggable="false" />
          <img className="scene-tree yellow" src={`${UI_ART}tree-yellow.webp`} alt="" draggable="false" />
        </>
      )}
    </div>
  );
}
