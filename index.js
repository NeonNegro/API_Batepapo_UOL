import express from "express";
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const app = express();
const port = 5000;
app.use(express.json());
app.use(cors());
dotenv.config;


const mongoClient = new MongoClient('mongodb://localhost:27017');
let db;


mongoClient.connect().then(()=>{
    db = mongoClient.db("BatePapoUol"); 
})

app.post('/participants', async (req, res) => {
    try{
      const participant = req.body;
      participant.lastStatus =  Date.now();
      const result = await db.collection('participants').insertOne(participant)
      res.sendStatus(201);
    } catch(err){
      console.error(err);
      res.sendStatus(500);
    };
  });



app.listen(port);