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
	const bgn = new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }).format(value);
	const eur = new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'EUR' }).format(
		value / 1.95583
	);
	return `${bgn}`;
}
