import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Register() {
	const navigate = useNavigate();

	const [showPassword, setShowPassword] = useState(false);

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleRegister = async () => {
		try {
			await axios.post(
				"http://localhost:5000/api/auth/register",
				{
					name,
					email,
					password,
				}
			);

			alert("Registered Successfully ✅");
			navigate("/");
		} catch (error) {
			alert(error.response?.data?.message || "Register failed ❌");
		}
	};

	return (
		<div className="flex items-center justify-center h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-600">

			<div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-96 border border-white/20">

				<h2 className="text-3xl font-bold text-center mb-6 text-white">
					Create Account 🚀
				</h2>

				<input
					type="text"
					placeholder="Full Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					className="w-full p-3 mb-4 rounded-lg bg-black/20 text-white"
				/>

				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full p-3 mb-4 rounded-lg bg-black/20 text-white"
				/>

				<div className="relative mb-4">
					<input
						type={showPassword ? "text" : "password"}
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full p-3 rounded-lg bg-black/20 text-white pr-10"
					/>

					<span
						onClick={() => setShowPassword(!showPassword)}
						className="absolute right-3 top-3 cursor-pointer text-white"
					>
						{/* {showPassword ? "🙈" : "👁️"} */}
					</span>
				</div>

				<button
					onClick={handleRegister}
					className="w-full bg-white text-blue-600 p-3 rounded-lg mb-3"
				>
					Register
				</button>

				<p className="text-center text-white mt-4">
					Already have an account?{" "}
					<span
						onClick={() => navigate("/")}
						className="underline cursor-pointer"
					>
						Login
					</span>
				</p>
			</div>
		</div>
	);
}

export default Register;