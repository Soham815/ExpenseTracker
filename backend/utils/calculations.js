export function round2(n) {
	return Math.round((n + Number.EPSILON) * 100) / 100;
}
