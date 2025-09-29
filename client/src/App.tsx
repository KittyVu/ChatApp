import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface UserType {
  id: number;
  username: string;
}

interface MessageType {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  senderUsername: string;
  createdAt: string;
}

let socket: Socket;

export default function App() {
  const [auth, setAuth] = useState<{ id: number; username: string } | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [notifications, setNotifications] = useState<Record<number, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const id = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    if (!id || !username) {
      navigate("/login");
    } else {
      setAuth({ id: Number(id), username });
    }
  }, [navigate]);

  useEffect(() => {
    if (!auth) return;

    // Fetch all users (exclude self)
    axios.get("http://localhost:5000/api/users").then((res) => {
      setUsers(res.data.filter((u: UserType) => u.id !== auth.id));
    });

    // Setup socket only once
    if (!socket) socket = io("http://localhost:5000");

    // Register current userId to server for notifications
    socket.emit("register", auth.id);

    // Listen to newMessage events
    socket.on("newMessage", (msg: MessageType) => {
      if (msg.receiverId === auth.id && msg.senderId !== auth.id) {
        toast.info(`💬 New message from ${msg.senderUsername}`);

        // Increment notification count for that sender
        setNotifications((prev) => ({
          ...prev,
          // array like 3:1, 5:2 (userId:count), the first is msg.senderId
          [msg.senderId]: prev[msg.senderId] ? prev[msg.senderId] + 1 : 1,
          // pre[msg.senderId] means finding the userId in the previous state
        }));
      }
    });

    return () => {
      socket.off("newMessage");
    };
  }, [auth]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openChat = (userId: number) => {
    // Clear notifications for this user when opening chat
    setNotifications((prev) => ({ ...prev, [userId]: 0 }));
    navigate(`/chat/${userId}`);
  };

  if (!auth) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {auth.username}</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-4">Users</h2>
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="flex justify-between items-center">
            <span className="flex items-center space-x-2">
              <span>{u.username}</span>
              {notifications[u.id] > 0 && (
                <span className="bg-red-500 text-white rounded-full px-2 text-xs">
                  {notifications[u.id]}
                </span>
              )}
            </span>
            <button
              className="bg-blue-500 text-white px-3 py-1 rounded"
              onClick={() => openChat(u.id)}
            >
              Chat
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
