import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Expenses from "./pages/Expenses.jsx";
import GroupExpenses from "./pages/GroupExpenses.jsx";

function isAuthed() {
	return !!localStorage.getItem("expense_tracker_token");
}

function ProtectedLayout({ children }) {
	if (!isAuthed()) return <Navigate to="/login" replace />;
	return (
		<div className="app-shell">
			<Navbar />
			<main className="page">{children}</main>
		</div>
	);
}

export default function App() {
	return (
		<Routes>
			<Route path="/login" element={isAuthed() ? <Navigate to="/" replace /> : <Login />} />
			<Route path="/signup" element={isAuthed() ? <Navigate to="/" replace /> : <Signup />} />
			<Route
				path="/"
				element={
					<ProtectedLayout>
						<Expenses />
					</ProtectedLayout>
				}
			/>
			<Route
				path="/group"
				element={
					<ProtectedLayout>
						<GroupExpenses />
					</ProtectedLayout>
				}
			/>
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}
