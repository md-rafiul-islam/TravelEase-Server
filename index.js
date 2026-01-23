const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.qga6hdn.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    const db = client.db("travelEase");
    const vehicleCollection = db.collection("vehicle");

    // add vehicle
    app.post("/add-vehicle", async (req, res) => {
      const newVehicle = req.body;
      const result = await vehicleCollection.insertOne(newVehicle);
      // console.log(newVehicle);
      res.send(result);
    });

    // get all vehicle data
    app.get("/all-vehicles", async (req, res) => {
      const cursor = vehicleCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // get vehicle data by id
    app.get("/vehicles/:id", async (req, res) => {
      const { id } = req.params;
      const objId = new ObjectId(id);
      const result = await vehicleCollection.findOne({ _id: objId });
      res.send(result);
    });

    // delete users vehicle
    app.delete("/vehicles/:id", async (req, res) => {
      const { id } = req.params;
      const objId = new ObjectId(id);
      const result = await vehicleCollection.deleteOne({ _id: objId });
      console.log(req.params);
      console.log("delete api hited");
      res.send(result);
    });

    // user's added vehicle
    app.get("/my-vehicles", async (req, res) => {
      const email = req.query.email;

      const result = await vehicleCollection
        .find({ userEmail: email })
        .toArray();

      res.send(result);
    });

    // get fixed latest vehicles data
    app.get("/latest-vehicles", async (req, res) => {
      const sortByDate = { createdAt: -1 };
      const cursor = vehicleCollection.find().sort(sortByDate).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`server is running on port : ${port}`);
});
