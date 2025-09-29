import User from "../models/User.ts"

export const showAllUsers = async (req: Request, res: Response) => {
    const users = await User.findAll({ attributes: ["id", "username"] });
    res.json(users);
}

export const showOneUser = async (req: Request, res: Response) => {
    const users = await User.findByPk(req.params.id);
    res.json(users);
}