import express from "express";
import cors from 'cors';
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import e from './errors.js';

const app = express();
const port = 5000;
app.use(express.json());
app.use(cors());
dotenv.config;


// async function initMongo() {
//  try{
//   const mongoClient = new MongoClient(process.env.MONGO_URI);
//   await mongoClient.connect();
//   const db = mongoClient.db(process.env.MONGO_NAME)
//   return { mongoClient, db }
// } catch(err){
//    console.log(err);
//    console.log('error ao abrir conexao com o DB');
// }
// } (


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
      sendError(res, e.ERROR_LOGIN);
    };
  });

app.post('/messages', async (req, res) => {
  try{
    const message = req.body;
    const user = req.headers.user;
    const date = dayjs(Date.now(), "HH:mm:ss");
    message.from = user;
    message.time = date;
    const result = db.collection('messages').insertOne(message);
    res.sendStatus(201);
    
  } catch(err){
     console.error(err);
     res.sendStatus(500);
  }
  // {
  //   to: "Maria",
  //   text: "oi sumida rs",
  //   type: "private_message"
  // }
});




app.get('/participants', async (req, res) =>{
  try{
    const user = req.headers.user;
    if(user){
      const login = await db.collection('participants').findOne({name: user});
      const participants = [];
      participants.push(await db.collection('participants').find().toArray());
      res.send(participants);
    }
    throw "no user sent"
  } catch(err) {
    res.status(500).send(err);
  }
});



function sendError(r,e){
  return r.status(e.code).send(e.msg)
}



app.listen(port);




// import express from 'express';
// import { MongoClient, ObjectId } from 'mongodb';
// import dotenv from 'dotenv';
// dotenv.config();

// const mongoClient = new MongoClient(process.env.MONGO_URI);
// let db;
// mongoClient.connect(() => {
//   db = mongoClient.db("my_store_ultra_system_incremented");
// });

// const app = express();
// app.use(express.json());

// /* Products Routes */
// app.get('/products', async (req, res) => {
//   try{
//     const products = await db.collection('products').find().toArray();
//     res.send(products);
// } catch(err) {
//   console.error(err);
//   res.seendStatus(500);
// };
// });

// app.get('/products/:id', async (req, res) => {
//   const id = req.params.id;
//   try{
//     const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
//     if (!product) {
//       return res.sendStatus(404);
//     }
//     res.send(product);

//   } catch {
//     console.error(err);
//     res.sendStatus(500);
//   }
// });

// app.post('/products', async (req, res) => {
//   try{
//     const product = req.body;
//     const result = await db.collection('products').insertOne(product)
//     res.sendStatus(201);
//   } catch(err){
//     console.error(err);
//     res.sendStatus(500);
//   };
// });

// /* Customers Routes */
// app.get('/customers', async (req, res) => {
//   try {
//     const customers = await db.collection('customers').find().toArray();
//     res.send(customers);
//   } catch (err) {
//     console.error(err);
//     res.sendStatus(500);
//   }
// });

// app.get('/customers/:id', async (req, res) => {
//   try {
//     const id = req.params.id;

//     const customer = await db.collection('customers').findOne({ _id: new ObjectId(id) });

//     if (!customer) {
//       return res.sendStatus(404);
//     }

//     res.send(customer);
//   } catch (err) {
//     console.log(err);
//     res.sendStatus(500);
//   }
// });

// app.post('/customers', async (req, res) => {
//   try {
//     const customer = req.body;

//     await db.collection('customers').insertOne(customer);
    
//     res.sendStatus(201);
//   } catch (err) {
//     console.log(err);
//     res.sendStatus(500);
//   }
// });

// app.listen(5000, () => {
//   console.log('Server is litening on port 5000.');
// });