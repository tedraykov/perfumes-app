import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * @param {number} value
 * @returns {string}
 */
export function toMoney(value) {
  return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }).format(value);
}
