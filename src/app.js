import express from "express";
import joi from "joi";
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
})

const userSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required(),
    confirmPassword: joi.any().valid(joi.ref('password')).required()
})

app.post('/signup', async (req,res)=>{

    const user = req.body;
    console.log(req.body);
    
    const {error} = userSchema.validate(user);

    if (error){
        console.log(error.details);
        res.sendStatus(401);
        return;
    }

    try{
        const emailExist = await db.collection("users").findOne({email: user.email});

        if (emailExist){
            res.status(409).send("E-mail já cadastrado");
            return;
        }

        await db.collection("users").insertOne(user);
    }catch(e){
        console.log(e);
        res.status(500).send("Não foi possível salvar os dados do usuário no banco de dados.");
        return;
    }

    res.sendStatus(201);
})



app.listen(5000);

