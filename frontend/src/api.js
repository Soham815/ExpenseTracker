// trailing slashes are stripped so "https://host/" can't become "https://host//api"
const BASE = `${(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "")}/api`;

function authHeaders() {
	const token = localStorage.getItem("expense_tracker_token");
	return token ? { Authorization: `Bearer ${token}` } : {};
}

// The server answered with a web page or plain text instead of data. The cause
// matters, so say which it is rather than always blaming VITE_API_URL.
async function nonJsonMessage(res) {
	let path = "";
	try {
		path = new URL(res.url).pathname;
	} catch {
		/* no usable URL on the response */
	}

	if (res.status === 404) {
		// A 404 means "this server has no such endpoint". Ask it who it is: if it's a
		// different project's backend, that's the real problem (wrong port / wrong URL),
		// not missing code.
		let who = null;
		try {
			who = (await (await fetch(`${BASE}/health`)).json()).project;
		} catch {
			/* health check unreachable — fall through to the generic explanation */
		}
		if (who && who !== "Expense Tracker") {
			return `This app is connected to the wrong backend — it answered as "${who}", not the Expense Tracker backend. Check VITE_API_URL (or which backend is using port 4000) so it points at the Expense Tracker backend.`;
		}
		return `The Expense Tracker backend you're connected to has no endpoint for this request${path ? ` (${path})` : ""}. It's probably running older code — restart or redeploy it with the latest files.`;
	}
	if (res.status >= 500) {
		return `The server isn't responding properly (HTTP ${res.status}). It may still be starting up — wait a few seconds and try again.`;
	}
	return "Got a web page instead of data from the API. Check that VITE_API_URL is set correctly and points at your backend.";
}

async function handle(res) {
	const contentType = res.headers.get("content-type") || "";
	if (!contentType.includes("application/json")) {
		throw new Error(await nonJsonMessage(res));
	}
	const data = await res.json();
	if (res.status === 401) {
		localStorage.removeItem("expense_tracker_token");
		localStorage.removeItem("expense_tracker_user");
		window.location.reload();
		throw new Error(data.error || "Session expired");
	}
	if (!res.ok) throw new Error(data.error || "Something went wrong");
	return data;
}

export const api = {
	// Auth
	signup: (name, mobile_number, pin) =>
		fetch(`${BASE}/auth/signup`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, mobile_number, pin }),
		}).then(handle),
	login: (mobile_number, pin) =>
		fetch(`${BASE}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ mobile_number, pin }),
		}).then(handle),

	// Expenses
	getExpenses: () => fetch(`${BASE}/expenses`, { headers: authHeaders() }).then(handle),
	createExpense: (payload) =>
		fetch(`${BASE}/expenses`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders() },
			body: JSON.stringify(payload),
		}).then(handle),
	updateExpense: (id, payload) =>
		fetch(`${BASE}/expenses/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json", ...authHeaders() },
			body: JSON.stringify(payload),
		}).then(handle),
	deleteExpense: (id) => fetch(`${BASE}/expenses/${id}`, { method: "DELETE", headers: authHeaders() }).then(handle),
	getExpenseCategories: () => fetch(`${BASE}/expenses/categories`, { headers: authHeaders() }).then(handle),
	addExpenseCategory: (name) =>
		fetch(`${BASE}/expenses/categories`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders() },
			body: JSON.stringify({ name }),
		}).then(handle),
	getMonthSummary: (month) =>
		fetch(`${BASE}/expenses/summary/month?month=${month}`, { headers: authHeaders() }).then(handle),
	getOverallSummary: () => fetch(`${BASE}/expenses/summary/overall`, { headers: authHeaders() }).then(handle),
	getYearSummary: (year) =>
		fetch(`${BASE}/expenses/summary/year?year=${year}`, { headers: authHeaders() }).then(handle),

	// Friends
	getFriends: () => fetch(`${BASE}/friends`, { headers: authHeaders() }).then(handle),
	createFriend: (name, mobile_number) =>
		fetch(`${BASE}/friends`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders() },
			body: JSON.stringify({ name, mobile_number }),
		}).then(handle),
	deleteFriend: (id) => fetch(`${BASE}/friends/${id}`, { method: "DELETE", headers: authHeaders() }).then(handle),

	// Activities
	getActivities: () => fetch(`${BASE}/activities`, { headers: authHeaders() }).then(handle),
	createActivity: (name, friend_ids) =>
		fetch(`${BASE}/activities`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders() },
			body: JSON.stringify({ name, friend_ids }),
		}).then(handle),
	addActivityMember: (activityId, friend_id) =>
		fetch(`${BASE}/activities/${activityId}/members`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders() },
			body: JSON.stringify({ friend_id }),
		}).then(handle),
	removeActivityMember: (activityId, friendId) =>
		fetch(`${BASE}/activities/${activityId}/members/${friendId}`, {
			method: "DELETE",
			headers: authHeaders(),
		}).then(handle),
	addActivityPayment: (activityId, payload) =>
		fetch(`${BASE}/activities/${activityId}/payments`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders() },
			body: JSON.stringify(payload),
		}).then(handle),
	deleteActivityPayment: (activityId, paymentId) =>
		fetch(`${BASE}/activities/${activityId}/payments/${paymentId}`, {
			method: "DELETE",
			headers: authHeaders(),
		}).then(handle),
	settleActivityDebt: (activityId, payload) =>
		fetch(`${BASE}/activities/${activityId}/settle`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...authHeaders() },
			body: JSON.stringify(payload),
		}).then(handle),
	toggleActivityComplete: (activityId) =>
		fetch(`${BASE}/activities/${activityId}/toggle-complete`, {
			method: "PATCH",
			headers: authHeaders(),
		}).then(handle),
	deleteActivity: (id) => fetch(`${BASE}/activities/${id}`, { method: "DELETE", headers: authHeaders() }).then(handle),
};
