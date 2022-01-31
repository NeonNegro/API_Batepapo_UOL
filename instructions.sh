#   mongod --dbpath ~/.mongo        -- starta o banco de dados
#   mongosh                         -- outra forma de startar o server
#   mongod                          -- entra no banco
#   use BatePapoUol                 -- entra no banco do exercicio
#   pkill -f nodemon                -- pra quando o nodemon começar a dar problemas





# async function initMongo() {
#  try{
#   const mongoClient = new MongoClient(process.env.MONGO_URI);
#   await mongoClient.connect();
#   const db = mongoClient.db(process.env.MONGO_NAME)
#   return { mongoClient, db }
# } catch(err){
#    console.log(err);
#    console.log('error ao abrir conexao com o DB');
# }
# } (
