import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
	const navigate = useNavigate();

	const [showPassword, setShowPassword] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleLogin = async () => {
		try {
			const res = await axios.post(
				"http://localhost:5000/api/auth/login",
				{
					email,
					password,
				}
			);

			alert("Login Successful ✅");

			localStorage.setItem("token", res.data.token);

			navigate("/chat"); // future chat page
		} catch (error) {
			alert(error.response?.data?.message || "Login failed ❌");
		}
	};

	return (
		<div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
			<div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-96 border border-white/20">

				<h2 className="text-3xl font-bold text-center mb-6 text-white">
					AI Assistant 🔥
				</h2>

				<input
					type="email"
					placeholder="Email"
					autoComplete="off"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full p-3 mb-4 rounded-lg bg-white/20 text-white placeholder-white"
				/>

				<div className="relative mb-4">
					<input
						type={showPassword ? "text" : "password"}
						placeholder="Password"
						autoComplete="off"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full p-3 rounded-lg bg-white/20 text-white pr-10 placeholder-white"
					/>
					<span
						onClick={() => setShowPassword(!showPassword)}
						className="absolute right-3 top-3 cursor-pointer text-white"
					>
						{/* {showPassword ? "🙈" : "👁️"} */}
					</span>
				</div>

				<button
					onClick={handleLogin}
					className="w-full bg-white text-purple-700 p-3 rounded-lg mb-3"
				>
					Login
				</button>

				<div className="text-center text-white mb-3">OR</div>

				<button
					onClick={() =>
					(window.location.href =
						"http://localhost:5000/api/auth/google")
					}
					className="w-full bg-red-500 text-white p-3 rounded-lg"
				>
					Login with Google
				</button>

				<p className="text-center text-white mt-4">
					Don't have an account?{" "}
					<span
						onClick={() => navigate("/register")}
						className="underline cursor-pointer"
					>
						Register
					</span>
				</p>
			</div>
		</div>
	);
}

export default Login;