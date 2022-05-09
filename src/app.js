import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import userRouter from "./routers/usersRouter.js";
import registriesRouter from "./routers/registriesRouter.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(userRouter);
app.use(registriesRouter);

app.listen(process.env.PORTA);