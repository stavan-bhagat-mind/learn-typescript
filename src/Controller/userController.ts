import { Request, Response } from "express";

interface Item {
  id: number;
  name: string;
}

const items: Item[] = [];
let currentId = 1;

export const createItem = (req: Request, res: Response) => {
  console.log(req.body);
  const newItem: Item = { id: currentId++, name: req.body.name };
  items.push(newItem);
  res.status(201).json(newItem);
};

export const getItems = (req: Request, res: Response) => {
  res.json(items);
};

export const updateItem = (req: Request, res: Response) => {
  const itemId = parseInt(req.params.id);
  const item = items.find((i) => i.id === itemId);
  if (item) {
    item.name = req.body.name;
    res.json(item);
  } else {
    res.status(404).send("Item not found");
  }
};

export const deleteItem = (req: Request, res: Response) => {
  const itemId = parseInt(req.params.id);
  const index = items.findIndex((i) => i.id === itemId);
  if (index !== -1) {
    items.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).send("Item not found");
  }
};
