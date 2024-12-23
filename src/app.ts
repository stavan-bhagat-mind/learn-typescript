import express, { Application, Request, Response, NextFunction } from "express";
import IndexRoute from "./Routers/indexRoutes";
import dotenv from "dotenv";

dotenv.config();

const port: number = parseInt(process.env.PORT as string, 10) || 3000;
const app: Application = express();

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS permission
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  next();
});

// Root route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World with TypeScript!");
});
app.post("/test", (req: Request, res: Response) => {
  // console.log(req.headers);

  console.log(req.body); // This should log the request body
  // console.log(req); // Log the entire request object
  res.send("Request body received");
});
// Use the IndexRoute
app.use("/", IndexRoute);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
