import joi from "joi";
import dayjs from "dayjs";

import db from "./../db.js";

const registrySchema = joi.object({
    value: joi.number().required(),
    description: joi.string().required().min(1).max(40)
});

export async function input(req, res){

    const {user} = res.locals;
    
    const registry = req.body;
    const {error} = registrySchema.validate(registry);

    if (error){
        console.log(error.details);
        return res.status(400).send(error.details);
    }

    await db.collection("registries").insertOne({
        ...registry, 
        date: dayjs().format("DD/MM"), 
        userId: user._id, 
        positive: true
    });

    res.sendStatus(201);
}

export async function output(req, res){

    const {user} = res.locals;

    const registry = req.body;
    const {error} = registrySchema.validate(registry);

    if (error){
        console.log(error.details);
        return res.status(400).send(error.details);
    }

    await db.collection("registries").insertOne({
        ...registry, 
        date: dayjs().format("DD/MM"), 
        userId: user._id , 
        positive: false
    });

    res.sendStatus(201);
}

export async function registry(req, res){

    const {user} = res.locals;

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
}