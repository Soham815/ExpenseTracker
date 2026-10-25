import React, { useState } from "react";
import { api } from "../api.js";
import "../styles/ExpenseForm.css";

/**
 * The full "expense" form. Pass initialValues + onCancel to edit an existing
 * expense; omit both to get a blank "add new" form that resets itself after
 * a successful submit. Used identically in both places, so editing never
 * looks like a cramped, different version of adding.
 */
export default function ExpenseForm({ categories, initialValues, onSubmit, onCancel, onCategoryAdded, submitLabel }) {
	const isEdit = !!onCancel;
	const [amount, setAmount] = useState(initialValues?.amount ?? "");
	const [category, setCategory] = useState(initialValues?.category || "");
	// categories may still be loading when the form first mounts, so fall back to
	// the first one at use-time instead of freezing an empty value in state
	const selectedCategory = category || categories[0]?.name || "";
	const [addingCategory, setAddingCategory] = useState(false);
	const [newCategory, setNewCategory] = useState("");
	const [note, setNote] = useState(initialValues?.note || "");
	const [date, setDate] = useState(initialValues?.expense_date || new Date().toISOString().slice(0, 10));
	const [submitting, setSubmitting] = useState(false);

	async function handleAddCategory() {
		if (!newCategory.trim()) return;
		const created = await api.addExpenseCategory(newCategory.trim());
		onCategoryAdded?.(created);
		setCategory(created.name);
		setNewCategory("");
		setAddingCategory(false);
	}

	function resetFields() {
		setAmount("");
		setNote("");
		setDate(new Date().toISOString().slice(0, 10));
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (!amount || !selectedCategory) return;
		setSubmitting(true);
		try {
			await onSubmit({ amount: Number(amount), category: selectedCategory, note, expense_date: date });
			if (!isEdit) resetFields();
		} catch (err) {
			alert(err.message);
		}
		setSubmitting(false);
	}

	return (
		<form onSubmit={handleSubmit}>
			<div className="grid cols-3">
				<div className="field">
					<label>Amount (₹)</label>
					<input
						type="number"
						min="0"
						step="0.01"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						required
					/>
				</div>
				<div className="field">
					<label>Category</label>
					{!addingCategory ? (
						<select value={selectedCategory} onChange={(e) => setCategory(e.target.value)}>
							{categories.map((c) => (
								<option key={c.id} value={c.name}>
									{c.name}
								</option>
							))}
						</select>
					) : (
						<div style={{ display: "flex", gap: 6 }}>
							<input
								value={newCategory}
								onChange={(e) => setNewCategory(e.target.value)}
								placeholder="New category name"
								autoFocus
							/>
							<button type="button" className="btn btn-secondary" onClick={handleAddCategory}>
								Add
							</button>
						</div>
					)}
					{!addingCategory && (
						<button
							type="button"
							className="btn btn-ghost"
							style={{ padding: "4px 8px", fontSize: 12 }}
							onClick={() => setAddingCategory(true)}
						>
							+ New category
						</button>
					)}
				</div>
				<div className="field">
					<label>Date</label>
					<input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
				</div>
			</div>
			<div className="field">
				<label>Note (optional)</label>
				<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was it for?" />
			</div>
			<div className="expense-form-actions">
				<button className="btn" disabled={submitting}>
					{submitting ? "Saving…" : submitLabel}
				</button>
				{onCancel && (
					<button type="button" className="btn btn-ghost" onClick={onCancel}>
						Cancel
					</button>
				)}
			</div>
		</form>
	);
}
