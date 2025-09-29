import { Router } from "express"
import { login, signup } from "../controllers/authen.js"

const authen = Router()
authen.post("/login", login)
authen.post("/signup", signup)

export default authen


