const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

const serviceAccount = require("./travelease-firebase-adminsdk.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// middleware
app.use(cors());
app.use(express.json());

const logger = (req, res, next) => {
  next();
};

const verifyFirebaseToken = async (req, res, next) => {
  if (!req.headers.authorization) {
    res.status(401).send({ message: "unauthorize access" });
  }
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    res.status(401).send({ message: "unauthorize access" });
  }
  // verify token
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    // console.log("token validation", userInfo);
    req.token_email = userInfo.email;
    next();
  } catch (error) {
    res.status(401).send({ message: "unauthorize access" });
  }
};

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
    const bookedVehicleCollection = db.collection("bookedVehicle");

    // add vehicle
    app.post("/add-vehicle", verifyFirebaseToken, async (req, res) => {
      const { email } = req.query;
      if (email != req.token_email) {
        res.status(403).send({ message: "forbidden access" });
      }

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

    // update vehicle data
    app.patch("/update-vehicles/:id", verifyFirebaseToken, async (req, res) => {
      const { email } = req.query;
      // console.log(email);
      if (email != req.token_email) {
        res.status(403).send({ message: "forbidden access" });
      }

      const { id } = req.params;
      const objId = new ObjectId(id);
      const modifiedData = req.body;

      // console.log("server hit", modifiedData);
      const updatedData = {
        $set: modifiedData,
      };
      const result = await vehicleCollection.updateOne(
        { _id: objId },
        updatedData,
      );
      res.send(result);
    });

    // delete users vehicle
    app.delete("/vehicles/:id", verifyFirebaseToken, async (req, res) => {
      const { id } = req.params;
      const { email } = req.query;
      if (email != req.token_email) {
        res.status(403).send({ message: "forbidden access" });
      }
      const objId = new ObjectId(id);
      const result = await vehicleCollection.deleteOne({ _id: objId });
      // console.log(req.params);
      // console.log("delete api hited");
      res.send(result);
    });

    // user's added vehicle
    app.get("/my-vehicles", verifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
      if (email != req.token_email) {
        res.status(403).send({ message: "forbidden access" });
      }

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

    // vehicle book api by client email and vehicle's data
    app.post("/book-vehicle", async (req, res) => {
      const {
        vehicleName,
        category,
        pricePerDay,
        location,
        description,
        coverImage,
        categories,
      } = req.body;

      const bookeData = {
        vehicleName,
        category,
        pricePerDay,
        location,
        description,
        coverImage,
        categories,
      };
      bookeData.clientEmail = req.query.email;

      const result = await bookedVehicleCollection.insertOne(bookeData);
      res.send(result);
    });

    // api for finding clients booked car
    app.get("/mybookings", verifyFirebaseToken, async (req, res) => {
      const { email } = req.query;
      if (email != req.token_email) {
        res.status(403).send({ message: "forbidden access" });
      }
      const result = await bookedVehicleCollection
        .find({ clientEmail: email })
        .toArray();
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
