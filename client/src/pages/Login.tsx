import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/login", { username, password });
      //const res = await axios.post("http://localhost:5000/api/authen/login", { username, password });
      const { token, id, username: uname } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userId", id);
      localStorage.setItem("username", uname);
      navigate("/");
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="border p-2 w-full" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="border p-2 w-full" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="bg-blue-500 text-white w-full p-2 rounded">Login</button>
      </form>
      <p className="mt-3 text-sm">
        No account? <span onClick={() => navigate("/signup")} className="text-blue-500 cursor-pointer">Signup</span>
      </p>
    </div>
  );
}
