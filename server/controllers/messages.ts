import Message from "../models/Message";

export const showMessage = async (req: Request, res: Response) => {
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
};