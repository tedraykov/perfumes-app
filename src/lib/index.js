// place files you want to import through the `$lib` alias in this folder.

/**
 * Display labels for the raw gender values stored in the DB.
 * @type {Record<string, string>}
 */
const GENDER_LABELS = {
	women: 'Дамски',
	men: 'Мъжки',
	unisex: 'Унисекс'
};

/**
 * @param {string | null | undefined} gender
 * @returns {string}
 */
export function genderLabel(gender) {
	if (!gender) return '';
	return GENDER_LABELS[gender.toLowerCase()] ?? gender;
}
