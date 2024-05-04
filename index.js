const express = require('express');
require('dotenv').config()
const cors  = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const app= express();
const port = process.env.PORT||5000;


//middleware
app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}));

app.use(express.json());
app.use(cookieParser());


console.log(process.env.DB_USER)
console.log(process.env.DB_PASS)
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ipsrkdy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
// middlewares nijosso
const logger = async(req,res,next)=>{
  console.log('called', req.host, req.originalUrl)
  next();
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
   const serviceCollection = client.db("carDoctor").collection("services") ;
   const bookingCollection = client.db('carDoctor').collection('bookings');
  
  // auth related api
  app.post('/jwt',logger,async(req,res)=>{
    const user = req.body;
    console.log(user)
    const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
    res
    .cookie('token',token,{
      httpOnly:true,
      secure:false,//http://localhost:5173/login.  true hobe https takle
      sameSite:'strict'
    })
    .send({success:true});
  })
  //  app.post('/jwt',async(req,res)=>{
  //   const user = req.body;
  //   const token = jwt.sign({
  //     user,
  //   }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
  //   res
  //   .cookie('token',token,{
  //     httpOnly:true,
  //     secure:false,
  //     sameSite:'none'
  //   })
  //   .send({success:true})

  //  })

  
  //  services related api
  //  find multiple data
   app.get('/services',logger,async(req,res)=>{
    const cursor = serviceCollection.find();
    const result = await cursor.toArray();
    res.send(result);
   })

  //  find single data
  app.get('/services/:id',async(req,res)=>{
    const id = req.params.id;
    const query = {_id:new ObjectId(id)};
    
    const options = {
      
      // Include only the `title` and `imdb` fields in the returned document
      projection: {  title: 1, imdb: 1,
        service_id:1,price:1, img:1},
    };

     const result = await serviceCollection.findOne(query,options);
     res.send(result);
     
  })
    //  bookings
    app.post('/bookings',logger,async(req,res)=>{
      const booking = req.body;
     
      const result = await bookingCollection.insertOne(booking);
      res.send(result)
      console.log(booking);
    })
    app.get('/bookings',async(req,res)=>{
      console.log(req.query.email);
       console.log('tok tok token',req.cookies.token)

      let query = {};
      if(req.query?.email){
        query = {email:req.query.email}
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })

    app.patch('/bookings/:id',async(req,res)=>{
     
      const id = req.params.id;
      const filter = {_id:new ObjectId(id)};
      const updateBooking = req.body;
      const updateDoc = {
        $set: {
            status:updateBooking.status,
        },
      };
      const result = await bookingCollection.updateOne(filter,updateDoc);
      res.send(result);
      console.log(updateBooking);
    })

    app.delete('/bookings/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id:new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })

   

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('doctor is running');
})
app.listen(port,(req,res)=>{
    console.log(`car doctor server is running on port ${port}`)
})