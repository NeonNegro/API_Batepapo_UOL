import express from "express";
import cors from 'cors';
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import e from './errors.js';
import { userSchema, messageSchema } from "./schemas.js";
import dayjs from "dayjs";
import { stripHtml } from "string-strip-html";

const app = express();
const port = 5000;
app.use(express.json());
app.use(cors());
dotenv.config();

const TIME_LIMIT_TO_STAY = 10000;
const TIME_TO_CHECK_AND_PURGE = 15000;
console.log(process.env.MONGO_URI);

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

mongoClient.connect().then(()=>{
    db = mongoClient.db("BatePapoUol"); 
})


app.post('/participants', async (req, res) => {
    try{
      const participant = req.body;
      participant.name = stripHtml(participant.name).result.trim();


      const validation = userSchema.validate(participant);
      if(validation.error){
        res.sendStatus(422);
        return
      }
      const consult = await db.collection('participants').findOne({name: participant.name });
      if(consult){
        res.sendStatus(409);
        return
      }
      participant.lastStatus =  Date.now();
      const result = await db.collection('participants').insertOne(participant);

      const alert = {
            from: participant.name,
            to: 'Todos',
            text: 'entra na sala...',
            type: 'status',
            time: dayjs(Date.now()).format('HH:mm:ss')
      }

      await db.collection('messages').insertOne(alert);

      res.sendStatus(201);
    } catch(err){
      sendError(res, e.ERROR_LOGIN);
      console.log(err);
    };
  });

app.post('/messages', async (req, res) => {
  const message = req.body;
  message.to = stripHtml(message.to).result.trim();
  message.text = stripHtml(message.text).result.trim();
  const user = stripHtml(req.headers.user).result.trim();
  
  const validation = messageSchema.validate(message);
  if(validation.error){
    res.sendStatus(422);
    return
  }
  
  const consult = await db.collection('participants').findOne({name: user });

  if(!consult){
    res.status(422).send('Nenhum participante com esse nome');
    return
  }
  
  try{
    const date = dayjs(Date.now()).format('HH:mm:ss');
    message.from = user;
    message.time = date;
    const result = db.collection('messages').insertOne(message);
    res.sendStatus(201);
    
  } catch(err){
     console.error(err);
     res.sendStatus(500);
  }
});

app.get('/participants', async (req, res) =>{
  
  try{
      const participants = await db.collection('participants').find().toArray();
      res.send(participants);
  } catch(err) {
    res.status(500).send(err);
  }
});

app.get('/messages', async(req,res) =>{

  const user = req.headers.user;
  if(!user){
    res.status(422).send('Usuário não enviado!');
    return
  }

  const {limit} = req.query;

  try{
    const messages = await db.collection('messages').find({
      $or: [
        {"to": {"$in": ["Todos", user]}},
        {"from": user},
        {"type": "message"}
      ]
    }).toArray();

    if(limit){
       res.send(messages.slice(-limit));
       return
    }

    res.send(messages);

  } catch(err){
    res.status(500).send(err);
  }
});

app.post('/status', async (req,res) =>{

  const user = req.headers.user;
  if(!user){
    res.status(422).send("Usuário não enviado");
    return
  }

  try{
    const logged = await db.collection('participants').findOne({name: user});
    if (!logged){
      res.sendStatus(404);
      return
    }

    logged.lastStatus = Date.now();
    await db.collection('participants').updateOne({
      name: user
    }, {$set: logged});
    res.sendStatus(200);

  } catch(err){
    res.status(500).send(err);
  }
});

app.put('/messages/:id', async (req, res) => {

  const user = req.headers.user;

  if(!user){
    res.status(422).send("usuário não enviado");
    return
  }

  const newMessage = req.body;
  const validation = messageSchema.validate(newMessage);
  if(validation.error){
    res.sendStatus(422);
    return
  }

  const {id} = req.params;

  try {

    const userFound = await db.collection('participants').findOne({name: user});
    if(!userFound){
      res.sendStatus(422);
      return
    }

    const message =  await db.collection('messages').findOne({_id: new ObjectId(id)});
    if(!message){
      res.sendStatus(404);
      return
    }
    if(message.from !== user){
      res.sendStatus(401);
      return
    }

    message.text = newMessage.text;
    message.time = dayjs(Date.now()).format('HH:mm:ss');
    message.from = user;
    await db.collection('messages').updateOne({ 
			_id: new ObjectId(id) 
		}, { $set: message });
				
		res.sendStatus(200)

  } catch(err){
    res.status(500).send(err);
  }
});

app.delete('/messages/:id', async (req,res) =>{

  const user = req.headers.user;

  if(!user){
    res.status(422).send("Usuário não enviado");
    return
  }

  const { id } = req.params;

  try {
    const message =  await db.collection('messages').findOne({_id: new ObjectId(id)});

    if(!message){
      res.sendStatus(404);
      return
    }

    if(message.from !== user){
      res.status(401).send('A mensagem não é sua!');
      return
    }

    await db.collection('messages').deleteOne({_id: new ObjectId(id)});
    res.status(200).send('Mensagem deleteda com sucesso!');

  } catch(err){
    res.status(500).send(err);
  }
});


setInterval(removeInativeUsers,TIME_TO_CHECK_AND_PURGE);

async function removeInativeUsers(){
  try{
    const users =  await db.collection('participants').find().toArray();
    const toRemove = users.filter(u =>{
      return  (Date.now() - u.lastStatus) > TIME_LIMIT_TO_STAY
    })

    const toRemoveId = toRemove.map(x =>{return x._id});

    db.collection("participants").deleteMany({
      _id: {$in: toRemoveId}
    });

    const alerts = toRemove.map(r =>{
      return {
          from: r.name,
          to: 'Todos',
          text: 'sai da sala...',
          type: 'status',
          time: dayjs(Date.now()).format('HH:mm:ss')
      }
    })
    ;

    if(alerts && alerts.length>0)
      await db.collection('messages').insertMany(alerts);
    
  } catch(err){
    console.log(err);
  }
}


function sendError(r,e){
  return r.status(e.code).send(e.msg)
}

app.listen(port);
