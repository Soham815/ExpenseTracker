/** Generic wa.me link builder for messaging a friend about a shared expense. */
export function whatsAppLinkTo(number, message) {
	const digits = (number || "").replace(/[^\d]/g, "");
	return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function activityDebtMessage({ activityName, amount, toName }) {
	return `Hi, for "${activityName}" you owe ₹${amount} to ${toName}. Please settle whenever convenient.`;
}
