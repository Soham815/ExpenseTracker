import express from "express";
import { supabase } from "../supabaseClient.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { computeBalances, simplifyDebts, SELF_KEY } from "../utils/splitCalculations.js";

const router = express.Router();
router.use(authMiddleware);

async function buildActivityView(activity) {
	const { data: members } = await supabase
		.from("activity_members")
		.select("*, friends(id, name, mobile_number)")
		.eq("activity_id", activity.id);
	const { data: payments } = await supabase
		.from("activity_payments")
		.select("*")
		.eq("activity_id", activity.id)
		.order("paid_at", { ascending: true });

	const balances = computeBalances(members || [], payments || []);

	const memberInfo = [
		{ key: SELF_KEY, name: "You", type: "user" },
		...(members || []).map((m) => ({
			key: m.friend_id,
			name: m.friends?.name || "Friend",
			type: "friend",
			mobile_number: m.friends?.mobile_number || null,
		})),
	];

	const settlements = simplifyDebts(balances, memberInfo);

	return { ...activity, members: memberInfo, balances, payments: payments || [], settlements };
}

// Confirms an activity belongs to the signed-in user before any mutation
async function getOwnedActivity(id, userId) {
	const { data } = await supabase.from("activities").select("*").eq("id", id).eq("user_id", userId).single();
	return data;
}

router.get("/", async (req, res) => {
	const { data: active, error: e1 } = await supabase
		.from("activities")
		.select("*")
		.eq("user_id", req.userId)
		.eq("is_completed", false)
		.order("created_at", { ascending: true });
	const { data: completed, error: e2 } = await supabase
		.from("activities")
		.select("*")
		.eq("user_id", req.userId)
		.eq("is_completed", true)
		.order("completed_at", { ascending: true });
	if (e1 || e2) return res.status(500).json({ error: (e1 || e2).message });

	const all = [...(active || []), ...(completed || [])];
	const withDetails = await Promise.all(all.map(buildActivityView));
	res.json(withDetails);
});

router.post("/", async (req, res) => {
	const { name, friend_ids } = req.body;
	if (!name || !name.trim()) return res.status(400).json({ error: "name is required" });

	const { data: activity, error } = await supabase
		.from("activities")
		.insert([{ user_id: req.userId, name: name.trim() }])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });

	const ids = Array.isArray(friend_ids) ? friend_ids : [];
	if (ids.length) {
		// only attach friends that actually belong to this user
		const { data: ownedFriends } = await supabase.from("friends").select("id").eq("user_id", req.userId).in("id", ids);
		const ownedIds = (ownedFriends || []).map((f) => f.id);
		if (ownedIds.length) {
			await supabase
				.from("activity_members")
				.insert(ownedIds.map((friend_id) => ({ activity_id: activity.id, friend_id })));
		}
	}

	res.json(await buildActivityView(activity));
});

router.post("/:id/members", async (req, res) => {
	const { id } = req.params;
	const { friend_id } = req.body;
	if (!friend_id) return res.status(400).json({ error: "friend_id is required" });

	const activity = await getOwnedActivity(id, req.userId);
	if (!activity) return res.status(404).json({ error: "Activity not found" });

	const { data: friend } = await supabase.from("friends").select("id").eq("id", friend_id).eq("user_id", req.userId).single();
	if (!friend) return res.status(404).json({ error: "Friend not found" });

	const { error } = await supabase.from("activity_members").insert([{ activity_id: id, friend_id }]);
	if (error && error.code !== "23505") return res.status(500).json({ error: error.message });

	res.json(await buildActivityView(activity));
});

router.delete("/:id/members/:friendId", async (req, res) => {
	const { id, friendId } = req.params;
	const activity = await getOwnedActivity(id, req.userId);
	if (!activity) return res.status(404).json({ error: "Activity not found" });

	const { error } = await supabase.from("activity_members").delete().eq("activity_id", id).eq("friend_id", friendId);
	if (error) return res.status(500).json({ error: error.message });
	res.json(await buildActivityView(activity));
});

// Add a real group cost, split equally among every member + the account owner
router.post("/:id/payments", async (req, res) => {
	const { id } = req.params;
	const { amount, reason, payer_type, payer_friend_id, paid_at } = req.body;
	if (!amount || !payer_type) return res.status(400).json({ error: "amount and payer_type are required" });

	const activity = await getOwnedActivity(id, req.userId);
	if (!activity) return res.status(404).json({ error: "Activity not found" });

	const { error } = await supabase.from("activity_payments").insert([
		{
			activity_id: id,
			type: "expense",
			amount: Number(amount),
			reason: reason?.trim() || null,
			payer_type,
			payer_friend_id: payer_type === "friend" ? payer_friend_id : null,
			paid_at: paid_at || new Date().toISOString().slice(0, 10),
		},
	]);
	if (error) return res.status(500).json({ error: error.message });
	res.json(await buildActivityView(activity));
});

// Record a direct settlement between two members — clears part/all of a debt.
// If the account owner is the payer, this also logs a personal expense.
router.post("/:id/settle", async (req, res) => {
	const { id } = req.params;
	const { amount, payer_type, payer_friend_id, receiver_type, receiver_friend_id } = req.body;
	if (!amount || !payer_type || !receiver_type) {
		return res.status(400).json({ error: "amount, payer_type, and receiver_type are required" });
	}

	const activity = await getOwnedActivity(id, req.userId);
	if (!activity) return res.status(404).json({ error: "Activity not found" });

	const { error } = await supabase.from("activity_payments").insert([
		{
			activity_id: id,
			type: "settlement",
			amount: Number(amount),
			reason: req.body.reason?.trim() || null,
			payer_type,
			payer_friend_id: payer_type === "friend" ? payer_friend_id : null,
			receiver_type,
			receiver_friend_id: receiver_type === "friend" ? receiver_friend_id : null,
			paid_at: new Date().toISOString().slice(0, 10),
		},
	]);
	if (error) return res.status(500).json({ error: error.message });

	if (payer_type === "user") {
		let receiverName = "a friend";
		if (receiver_type === "friend" && receiver_friend_id) {
			const { data: f } = await supabase.from("friends").select("name").eq("id", receiver_friend_id).single();
			if (f) receiverName = f.name;
		}
		await supabase.from("expenses").insert([
			{
				user_id: req.userId,
				amount: Number(amount),
				category: "Group Expenses",
				note: `Paid ${receiverName} for "${activity.name}"`,
				expense_date: new Date().toISOString().slice(0, 10),
				source: "group_settlement",
			},
		]);
	}

	res.json(await buildActivityView(activity));
});

router.patch("/:id/toggle-complete", async (req, res) => {
	const { id } = req.params;
	const activity = await getOwnedActivity(id, req.userId);
	if (!activity) return res.status(404).json({ error: "Activity not found" });

	const nowCompleted = !activity.is_completed;
	const { data, error } = await supabase
		.from("activities")
		.update({ is_completed: nowCompleted, completed_at: nowCompleted ? new Date().toISOString() : null })
		.eq("id", id)
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(await buildActivityView(data));
});

router.delete("/:id/payments/:paymentId", async (req, res) => {
	const { id, paymentId } = req.params;
	const activity = await getOwnedActivity(id, req.userId);
	if (!activity) return res.status(404).json({ error: "Activity not found" });

	const { error } = await supabase.from("activity_payments").delete().eq("id", paymentId).eq("activity_id", id);
	if (error) return res.status(500).json({ error: error.message });
	res.json(await buildActivityView(activity));
});

router.delete("/:id", async (req, res) => {
	const { id } = req.params;
	const { error } = await supabase.from("activities").delete().eq("id", id).eq("user_id", req.userId);
	if (error) return res.status(500).json({ error: error.message });
	res.json({ success: true });
});

export default router;
