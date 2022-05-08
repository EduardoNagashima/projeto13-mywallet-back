import joi from "joi";
import {v4} from "uuid";
import bcrypt from "bcrypt";

import db from "./../db.js";

const userSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required()
});

export async function signup(req, res){
    
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
}

export async function signin(req, res){
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
}