import { Router } from "express";
import Message from "../models/Message";
import { showMessage } from "../controllers/messages";

const message = Router();

message.get("/:userId/:otherId", showMessage);

export default message