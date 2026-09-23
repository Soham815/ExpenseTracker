import express from "express";
import { supabase } from "../supabaseClient.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { computeBalances } from "../utils/splitCalculations.js";
import { round2 } from "../utils/calculations.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", async (req, res) => {
	const { data: friends, error } = await supabase
		.from("friends")
		.select("*")
		.eq("user_id", req.userId)
		.order("name");
	if (error) return res.status(500).json({ error: error.message });

	// overall balance — sum each friend's net balance across every activity
	// they're part of (activities are already scoped to this user)
	const { data: activities } = await supabase.from("activities").select("id").eq("user_id", req.userId);
	const activityIds = (activities || []).map((a) => a.id);

	const { data: memberships } = activityIds.length
		? await supabase.from("activity_members").select("*").in("activity_id", activityIds)
		: { data: [] };
	const { data: allPayments } = activityIds.length
		? await supabase.from("activity_payments").select("*").in("activity_id", activityIds)
		: { data: [] };

	const withBalances = (friends || []).map((friend) => {
		let overallBalance = 0;
		const friendActivityIds = (memberships || [])
			.filter((m) => m.friend_id === friend.id)
			.map((m) => m.activity_id);

		for (const activityId of friendActivityIds) {
			const members = (memberships || []).filter((m) => m.activity_id === activityId);
			const payments = (allPayments || []).filter((p) => p.activity_id === activityId);
			const balances = computeBalances(members, payments);
			overallBalance += balances[friend.id] || 0;
		}

		return { ...friend, overallBalance: round2(overallBalance) };
	});

	res.json(withBalances);
});

router.post("/", async (req, res) => {
	const { name, mobile_number } = req.body;
	if (!name || !name.trim()) return res.status(400).json({ error: "name is required" });

	const { data, error } = await supabase
		.from("friends")
		.insert([{ user_id: req.userId, name: name.trim(), mobile_number: mobile_number?.trim() || null }])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });
	res.json(data);
});

router.delete("/:id", async (req, res) => {
	const { id } = req.params;
	const { error } = await supabase.from("friends").delete().eq("id", id).eq("user_id", req.userId);
	if (error) return res.status(500).json({ error: error.message });
	res.json({ success: true });
});

export default router;
