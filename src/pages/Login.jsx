import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [form, setForm] = useState({ company: "", username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/dashboard-login", form);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Dashboard Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            name="company"
            placeholder="Company Name"
            onChange={handleChange}
            required
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="username"
            placeholder="Name or Email"
            onChange={handleChange}
            required
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Login
          </button>
        </form>
        <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-gray-600">
          <p className="font-semibold mb-1">Test credentials:</p>
          <p>Company: Visal Company 1 or Visal Company 2</p>
          <p>Username: Visal</p>
          <p>Password: Visal012</p>
        </div>
      </div>
    </div>
  );
}
