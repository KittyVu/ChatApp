import { Router } from "express";
import { showAllUsers, showOneUser } from "../controllers/users";

const users = Router();

// 👥 Fetch users
users.get("/", showAllUsers);
users.get("/:id",showOneUser);

export default users;