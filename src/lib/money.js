/**
 * @param {number} value
 * @returns {string}
 */
export function toMoney(value) {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(value);
}
