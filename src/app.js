import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { signin, signup } from "./controllers/usersController.js";
import { input, output, registry } from "./controllers/registriesControllers.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/signup', signup)

app.post('/signin', signin)
 
app.post('/input', input)

app.post('/output', output);

app.get('/registry', registry)

app.listen(process.env.PORTA);