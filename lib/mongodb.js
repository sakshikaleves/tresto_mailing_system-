// // lib/mongo.js
// import { MongoClient } from 'mongodb';

// const uri = 'mongodb+srv://sakshi_db_user:tresto@tresto.jd3gsfe.mongodb.net/?retryWrites=true&w=majority&appName=tresto';
// const client = new MongoClient(uri);

// export async function connectToDB() {
//   if (!client.isConnected) await client.connect();
//   return client.db('lead_db'); // You can name it anything
// }



// // C:\sanket\email-campaign-next\lib\mongodb.js

// import { MongoClient } from 'mongodb';

// const uri = process.env.MONGODB_URI;
// const options = {};

// let client;
// let clientPromise;

// if (!process.env.MONGODB_URI) {
//   throw new Error('❌ MONGODB_URI is not defined in environment variables');
// }

// if (process.env.NODE_ENV === 'development') {
//   if (!global._mongoClientPromise) {
//     client = new MongoClient(uri, options);
//     global._mongoClientPromise = client.connect();
//   }
//   clientPromise = global._mongoClientPromise;
// } else {
//   client = new MongoClient(uri, options);
//   clientPromise = client.connect();
// }

// export default clientPromise;




// C:\sanket\email-campaign-next\lib\mongodb.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};
let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables");
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// ✅ NEW FUNCTION: saveLeads
export async function saveLeads(leads) {
  if (!Array.isArray(leads) || leads.length === 0) return 0;
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "leadDB");
    const collection = db.collection("leads");

    // Use upsert to avoid duplicates based on domain
    const bulkOps = leads.map((lead) => ({
      updateOne: {
        filter: { domain: lead.domain },
        update: {
          $set: {
            url: lead.url,
            domain: lead.domain,
            emails: lead.emails,
            phones: lead.phones,
            industry: lead.industry,
            area: lead.area,
            source: lead.source,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(bulkOps, { ordered: false });
    return result.upsertedCount + result.modifiedCount;
  } catch (err) {
    console.error("❌ Failed to save leads:", err);
    return 0;
  }
}
