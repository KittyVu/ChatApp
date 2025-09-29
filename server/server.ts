import "dotenv/config";
import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import sequelize from "./libs/db.ts";
import User from "./models/User.ts";
import Message from "./models/Message.ts";

import authenRoutes from "./routes/authen.ts";
import userRoutes from "./routes/users.ts";
import messageRoutes from "./routes/messages.ts";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

await sequelize.sync({ alter: true }); 

// ----------------- Types -----------------
interface AuthRequest extends Request {
  body: {
    username: string;
    password: string;
  };
}

interface SendMessagePayload {
  content: string;
  senderId: number;
  receiverId: number;
  senderUsername: string;
}

// ----------------- Routes -----------------

// 🔑 Signup
app.post("/api/signup", async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });
    res.json({ id: user.id, username: user.username });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

// 🔑 Login
app.post("/api/login", async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );
  res.json({ token, id: user.id, username: user.username });
});

// app.use("/api/authen", authenRoutes);

// 👥 Fetch users
app.get("/api/users", async (req, res) => {
  const users = await User.findAll({ attributes: ["id", "username"] });
  res.json(users);
});

app.get("/api/users/:id", async (req, res) => {
  const user = await User.findByPk(req.params.id, { attributes: ["id", "username"] });
  res.json(user || {});
});
// app.use("/api/users", userRoutes);

// 📩 Fetch messages
app.get("/api/messages/:userId/:otherId", async (req: Request, res: Response) => {
  const userId = Number(req.params.userId);
  const otherId = Number(req.params.otherId);

  const msgs = await Message.findAll({
    where: {
      senderId: [userId, otherId],
      receiverId: [userId, otherId],
    },
    order: [["createdAt", "ASC"]],
  });
  res.json(msgs);
});

// app.use("/api/messages", authenRoutes);

// ----------------- Socket.IO -----------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Register userId for this socket
  socket.on("register", (userId: number) => {
    socket.data.userId = userId;
  });

  socket.on("joinRoom", (room) => {
    socket.join(room);
    socket.data.currentRoom = room; // Track current chat room
  });
  // listen for an event and receive message from client
  socket.on("sendMessage", async ({ content, senderId, receiverId, senderUsername }) => {
    if (!content) return;

    const message = await Message.create({ content, senderId, receiverId, senderUsername });

    const room = `room_${Math.min(senderId, receiverId)}_${Math.max(senderId, receiverId)}`;

    // Send to chat room (chat page)
    io.to(room).emit("newMessage", message);

    // Send notification to receiver only if not in this room
    for (const [id, s] of io.sockets.sockets) {
      if (s.data.userId === receiverId && s.data.currentRoom !== room) {
        s.emit("newMessage", message); // receiver will show toast + badge
      }
    }
  });

  socket.on("leaveRoom", (room) => {
    socket.leave(room);
    delete socket.data.currentRoom;
  });
});



// ----------------- Start Server -----------------
const PORT = Number(process.env.PORT) || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
