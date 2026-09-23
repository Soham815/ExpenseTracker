import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import "../styles/Auth.css";

export default function Login() {
	const navigate = useNavigate();
	const [mobileNumber, setMobileNumber] = useState("");
	const [pin, setPin] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	async function handleSubmit(e) {
		e.preventDefault();
		setError("");
		setBusy(true);
		try {
			const { token, user } = await api.login(mobileNumber, pin);
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
				<h1>Sign in</h1>
				<p>Track your expenses and split costs with friends.</p>

				<div className="field">
					<label>Mobile number</label>
					<input
						type="tel"
						value={mobileNumber}
						onChange={(e) => setMobileNumber(e.target.value)}
						autoFocus
						required
					/>
				</div>
				<div className="field">
					<label>PIN</label>
					<input type="password" value={pin} onChange={(e) => setPin(e.target.value)} required />
				</div>

				{error && <p className="auth-error">{error}</p>}

				<button className="btn" disabled={busy} style={{ width: "100%" }}>
					{busy ? "Signing in…" : "Sign in"}
				</button>

				<p className="auth-switch">
					Don't have an account? <Link to="/signup">Create one</Link>
				</p>
			</form>
		</div>
	);
}
