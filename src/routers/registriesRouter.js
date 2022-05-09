import {Router} from "express";

import { input, output, registry } from "../controllers/registriesControllers.js";

import validToken from "../middlewares/authMiddleware.js";

const registriesRouter = Router();

registriesRouter.use(validToken);
registriesRouter.post('/input', input);
registriesRouter.post('/output', output);
registriesRouter.get('/registry', registry);

export default registriesRouter;