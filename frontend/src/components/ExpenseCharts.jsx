import React from "react";
import {
	PieChart,
	Pie,
	Cell,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
} from "recharts";
import { categoryColor } from "../utils/expenseCategories.js";
import "../styles/ExpenseCharts.css";

export function CategoryPieChart({ data, title }) {
	if (!data || data.length === 0) {
		return (
			<div className="expense-chart-card">
				<h3>{title}</h3>
				<div className="expense-chart-empty">
					<p>No expenses in this range yet.</p>
				</div>
			</div>
		);
	}

	const sorted = [...data].sort((a, b) => b.amount - a.amount);
	const total = sorted.reduce((sum, d) => sum + d.amount, 0);

	return (
		<div className="expense-chart-card">
			<h3>{title}</h3>

			{/* No labels drawn on the slices themselves — long names get clipped and
			    crowd each other there. The donut shows the shape of the spending, and
			    the list below carries the full, readable detail. */}
			<div className="expense-pie-wrap">
				<ResponsiveContainer width="100%" height={230}>
					<PieChart>
						<Pie
							data={sorted}
							dataKey="amount"
							nameKey="category"
							cx="50%"
							cy="50%"
							innerRadius={62}
							outerRadius={100}
							paddingAngle={sorted.length > 1 ? 2 : 0}
							stroke="none"
						>
							{sorted.map((entry) => (
								<Cell key={entry.category} fill={categoryColor(entry.category)} />
							))}
						</Pie>
						<Tooltip formatter={(value, name) => [`₹${value.toLocaleString()}`, name]} />
					</PieChart>
				</ResponsiveContainer>
				<div className="expense-pie-center">
					<span className="expense-pie-center-label">Total</span>
					<span className="expense-pie-center-value">₹{total.toLocaleString()}</span>
				</div>
			</div>

			<ul className="expense-pie-legend">
				{sorted.map((entry) => {
					const pct = (entry.amount / total) * 100;
					return (
						<li key={entry.category} className="expense-pie-legend-row">
							<span className="expense-pie-dot" style={{ background: categoryColor(entry.category) }} />
							<span className="expense-pie-name">{entry.category}</span>
							<span className="expense-pie-amount">₹{entry.amount.toLocaleString()}</span>
							<span className="expense-pie-percent">{pct < 1 ? "<1" : Math.round(pct)}%</span>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

export function YearBarChart({ data, year }) {
	return (
		<div className="expense-chart-card">
			<h3>Spending by month — {year}</h3>
			<ResponsiveContainer width="100%" height={280}>
				<BarChart data={data}>
					<CartesianGrid strokeDasharray="3 3" stroke="#ece4d9" />
					<XAxis dataKey="label" tick={{ fontSize: 12 }} />
					<YAxis tick={{ fontSize: 12 }} />
					<Tooltip formatter={(value) => `₹${value}`} />
					<Bar dataKey="total" fill="#f2734f" radius={[8, 8, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
