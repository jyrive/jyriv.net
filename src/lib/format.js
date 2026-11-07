const formatter = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric'
});

/** @param {string} iso `YYYY-MM-DD` */
export function formatDate(iso) {
	if (!iso) return '';
	const date = new Date(`${iso}T00:00:00Z`);
	return Number.isNaN(date.valueOf()) ? iso : formatter.format(date);
}
