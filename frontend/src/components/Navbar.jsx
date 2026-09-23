import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
	const user = JSON.parse(localStorage.getItem("expense_tracker_user") || "null");

	function logout() {
		localStorage.removeItem("expense_tracker_token");
		localStorage.removeItem("expense_tracker_user");
		window.location.href = "/login";
	}

	return (
		<header className="navbar">
			<span className="navbar-brand">Expense Tracker</span>
			<nav className="navbar-links">
				<NavLink to="/" end className={navClass}>
					Expenses
				</NavLink>
				<NavLink to="/group" className={navClass}>
					Group Expenses
				</NavLink>
			</nav>
			<div className="navbar-right">
				{user?.name && <span className="navbar-user">{user.name}</span>}
				<button className="btn btn-secondary" onClick={logout}>
					Sign out
				</button>
			</div>
		</header>
	);
}

function navClass({ isActive }) {
	return isActive ? "navbar-link active" : "navbar-link";
}
