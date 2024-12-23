import { Router } from "express";
import {
  createItem,
  getItems,
  updateItem,
  deleteItem,
} from "../Controller/userController";

const userRouter = Router();

userRouter.post("/add", createItem);
userRouter.get("/list", getItems);
userRouter.put("/:id", updateItem);
userRouter.delete("/:id", deleteItem);

export default userRouter;
