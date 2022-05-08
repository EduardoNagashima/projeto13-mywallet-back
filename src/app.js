import express from "express";
import joi from "joi";
import bcrypt from "bcrypt";
import cors from "cors";
import {MongoClient} from "mongodb";
import dotenv from "dotenv";
import {v4} from "uuid";
import dayjs from "dayjs"

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
    password: joi.string().required()
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
        return res.sendStatus(401);
    }

    const emailExist = await db.collection("users").findOne({email});
    if (emailExist){
        return res.status(409).send("E-mail já cadastrado");
    }

    try{
        const cryptoPassword = bcrypt.hashSync(password, 10);

        await db.collection("users").insertOne({
            name,
            email, 
            password: cryptoPassword});

    }catch(e){
        console.log(e);
        return res.status(500).send("Não foi possível salvar os dados do usuário no banco de dados.");
    }

    res.status(201).send("Conta criada com sucesso!");
})

app.post('/signin', async (req, res)=>{
    const {email, password} = req.body;

    try{
       const user = await db.collection("users").findOne({email});
       if(user && bcrypt.compareSync(password, user.password)){
           
        const token = v4();

           await db.collection("sessions").insertOne({
               userId: user._id,
               date: Date.now(),
               token
           });

           return res.send(token);
       } else {
           return res.status(403).send("Login e/ou senha incorreto(s).");
       }
    }catch(e){
        console.log(e);
        return res.status(500).send("Erro ao tentar se comunicar com o banco de dados!");
    }
})
 
app.post('/in', async (req, res)=>{
    
  //VALIDAÇÃO DO TOKEN, SESSION E USER
  const {authorization} = req.headers;
  const token = authorization?.replace('Bearer ', "");
  if(!token) return res.sendStatus(401);
  const session = await db.collection("sessions").findOne({token});
  if (!session){
      return res.sendStatus(401);
  }
  const user = await db.collection("users").findOne({
      _id: session.userId
  })
  if (!user){
      res.sendStatus(401);
  }


    const registry = req.body;
    const {error} = registrySchema.validate(registry);

    if (error){
        console.log(error.details);
        return res.sendStatus(400);
    }

    await db.collection("registries").insertOne({
        ...registry, 
        date: dayjs().format("DD/MM"), 
        userId: user._id, 
        positive: true
    });

    res.sendStatus(201);
})

app.post('/out', async (req, res)=>{
    
  //VALIDAÇÃO DO TOKEN, SESSION E USER
  const {authorization} = req.headers;
  const token = authorization?.replace('Bearer ', "");
  if(!token) return res.sendStatus(401);
  const session = await db.collection("sessions").findOne({token});
  if (!session){
      return res.sendStatus(401);
  }
  const user = await db.collection("users").findOne({
      _id: session.userId
  })
  if (!user){
      res.sendStatus(401);
  }


    const registry = req.body;
    const {error} = registrySchema.validate(registry);

    if (error){
        console.log(error.details);
        return res.sendStatus(400);
    }

    await db.collection("registries").insertOne({
        ...registry, 
        date: dayjs().format("DD/MM"), 
        userId: user._id , 
        positive: false});

    res.sendStatus(201);
});

app.get('/registry', async (req, res)=>{

    //VALIDAÇÃO DO TOKEN, SESSION E USER
    const {authorization} = req.headers;
    const token = authorization?.replace('Bearer ', "");
    if(!token) return res.sendStatus(401);
    const session = await db.collection("sessions").findOne({token});
    if (!session){
        return res.sendStatus(401);
    }
    const user = await db.collection("users").findOne({
        _id: session.userId
    })
    if (!user){
        res.sendStatus(401);
    }

    try{
        const registries = await db.collection("registries").find({
            userId: user._id}).toArray();
        const userInfo = {
            username : user.name, 
            registries
        }
        return res.send(userInfo);
    } catch (e) {
        console.log(e);
        return res.status(404).send("Erro ao pegar o balanço da conta no banco de dados");
    }
})

app.listen(process.env.PORTA);