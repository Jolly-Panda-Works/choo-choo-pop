// Marketplace SKU details expose a localized price label. Only accept explicit units.
export function priceInRials(label) {
  const normalized = String(label || '').replace(/[۰-۹]/g, c => c.charCodeAt(0) - 0x6f0)
    .replace(/[٠-٩]/g, c => c.charCodeAt(0) - 0x660).replace(/[\u200e\u200f]/g, '').trim();
  const parts = normalized.match(/^(?:(IRR|ریال|تومان)\s*)?(\d+|\d{1,3}(?:[,٬ ]\d{3})+)(?:\s*(IRR|ریال|تومان))?$/i);
  if (!parts || !!parts[1] === !!parts[3]) return null;
  const amount = Number(parts[2].replace(/[,٬ ]/g, '')) * ((parts[1] || parts[3]) === 'تومان' ? 10 : 1);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}
