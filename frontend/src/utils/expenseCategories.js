const CATEGORY_COLORS = {
	"Food & Dining": "#f2734f",
	Groceries: "#2e9d5c",
	Transport: "#2f9bd6",
	Housing: "#8b7fd1",
	"Bills & Utilities": "#d1495b",
	Shopping: "#e8608f",
	"Health & Fitness": "#0f8a7a",
	Entertainment: "#d99a2b",
	"Group Expenses": "#6c5fc0",
};

/** Known categories get a fixed color; custom ones get a stable hash-based pastel-vivid color. */
export function categoryColor(name) {
	if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
	let hash = 0;
	for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 55%, 55%)`;
}

export const MONTH_NAMES = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** A plain, factual note about the highest-spend month — no personality, just the number. */
export function highestMonthInsight(monthName, amount) {
	return `${monthName} was your highest-spending month this year, at ₹${amount.toLocaleString()}.`;
}
