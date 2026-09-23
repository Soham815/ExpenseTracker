import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import FriendsManager from "../components/FriendsManager.jsx";
import ActivityCard from "../components/ActivityCard.jsx";
import "../styles/GroupExpenses.css";

export default function GroupExpenses() {
	const [activities, setActivities] = useState([]);
	const [friends, setFriends] = useState([]);
	const [name, setName] = useState("");
	const [selectedFriendIds, setSelectedFriendIds] = useState([]);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		load();
	}, []);

	function load() {
		api.getActivities().then(setActivities);
		api.getFriends().then(setFriends);
	}

	function toggleFriendSelection(id) {
		setSelectedFriendIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
	}

	async function handleCreate(e) {
		e.preventDefault();
		if (!name.trim()) return;
		setBusy(true);
		try {
			await api.createActivity(name.trim(), selectedFriendIds);
			setName("");
			setSelectedFriendIds([]);
			load();
		} catch (err) {
			alert(err.message);
		}
		setBusy(false);
	}

	const active = activities.filter((a) => !a.is_completed);
	const completed = activities.filter((a) => a.is_completed);

	return (
		<div className="group-expenses">
			<div>
				<h1>Group Expenses</h1>
				<p>Split costs with friends and keep track of who owes what.</p>
			</div>

			<FriendsManager onChange={load} />

			<div className="card">
				<h2>New activity</h2>
				<form onSubmit={handleCreate}>
					<div className="field">
						<label>Activity name</label>
						<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekend trip" required />
					</div>
					{friends.length > 0 && (
						<div className="field">
							<label>Members (besides you)</label>
							<div className="group-friend-picker">
								{friends.map((f) => (
									<button
										type="button"
										key={f.id}
										className={`group-friend-chip ${selectedFriendIds.includes(f.id) ? "selected" : ""}`}
										onClick={() => toggleFriendSelection(f.id)}
									>
										{f.name}
									</button>
								))}
							</div>
						</div>
					)}
					<button className="btn" disabled={busy}>
						{busy ? "Creating…" : "Create activity"}
					</button>
				</form>
			</div>

			<div className="group-activities-list">
				{active.length === 0 && completed.length === 0 && (
					<div className="empty-state card">
						<h3>No activities yet</h3>
						<p>Create one above to start splitting costs with friends.</p>
					</div>
				)}
				{active.map((a) => (
					<ActivityCard key={a.id} activity={a} allFriends={friends} onChange={load} />
				))}
			</div>

			{completed.length > 0 && (
				<div className="group-activities-list">
					<h2>Completed activities</h2>
					{completed.map((a) => (
						<ActivityCard key={a.id} activity={a} allFriends={friends} onChange={load} />
					))}
				</div>
			)}
		</div>
	);
}
