import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.ts";

interface AuthRequest extends Request {
  body: {
    username: string;
    password: string;
  };
}

export const login = async (req: AuthRequest, res: Response) => {
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
};

export const signup = async (req: AuthRequest, res: Response) => {
     const { username, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashed });
    res.json({ id: user.id, username: user.username });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
}