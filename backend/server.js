import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import authRouter from "./routes/auth.js";
import expensesRouter from "./routes/expenses.js";
import friendsRouter from "./routes/friends.js";
import activitiesRouter from "./routes/activities.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, project: "Expense Tracker" }));

app.use("/api/auth", authRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/activities", activitiesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
	console.log(`Expense Tracker backend running on http://localhost:${PORT}`);
});
