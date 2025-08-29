import mongoose from "mongoose";
import express from "express";
import { configDotenv } from "dotenv";
import { MongoClient, ClientEncryption, ObjectId } from "mongodb";
import fs from "fs";
import compression from "compression";

import { keyVaultNamespace, kmsProviders } from "./helper/csfle.js";

import EfficientSensor from "./models/efficientSensorSchema.js";

configDotenv();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";

// Read and prepare the master key
const localMasterKeyBase64 = fs.readFileSync("./master-key.txt", "utf8").trim();
const localMasterKeyBuffer = Buffer.from(localMasterKeyBase64, "base64");

if (localMasterKeyBuffer.length !== 96) {
  throw new Error(
    `Local key must be 96 bytes. Current length: ${localMasterKeyBuffer.length} bytes.`
  );
}

// Get the data key ID first
const tempClient = new MongoClient(uri);
await tempClient.connect();
const keyVault = tempClient.db("encryption").collection("__keyVault");
const dataKey = await keyVault.findOne({ keyAltNames: "csfleDemoKey" });
if (!dataKey) {
  console.error("Data encryption key not found. Run the createDataKey script first.");
  process.exit(1);
}
const dataKeyId = dataKey._id;
console.log("✅ Data key found:", dataKeyId.toString("base64"));
await tempClient.close();

// Create schema map for automatic encryption/decryption
const schemaMap = {
  "csfle.sensors": {
    bsonType: "object",
    properties: Object.fromEntries(
      Array.from({ length: 60 }, (_, i) => [
        `sensor${i + 1}`,
        {
          encrypt: {
            keyId: dataKeyId,
            bsonType: "double",
            algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
          },
        },
      ])
    ),
  },
};

// MongoDB client with automatic decryption (bypass mongocryptd)
const autoEncryptClient = new MongoClient(uri, {
  autoEncryption: {
    keyVaultNamespace,
    kmsProviders,
    schemaMap,
    // Bypass mongocryptd for automatic decryption only
    bypassAutoEncryption: true,
    extraOptions: {
      mongocryptdBypassSpawn: true,
      mongocryptdSpawnPath: undefined
    }
  },
});
await autoEncryptClient.connect();
console.log("✅ Auto-decryption client connected");

// Regular MongoDB client for manual encryption when needed
const client = new MongoClient(uri);
await client.connect();
console.log("✅ Regular client connected");

// Initialize ClientEncryption for manual encryption
const clientEncryption = new ClientEncryption(client, {
  keyVaultNamespace,
  kmsProviders,
});

// Connect mongoose to the same database
mongoose.connect(uri + "/csfle?retryWrites=true&w=majority&appName=Cluster0");
console.log("✅ Mongoose connected");

const app = express();
app.use(express.json());
app.use(compression());

app.post("/api/sensor-data", async (req, res) => {
  const timerId = `POST /api/sensor-data-${Date.now()}-${Math.random()}`;
  console.time(timerId);
  try {
    const { deviceName, MuxId, PipeNo, ...sensorValues } = req.body;

    if (!deviceName || !MuxId || !PipeNo) {
      return res
        .status(400)
        .json({ message: "deviceName, MuxId, and PipeNo must be provided" });
    }

    // MANUAL ENCRYPTION - Encrypt each sensor individually
    const encryptedData = {};
    let encryptedCount = 0;

    for (let i = 1; i <= 60; i++) {
      const sensorKey = `sensor${i}`;
      const sensorValue = sensorValues[sensorKey];

      if (sensorValue !== undefined && sensorValue !== null) {
        // Ensure the value is a proper number for randomized encryption
        const numericValue = Number(sensorValue);

        if (isNaN(numericValue)) {
          console.warn(`Skipping ${sensorKey}: invalid numeric value ${sensorValue}`);
          continue;
        }

        try {
          // Manual encryption for each sensor
          encryptedData[sensorKey] = await clientEncryption.encrypt(
            numericValue,
            {
              keyId: dataKeyId,
              algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Random",
            }
          );
          encryptedCount++;
        } catch (error) {
          console.error(`Error encrypting ${sensorKey} with value ${numericValue}:`, error.message);
          // Skip this field rather than failing the entire request
        }
      }
    }

    // Insert using regular MongoDB client (not auto-encryption client)
    const sensorsCollection = client.db("csfle").collection("sensors");
    const document = {
      deviceName,
      MuxId,
      PipeNo,
      ...encryptedData,
      timestamp: new Date()
    };

    const result = await sensorsCollection.insertOne(document);

    res.status(201).json({
      message: "Sensor data saved with manual encryption!",
      insertedId: result.insertedId,
      encryptedFields: encryptedCount
    });
    console.timeEnd(timerId);
  } catch (error) {
    console.timeEnd(timerId);
    console.error("Error saving sensor data:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

app.get("/api/sensor-data", async (req, res) => {
  const timerId = `GET /api/sensor-data-${Date.now()}-${Math.random()}`;
  console.time(timerId);

  try {
    const { decrypt = 'false', limit = 100, skip = 0 } = req.query;

    if (decrypt === 'true') {
      // Full decryption (slow) - only for small datasets
      const sensorsCollection = autoEncryptClient.db("csfle").collection("sensors");
      const sensors = await sensorsCollection
        .find({})
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .toArray();

      res.json({
        count: sensors.length,
        data: sensors,
        method: "automatic decryption (paginated)",
        note: "Use ?decrypt=false for faster metadata-only retrieval"
      });
    } else {
      // Fast metadata retrieval (encrypted data stays encrypted)
      const sensorsCollection = client.db("csfle").collection("sensors");
      const sensors = await sensorsCollection
        .find({}, {
          projection: {
            deviceName: 1,
            MuxId: 1,
            PipeNo: 1,
            timestamp: 1,
            _id: 1
            // Exclude encrypted sensor fields for speed
          }
        })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .toArray();

      const totalCount = await sensorsCollection.countDocuments();

      res.json({
        count: sensors.length,
        totalCount,
        data: sensors,
        method: "metadata only (fast)",
        note: "Add ?decrypt=true to decrypt sensor values (slower). Use /api/sensor-data/decrypt/:id for individual record decryption."
      });
    }

  } catch (error) {
    console.error("Error retrieving sensor data:", error);
    res.status(500).json({
      error: error.message,
      method: "hybrid approach"
    });
  }

  console.timeEnd(timerId);
});

// Decrypt individual record by ID (on-demand decryption)
app.get("/api/sensor-data/decrypt/:id", async (req, res) => {
  const timerId = `GET /api/sensor-data/decrypt/${req.params.id}`;
  console.time(timerId);

  try {
    const { id } = req.params;

    // Get the encrypted record
    const sensorsCollection = client.db("csfle").collection("sensors");
    const encryptedRecord = await sensorsCollection.findOne({ _id: new ObjectId(id) });

    if (!encryptedRecord) {
      return res.status(404).json({ error: "Record not found" });
    }

    // Decrypt only the sensor fields we need
    const decryptedRecord = {
      _id: encryptedRecord._id,
      deviceName: encryptedRecord.deviceName,
      MuxId: encryptedRecord.MuxId,
      PipeNo: encryptedRecord.PipeNo,
      timestamp: encryptedRecord.timestamp
    };

    // Decrypt sensor fields individually (only decrypt what exists)
    for (let i = 1; i <= 60; i++) {
      const sensorKey = `sensor${i}`;
      if (encryptedRecord[sensorKey]) {
        try {
          decryptedRecord[sensorKey] = await clientEncryption.decrypt(encryptedRecord[sensorKey]);
        } catch (error) {
          console.warn(`Failed to decrypt ${sensorKey}:`, error.message);
          decryptedRecord[sensorKey] = null;
        }
      }
    }

    res.json({
      data: decryptedRecord,
      method: "individual record decryption",
      note: "Fast on-demand decryption for single records"
    });

  } catch (error) {
    console.error("Error decrypting record:", error);
    res.status(500).json({
      error: error.message,
      method: "individual decryption"
    });
  }

  console.timeEnd(timerId);
});

app.post("/api/efficient-sensor-data", async (req, res) => {
  console.time("POST /api/efficient-sensor-data");
  try {
    const { deviceName, MuxId, PipeNo, ...sensorValues } = req.body;

    if (!deviceName || !MuxId || !PipeNo) {
      return res.status(400).json({
        message: "deviceName, MuxId, and PipeNo must be provided",
      });
    }

    // Extract sensor values
    const sensors = {};
    for (const [key, value] of Object.entries(sensorValues)) {
      if (key.startsWith("sensor") && value !== undefined && value !== null) {
        sensors[key] = value;
      }
    }

    if (Object.keys(sensors).length === 0) {
      return res.status(400).json({
        message: "At least one sensor value must be provided",
      });
    }

    // Encrypt the ENTIRE sensors object as JSON string
    const encryptedSensorsData = await clientEncryption.encrypt(
      JSON.stringify(sensors),
      {
        keyId: dataKeyId,
        algorithm: "AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic",
      }
    );

    const newSensor = new EfficientSensor({
      deviceName,
      MuxId,
      PipeNo,
      encryptedData: encryptedSensorsData, // Single encrypted field
    });

    await newSensor.save();
    console.timeEnd("POST /api/efficient-sensor-data");

    res.status(201).json({
      message: "Sensor data saved successfully with bulk encryption!",
      device: deviceName,
      sensorCount: Object.keys(sensors).length,
    });
  } catch (error) {
    console.timeEnd("POST /api/efficient-sensor-data");
    console.error("Error saving sensor data:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

app.get("/api/efficient-sensor-data", async (req, res) => {
  const startTime = Date.now();

  try {
    // Use cursor-based streaming for large datasets
    const sensorCursor = EfficientSensor.find({}).cursor();

    const decryptedData = [];
    let processedCount = 0;

    // Process documents in batches with streaming
    for await (const doc of sensorCursor) {
      try {
        // Decrypt the entire sensors object
        const decryptedString = await clientEncryption.decrypt(
          doc.encryptedData
        );
        const sensorsData = JSON.parse(decryptedString);

        decryptedData.push({
          _id: doc._id,
          deviceName: doc.deviceName,
          MuxId: doc.MuxId,
          PipeNo: doc.PipeNo,
          sensors: sensorsData,
          timestamp: doc.timestamp,
          __v: doc.__v,
        });
      } catch (error) {
        console.error("Error decrypting document:", error);
        decryptedData.push({
          _id: doc._id,
          deviceName: doc.deviceName,
          MuxId: doc.MuxId,
          PipeNo: doc.PipeNo,
          sensors: {},
          decryptionError: error.message,
          timestamp: doc.timestamp,
          __v: doc.__v,
        });
      }

      processedCount++;

      // Add a small delay every 100 documents to prevent event loop blocking
      if (processedCount % 100 === 0) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    const processingTime = Date.now() - startTime;

    res.json({
      count: decryptedData.length,
      data: decryptedData,
      processingTime: `${processingTime}ms`,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("Error retrieving sensor data:", error);
    res.status(500).json({
      error: error.message,
      processingTime: `${processingTime}ms`,
    });
  }
});

// Super efficient endpoint for large datasets with automatic decryption
app.get("/api/sensor-data/stream", async (req, res) => {
  console.time("GET /api/sensor-data/stream");

  try {
    const { limit = 1000, skip = 0 } = req.query;

    // Use auto-encryption client with pagination for massive datasets
    const sensorsCollection = autoEncryptClient.db("csfle").collection("sensors");

    const sensors = await sensorsCollection
      .find({})
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .toArray();

    const totalCount = await sensorsCollection.countDocuments();

    res.json({
      count: sensors.length,
      totalCount,
      skip: parseInt(skip),
      limit: parseInt(limit),
      data: sensors,
      note: "Automatically decrypted with pagination for efficiency"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }

  console.timeEnd("GET /api/sensor-data/stream");
});

// Bulk insert endpoint for high-performance data ingestion
app.post("/api/sensor-data/bulk", async (req, res) => {
  console.time("POST /api/sensor-data/bulk");

  try {
    const { sensors } = req.body;

    if (!Array.isArray(sensors) || sensors.length === 0) {
      return res.status(400).json({
        message: "sensors array is required and must not be empty"
      });
    }

    // Use auto-encryption client for bulk operations
    const sensorsCollection = autoEncryptClient.db("csfle").collection("sensors");

    // Prepare documents with timestamps
    const documents = sensors.map(sensor => ({
      ...sensor,
      timestamp: new Date()
    }));

    const result = await sensorsCollection.insertMany(documents);

    res.status(201).json({
      message: "Bulk sensor data saved with automatic encryption!",
      insertedCount: result.insertedCount,
      insertedIds: Object.values(result.insertedIds)
    });

  } catch (error) {
    console.error("Error in bulk insert:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }

  console.timeEnd("POST /api/sensor-data/bulk");
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`app is listening on http://localhost:${PORT}`);
});
