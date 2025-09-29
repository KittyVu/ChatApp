import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: { origin: "*" }, // allow all origins (for dev)
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // Listen for an event from client
  socket.on("message", (data) => {
    console.log("📩 Received message:", data);

    // Send to this client only
    socket.emit("message", `You sent: ${data}`);

    // Broadcast to everyone except sender
    socket.broadcast.emit("message", `User ${socket.id} says: ${data}`);

    // OR send to all (including sender)
    io.emit("message", `Everyone: ${data}`);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Start server
httpServer.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
