// Shop products are explicit: callers select an id, never supply a price/count.
export const POWERUP_PACKS = [
  { id: 'freeze_small', power: 'freeze', size: 'small', count: 3, price: 150, art: 'pack-freeze-small-v1.png' },
  { id: 'freeze_large', power: 'freeze', size: 'large', count: 10, price: 400, art: 'pack-freeze-large-v1.png' },
  { id: 'peek_small', power: 'peek', size: 'small', count: 3, price: 180, art: 'pack-peek-small-v1.png' },
  { id: 'peek_large', power: 'peek', size: 'large', count: 10, price: 480, art: 'pack-peek-large-v1.png' },
];
export function purchasePowerupPack(state, packId) {
  const pack = POWERUP_PACKS.find(p => p.id === packId);
  if (!pack || !state.taught?.[pack.power] || !Number.isFinite(state.coins) || state.coins < pack.price) return null;
  return { coins: state.coins-pack.price, powerups: {...state.powerups, [pack.power]: (state.powerups[pack.power] || 0)+pack.count} };
}
