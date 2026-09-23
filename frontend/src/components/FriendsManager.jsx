import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import "../styles/FriendsManager.css";

export default function FriendsManager({ onChange }) {
	const [friends, setFriends] = useState([]);
	const [name, setName] = useState("");
	const [mobile, setMobile] = useState("");
	const [busy, setBusy] = useState(false);
	const [expanded, setExpanded] = useState(false);

	useEffect(() => {
		load();
	}, []);

	function load() {
		api.getFriends().then(setFriends);
	}

	async function handleAdd(e) {
		e.preventDefault();
		if (!name.trim()) return;
		setBusy(true);
		try {
			await api.createFriend(name.trim(), mobile.trim());
			setName("");
			setMobile("");
			load();
			onChange?.();
		} catch (err) {
			alert(err.message);
		}
		setBusy(false);
	}

	async function removeFriend(id) {
		if (!confirm("Remove this friend? Only possible if they're not part of any activity.")) return;
		try {
			await api.deleteFriend(id);
			load();
			onChange?.();
		} catch (err) {
			alert("Couldn't remove — they might still be part of an activity.");
		}
	}

	return (
		<div className="card friends-manager">
			<button className="friends-manager-toggle" onClick={() => setExpanded((v) => !v)}>
				<h2>
					Friends <span className="friends-manager-arrow">{expanded ? "▲" : "▼"}</span>
				</h2>
			</button>

			{expanded && (
				<>
					<form onSubmit={handleAdd} className="friends-add-form">
						<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
						<input
							value={mobile}
							onChange={(e) => setMobile(e.target.value)}
							placeholder="Mobile number (for reminders)"
						/>
						<button className="btn btn-secondary" disabled={busy}>
							Add
						</button>
					</form>

					<div className="friends-list">
						{friends.map((f) => (
							<div key={f.id} className="friends-row">
								<div>
									<strong>{f.name}</strong>
									{f.mobile_number && <span className="friends-mobile"> · {f.mobile_number}</span>}
								</div>
								<div className="friends-row-right">
									<span className={`friends-balance ${f.overallBalance >= 0 ? "positive" : "negative"}`}>
										{f.overallBalance === 0
											? "Settled"
											: f.overallBalance > 0
											? `Owed ₹${f.overallBalance}`
											: `Owes ₹${Math.abs(f.overallBalance)}`}
									</span>
									<button className="icon-btn" onClick={() => removeFriend(f.id)}>
										✕
									</button>
								</div>
							</div>
						))}
						{friends.length === 0 && <p className="empty-state">No friends added yet.</p>}
					</div>
				</>
			)}
		</div>
	);
}
