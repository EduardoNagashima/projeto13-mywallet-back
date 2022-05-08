import {MongoClient} from "mongodb";
import dotenv from "dotenv";
dotenv.config();

let db;
const mongoClient = new MongoClient(process.env.MONGO_URI);

try{
    await mongoClient.connect();
    db = mongoClient.db(process.env.BANCO);
    console.log("Banco rodando na porta", process.env.PORTA);
}catch(e){
    console.log("Erro ao se conectar com o banco", e);
}

export default db;