// // create-collection.js
// const { MongoClient } = require("mongodb");

// const uri = "mongodb+srv://psitech:Psitech123@pms.ijqbdmu.mongodb.net/PMS?retryWrites=true&w=majority";

// async function run() {
//   const client = new MongoClient(uri);

//   try {
//     console.log("Connecting to MongoDB...");
//     await client.connect();
//     console.log("✅ Connected successfully!");

//     // Use the correct case for the database
//     const db = client.db("PMS");

//     const collectionName = "scrap";
//     const collections = await db.listCollections({ name: collectionName }).toArray();

//     if (collections.length === 0) {
//       await db.createCollection(collectionName);
//       console.log(`✅ Collection '${collectionName}' created successfully.`);
//     } else {
//       console.log(`ℹ️ Collection '${collectionName}' already exists.`);
//     }

//   } catch (err) {
//     console.error("❌ Error:", err.message);
//   } finally {
//     await client.close();
//     console.log("Connection closed.");
//   }
// }

// run();








// C:\sanket\email-campaign-next\scripts\testMongo.js

require("dotenv").config({ path: ".env.local" }); // load env variables
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "PMS";

if (!uri) {
  console.error("❌ MONGODB_URI not found in environment variables.");
  process.exit(1);
}

async function testMongo() {
  console.log(`🔗 Connecting to MongoDB: ${uri} ...`);

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Connection successful.");

    const db = client.db(dbName);
    const collection = db.collection("leads_test");

    console.log("📝 Inserting test document...");
    const result = await collection.insertOne({
      test: true,
      message: "Hello from test script!",
      insertedAt: new Date(),
    });

    console.log(`✅ Inserted with _id: ${result.insertedId}`);

    console.log("🔍 Fetching document...");
    const doc = await collection.findOne({ _id: result.insertedId });
    console.log("📄 Document fetched:", doc);

    console.log("🧹 Cleaning up (deleting test doc)...");
    await collection.deleteOne({ _id: result.insertedId });

    console.log("✅ Test completed successfully.");
  } catch (err) {
    console.error("❌ MongoDB Test Failed:", err);
  } finally {
    await client.close();
  }
}

testMongo();
