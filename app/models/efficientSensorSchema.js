import mongoose from "mongoose";

// const sensorSchema = {
//   type: Map,
//   of: {
//     type: Number,
//   },
//   required: true,
//   default: {},
// };

const efficientSensorSchema = mongoose.Schema({
  deviceName: { type: String, required: true, trim: true },
  MuxId: { type: String, required: true, trim: true },
  PipeNo: { type: String, required: true, trim: true },

  encryptedData: { type: Buffer, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Add to your schema definition or create separately
efficientSensorSchema.index({ deviceName: 1 });
efficientSensorSchema.index({ MuxId: 1, PipeNo: 1 });

export default mongoose.model("efficientSensor", efficientSensorSchema);
