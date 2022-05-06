import express from "express";
import joi from "joi";
import bcrypt from "bcrypt";
import cors from "cors";
import {MongoClient} from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let db;

const mongoClient = new MongoClient(process.env.MONGO_URI)
mongoClient.connect().then(()=>{
    db = mongoClient.db("projeto13");
    console.log("Banco rodando na porta", process.env.PORTA);
})

const userSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    confirmPassword: joi.any().valid(joi.ref('password')).required()
})

const registrySchema = joi.object({
    value: joi.number().required(),
    description: joi.string().required()
})

app.post('/signup', async (req, res)=>{

    const user = req.body;
    const {password, email, name} = user;
    
    const {error} = userSchema.validate(user);

    if (error){
        console.log(error.details);
        res.sendStatus(401);
        return;
    }

    try{
        const emailExist = await db.collection("users").findOne({email});

        if (emailExist){
            res.status(409).send("E-mail já cadastrado");
            return;
        }

        const cryptoPassword = bcrypt.hashSync(password, 10);

        await db.collection("users").insertOne({
            name,
            email, 
            password: cryptoPassword});

    }catch(e){
        console.log(e);
        res.status(500).send("Não foi possível salvar os dados do usuário no banco de dados.");
        return;
    }

    res.sendStatus(201);
})

app.post('/signin', async (req, res)=>{
    const {email, password} = req.body;

    try{
       const user = await db.collection("users").findOne({email});
       console.log(user);
       console.log(bcrypt.compareSync(password, user.password));
       if(user && bcrypt.compareSync(password, user.password)){
           res.send(200);
           return;
       } else {
           res.status(403).send("Login e/ou senha incorreto(s).");
           return;
       }
    }catch(e){
        console.log(e);
        res.sendStatus(401);
        return;
    }
})
 
app.post('/in', async (req, res)=>{
    const registry = req.body;
    const {error} = registrySchema.validate(registry);

    if (error){
        console.log(error.details);
        return res.sendStatus(400);
    }

    await db.collection("registries").insertOne({...registry, signal: 'positive'});
    res.sendStatus(201);
})

app.post('/out', async (req, res)=>{
    const registry = req.body;
    const {error} = registrySchema.validate(registry);

    if (error){
        console.log(error.details);
        return res.sendStatus(400);
    }

    await db.collection("registries").insertOne({...registry, signal: 'negative'});
    res.sendStatus(201);
});

app.get('/registry', async (req, res)=>{
    try{
        const balance = await db.collection("registries").find({}).toArray();
        console.log(balance);
        return res.send(balance);
    } catch (e) {
        console.log(e);
        return res.status(404).send("Erro ao pegar o balanço da conta no banco de dados");
    }
})

app.listen(process.env.PORTA);