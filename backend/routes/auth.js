import express from "express";
import bcrypt from "bcryptjs";
import { supabase } from "../supabaseClient.js";
import { signToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const DEFAULT_CATEGORIES = [
	"Food & Dining",
	"Groceries",
	"Transport",
	"Housing",
	"Bills & Utilities",
	"Shopping",
	"Health & Fitness",
	"Entertainment",
	"Group Expenses",
];

function publicUser(user) {
	return { id: user.id, name: user.name, mobile_number: user.mobile_number };
}

router.post("/signup", async (req, res) => {
	const { name, mobile_number, pin } = req.body;
	if (!name?.trim() || !mobile_number?.trim() || !pin) {
		return res.status(400).json({ error: "Name, mobile number, and PIN are all required." });
	}
	if (pin.length < 4) {
		return res.status(400).json({ error: "PIN must be at least 4 characters." });
	}

	const { data: existing } = await supabase
		.from("users")
		.select("id")
		.eq("mobile_number", mobile_number.trim())
		.maybeSingle();
	if (existing) {
		return res.status(409).json({ error: "An account with this mobile number already exists." });
	}

	const pinHash = await bcrypt.hash(pin, 10);
	const { data: user, error } = await supabase
		.from("users")
		.insert([{ name: name.trim(), mobile_number: mobile_number.trim(), pin_hash: pinHash }])
		.select()
		.single();
	if (error) return res.status(500).json({ error: error.message });

	await supabase
		.from("expense_categories")
		.insert(DEFAULT_CATEGORIES.map((name) => ({ user_id: user.id, name })));

	const token = signToken(user.id);
	res.json({ token, user: publicUser(user) });
});

router.post("/login", async (req, res) => {
	const { mobile_number, pin } = req.body;
	if (!mobile_number?.trim() || !pin) {
		return res.status(400).json({ error: "Mobile number and PIN are required." });
	}

	const { data: user, error } = await supabase
		.from("users")
		.select("*")
		.eq("mobile_number", mobile_number.trim())
		.maybeSingle();
	if (error || !user) {
		return res.status(401).json({ error: "Invalid mobile number or PIN." });
	}

	const matches = await bcrypt.compare(pin, user.pin_hash);
	if (!matches) {
		return res.status(401).json({ error: "Invalid mobile number or PIN." });
	}

	const token = signToken(user.id);
	res.json({ token, user: publicUser(user) });
});

export default router;
