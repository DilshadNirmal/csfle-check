import { MongoClient, ClientEncryption } from "mongodb";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);

const localMasterKeyBase64 = fs.readFileSync("./master-key.txt", "utf8").trim();
const localMasterKeyBuffer = Buffer.from(localMasterKeyBase64, "base64");

if (localMasterKeyBuffer.length !== 96) {
  throw new Error(
    `Local key must be 96 bytes. Current length: ${localMasterKeyBuffer.length} bytes.`
  );
}

const keyVaultNamespace = "encryption.__keyVault";
const kmsProviders = { local: { key: localMasterKeyBuffer } };

async function createDataKey() {
  try {
    await client.connect();

    const encryption = new ClientEncryption(client, {
      keyVaultNamespace,
      kmsProviders,
    });

    const keyId = await encryption.createDataKey("local", {
      keyAltNames: ["csfleDemoKey"],
    });

    console.log("✅ Data Key created successfully!");
    console.log("DataKeyId (base64):", keyId.toString("base64"));
    console.log("DataKeyId (UUID):", keyId.toString("hex"));

    const keyVault = client.db("encryption").collection("__keyVault");
    const savedKey = await keyVault.findOne({ _id: keyId });

    if (savedKey) console.log("✅ Key verified in key vault collection");
    else console.log("❌ Key not found in key vault");
  } finally {
    await client.close();
  }
}

createDataKey().catch((err) => {
  console.error("Failed to create data key:", err);
  process.exit(1);
});
