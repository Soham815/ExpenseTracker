import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { CategoryPieChart, YearBarChart } from "../components/ExpenseCharts.jsx";
import ExpenseForm from "../components/ExpenseForm.jsx";
import { MONTH_NAMES, highestMonthInsight, categoryColor } from "../utils/expenseCategories.js";
import "../styles/Expenses.css";

function currentMonthStr() {
	return new Date().toISOString().slice(0, 7);
}

function monthGroupLabel(dateStr) {
	return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function Expenses() {
	const [categories, setCategories] = useState([]);
	const [expenses, setExpenses] = useState([]);
	const [monthSummary, setMonthSummary] = useState(null);
	const [overallSummary, setOverallSummary] = useState(null);
	const [yearSummary, setYearSummary] = useState(null);
	const [year, setYear] = useState(new Date().getFullYear());
	const [pieView, setPieView] = useState("month");
	const [pieMonth, setPieMonth] = useState(currentMonthStr());
	const [pieMonthSummary, setPieMonthSummary] = useState(null);

	const [editingId, setEditingId] = useState(null);

	useEffect(() => {
		loadAll();
	}, []);

	useEffect(() => {
		api.getYearSummary(year).then(setYearSummary);
	}, [year]);

	useEffect(() => {
		api.getMonthSummary(pieMonth).then(setPieMonthSummary);
	}, [pieMonth]);

	function loadAll() {
		api.getExpenseCategories().then(setCategories);
		api.getExpenses().then(setExpenses);
		api.getMonthSummary(currentMonthStr()).then(setMonthSummary);
		api.getOverallSummary().then(setOverallSummary);
		api.getYearSummary(year).then(setYearSummary);
		api.getMonthSummary(pieMonth).then(setPieMonthSummary);
	}

	function handleCategoryAdded(created) {
		setCategories((c) => [...c, created].sort((a, b) => a.name.localeCompare(b.name)));
	}

	async function handleAdd(values) {
		await api.createExpense(values);
		loadAll();
	}

	async function handleSaveEdit(id, values) {
		await api.updateExpense(id, values);
		setEditingId(null);
		loadAll();
	}

	async function removeExpense(id) {
		if (!confirm("Delete this expense?")) return;
		await api.deleteExpense(id);
		loadAll();
	}

	const yearBarData = useMemo(() => {
		if (!yearSummary) return [];
		return yearSummary.monthlyTotals.map((m) => ({ label: MONTH_NAMES[m.month - 1], total: m.total }));
	}, [yearSummary]);

	const highestMsg = useMemo(() => {
		if (!yearSummary?.highestMonth) return "";
		return highestMonthInsight(MONTH_NAMES[yearSummary.highestMonth.month - 1], yearSummary.highestMonth.total);
	}, [yearSummary]);

	const pieData = pieView === "month" ? pieMonthSummary?.byCategory : overallSummary?.byCategory;
	const pieMonthLabel = new Date(`${pieMonth}-01`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

	const groupedExpenses = useMemo(() => {
		const groups = [];
		let currentKey = null;
		for (const e of expenses) {
			const d = new Date(e.expense_date);
			const key = `${d.getFullYear()}-${d.getMonth()}`;
			if (key !== currentKey) {
				groups.push({ key, label: monthGroupLabel(e.expense_date), items: [] });
				currentKey = key;
			}
			groups[groups.length - 1].items.push(e);
		}
		return groups;
	}, [expenses]);

	return (
		<div className="expenses-page">
			<div>
				<h1>Expenses</h1>
				<p>Track spending, review trends, and stay on top of your budget.</p>
			</div>

			<div className="expense-stats-row">
				<div className="card expense-stat-card">
					<span className="expense-stat-label">This month</span>
					<span className="expense-stat-value">₹{(monthSummary?.total ?? 0).toLocaleString()}</span>
				</div>
				<div className="card expense-stat-card expense-stat-alt">
					<span className="expense-stat-label">All time</span>
					<span className="expense-stat-value">₹{(overallSummary?.total ?? 0).toLocaleString()}</span>
				</div>
			</div>

			<div className="card expense-form-card">
				<h2>Log an expense</h2>
				<ExpenseForm
					categories={categories}
					submitLabel="Add expense"
					onSubmit={handleAdd}
					onCategoryAdded={handleCategoryAdded}
				/>
			</div>

			<div className="grid cols-2">
				<div>
					<div className="expense-pie-toggle">
						<button className={pieView === "month" ? "active" : ""} onClick={() => setPieView("month")}>
							By month
						</button>
						<button className={pieView === "overall" ? "active" : ""} onClick={() => setPieView("overall")}>
							All time
						</button>
					</div>
					{pieView === "month" && (
						<div className="expense-month-picker">
							<input
								type="month"
								value={pieMonth}
								max={currentMonthStr()}
								onChange={(e) => setPieMonth(e.target.value)}
							/>
						</div>
					)}
					<CategoryPieChart
						data={pieData}
						title={pieView === "month" ? `Spending by category — ${pieMonthLabel}` : "Spending by category — all time"}
					/>
				</div>

				<div>
					<div className="expense-year-toggle">
						<button onClick={() => setYear((y) => y - 1)}>◀</button>
						<span>{year}</span>
						<button onClick={() => setYear((y) => y + 1)}>▶</button>
					</div>
					<YearBarChart data={yearBarData} year={year} />
				</div>
			</div>

			{highestMsg && (
				<div className="card expense-insight-card">
					<p>{highestMsg}</p>
				</div>
			)}

			<div className="card expense-recent-card">
				<h2>All expenses</h2>
				{expenses.length === 0 && <p className="empty-state">No expenses logged yet.</p>}
				{groupedExpenses.map((group) => (
					<div key={group.key} className="expense-month-group">
						<h3 className="expense-month-heading">{group.label}</h3>
						<div className="expense-recent-list">
							{group.items.map((e) =>
								editingId === e.id ? (
									// the same card + form used to add an expense, just prefilled
									<div key={e.id} className="card expense-form-card">
										<h3>Edit expense</h3>
										<ExpenseForm
											categories={categories}
											initialValues={e}
											submitLabel="Save changes"
											onSubmit={(values) => handleSaveEdit(e.id, values)}
											onCancel={() => setEditingId(null)}
											onCategoryAdded={handleCategoryAdded}
										/>
									</div>
								) : (
									<div key={e.id} className="expense-recent-row">
										<span className="expense-cat-dot" style={{ background: categoryColor(e.category) }} />
										<div className="expense-recent-info">
											<strong>₹{e.amount}</strong> — {e.category}
											{e.note && <span className="expense-note"> · {e.note}</span>}
											<div className="expense-recent-date">{new Date(e.expense_date).toLocaleDateString()}</div>
										</div>
										{e.source === "manual" && (
											<div className="expense-row-actions">
												<button className="icon-btn expense-edit-btn" onClick={() => setEditingId(e.id)} title="Edit">
													✎
												</button>
												<button className="icon-btn" onClick={() => removeExpense(e.id)} title="Delete">
													✕
												</button>
											</div>
										)}
									</div>
								)
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
