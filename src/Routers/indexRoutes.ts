import { Router } from "express";
const IndexRoute = Router();

import userRoute from "./userRoute";
IndexRoute.use("/v1/user", userRoute);

export default IndexRoute;
