import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import axios from "axios";

interface MessageType {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  senderUsername: string;
  createdAt: string;
}

let socket: Socket;

export default function Chat() {
  // get id and show partner's name
  const { id } = useParams();
  const otherId = Number(id);
  const [otherName, setOtherName] = useState("");

  const navigate = useNavigate();

  const [auth, setAuth] = useState<{ id: number; username: string } | null>(null);
  
  const [messages, setMessages] = useState<MessageType[]>([]);

  // control message input
  const [input, setInput] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // check authentication
  useEffect(() => {
    const uid = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    if (!uid || !username) navigate("/login");
    else setAuth({ id: Number(uid), username });
  }, [navigate]);

  // fetch other user's name
  useEffect(() => {
    fetch("http://localhost:5000/api/users/" + otherId).then((res) => res.json()).then((data) => {
      if (!data.id) {
        alert("User not found");
        navigate("/");
      } else {
        setOtherName(data.username);
      }
    });
  }, [otherId, navigate]);

  // setup socket + listen for messages
  useEffect(() => {
    if (!auth) return;
    if (!socket) socket = io("http://localhost:5000");
    // make a unique room for 2 users and join it
    const room = `room_${Math.min(auth.id, otherId)}_${Math.max(auth.id, otherId)}`;
    socket.emit("joinRoom", room);
    // listen for newMessage from server
    socket.on("newMessage", (msg: MessageType) => {
      if (
        (msg.senderId === auth.id && msg.receiverId === otherId) ||
        (msg.senderId === otherId && msg.receiverId === auth.id)
      ) setMessages((prev) => [...prev, msg]);
    });

    return () => { socket.off("newMessage"); };
  }, [auth, otherId]);

  // fetch chat history  
  useEffect(() => {
    if (!auth) return;
    const fetchHistory = async () => {
      const res = await axios.get(`http://localhost:5000/api/messages/${auth.id}/${otherId}`);
      setMessages(res.data);
    };
    fetchHistory();
  }, [auth, otherId]);

  // auto scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // send message
  const sendMessage = () => {
    if (!input.trim() || !auth) return;
    // emit(send) message to server
    socket.emit("sendMessage", { content: input, senderId: auth.id, receiverId: otherId, senderUsername: auth.username });
    setInput("");
  };

  if (!auth) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 flex flex-col h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Chat with User "{otherName}"</h2>
        <button className="text-blue-500" onClick={() => navigate("/")}>Back</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white p-4 rounded shadow space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === auth.id ? "justify-end" : "justify-start"}`}>
            <div className={`${m.senderId === auth.id ? "bg-blue-100" : "bg-gray-100"} p-3 rounded-lg max-w-xs`}>
              <div className="text-sm font-medium text-blue-500">{m.senderUsername}</div>
              <div className="text-sm">{m.content}</div>
              <div className="text-xs text-gray-400 text-right">{new Date(m.createdAt).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex mt-4 space-x-2">
        <input className="flex-1 p-2 border rounded" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message..." />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 rounded">Send</button>
      </div>
    </div>
  );
}
