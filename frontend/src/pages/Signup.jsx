import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import "../styles/Auth.css";

export default function Signup() {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [mobileNumber, setMobileNumber] = useState("");
	const [pin, setPin] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();
		setError("");
		setBusy(true);
		try {
			const { token, user } = await api.signup(name, mobileNumber, pin);
			localStorage.setItem("expense_tracker_token", token);
			localStorage.setItem("expense_tracker_user", JSON.stringify(user));
			navigate("/", { replace: true });
			window.location.reload();
		} catch (err) {
			setError(err.message);
		}
		setBusy(false);
	}

	return (
		<div className="auth-page">
			<form className="card auth-card" onSubmit={handleSubmit}>
				<h1>Create an account</h1>
				<p>Set up your personal and group expense tracker.</p>

				<div className="field">
					<label>Name</label>
					<input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
				</div>
				<div className="field">
					<label>Mobile number</label>
					<input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
				</div>
				<div className="field">
					<label>PIN (at least 4 characters)</label>
					<input type="password" minLength={4} value={pin} onChange={(e) => setPin(e.target.value)} required />
				</div>

				{error && <p className="auth-error">{error}</p>}

				<button className="btn" disabled={busy} style={{ width: "100%" }}>
					{busy ? "Creating account…" : "Create account"}
				</button>

				<p className="auth-switch">
					Already have an account? <Link to="/login">Sign in</Link>
				</p>
			</form>
		</div>
	);
}
