import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export default function Test() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // Connect to server
    socket = io("http://localhost:5000");

    // Listen for messages from server
    socket.on("message", (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.emit("message", input); // Send to server
    setInput("");
  };

  return (
    <div className="p-4">
      <h1 className="font-bold">Socket.IO Chat</h1>

      <div className="border p-2 h-40 overflow-y-auto my-2">
        {messages.map((m, i) => (
          <div key={i}>{m}</div>
        ))}
      </div>

      <input
        className="border p-1 mr-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage} className="bg-blue-500 text-white px-2">
        Send
      </button>
    </div>
  );
}
