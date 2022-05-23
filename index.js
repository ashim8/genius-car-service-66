const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message: 'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            return res.status(403).send({message: 'Forbidden access'});
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
    // console.log('inside verifyJWT',authHeader);
   
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gmy2h.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect();
        const serviceCollection = client.db('geniusCar').collection('service');
        const orderCollection = client.db('geniusCar').collection('order');
        
        //AUTH
        app.post('/login', async(req, res)=>{
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
                expiresIn: '1d'
            });
            res.send({accessToken});

        })

        // Services API        
        app.get('/service', async(req,res)=>{
            const query = {};
            const cursor = serviceCollection.find(query).limit(6)
            // console.log(cursor);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/service/:id', async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const service = await serviceCollection.findOne(query);
            res.send(service);
        })

        //POST
        app.post('/service', async(req,res)=>{
            const newService = req.body;
            const result = await serviceCollection.insertOne(newService);
            res.send(result);
        });

        //update user
        // app.put('/service/:id', async(req,res)=>{
        //     const id = req.params.id;
        //     const updatePrice = req.body;
        //     const filter = {_id: ObjectId(id)};
        //     const options = {upsert: true}
        //     const updatedDoc = {
        //         $set: {
        //             price : updatePrice.price
        //             // ...updatePrice
                   
        //         }
        //      };
        //     const result = await serviceCollection.updateOne(filter, updatedDoc, options);
        //     res.send(result);
        // })
         // put item
        app.put('/service/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const quantityUpdate = req.body;
            console.log(quantityUpdate);
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    price : quantityUpdate.price,
                }
            };
            const result = await serviceCollection.updateOne(query, updateDoc, options);
            res.send(result);
        });
        //restock price
        // app.put('/service/:id', async (req, res) => {
        //     const id = req.params.id;
        //     console.log(id);
        //     const quantityUpdate = req.body;
        //     console.log(quantityUpdate);
        //     const query = { _id: ObjectId(id) };
        //     const options = { upsert: true };
        //     const updateDoc = {
        //         $set: {
        //             price : quantityUpdate.price,
        //         }
        //     };
        //     const result = await serviceCollection.updateOne(query, updateDoc, options);
        //     res.send(result);
        // });

        //Delete
        app.delete('/service/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        })

        //order collection API

        app.get('/order', verifyJWT, async(req, res)=>{
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            // console.log(email);
            if(email === decodedEmail){
                const query = {email: email};
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else{
                res.status(403).send({message: 'forbidden access'})
            }
        })


        app.post('/order', async(req, res)=>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        })

    }
    finally{

    }
}

run().catch(console.dir);

app.get('/', (req, res)=>{
    res.send('Running Genius Server');
});

app.get('/hero', (req, res) =>{
    res.send('Hero meets hero ku')
})
app.listen(port, ()=>{
    console.log('Listening to port', port);
})