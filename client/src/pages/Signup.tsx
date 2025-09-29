import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/signup", { username, password });
      //await axios.post("http://localhost:5000/api/authen/signup", { username, password });
      alert("Account created. Please login.");
      navigate("/login");
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Signup</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="border p-2 w-full" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="border p-2 w-full" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="bg-green-500 text-white w-full p-2 rounded">Signup</button>
      </form>
      <p className="mt-3 text-sm">
        Already have an account? <span onClick={() => navigate("/login")} className="text-blue-500 cursor-pointer">Login</span>
      </p>
    </div>
  );
}
