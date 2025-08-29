import mongoose from "mongoose";

const sensorSchema = mongoose.Schema({
  deviceName: { type: String, required: true, trim: true },
  MuxId: { type: String, required: true, trim: true },
  PipeNo: { type: String, required: true, trim: true },

  // generate 60 sensor values
  ...Array.from({ length: 60 }, (_, index) => index + 1).reduce(
    (acc, sensorNum) => {
      acc[`sensor${sensorNum}`] = { type: Number, required: false };
      return acc;
    },
    {}
  ),

  timestamp: { type: Date, default: Date.now },
});

sensorSchema.index({ "timestamp": -1 })
sensorSchema.index({ "deviceName": 1, "timestamp": -1 })
sensorSchema.index({ "MuxId": 1, "PipeNo": 1 })

export default mongoose.model("Sensor", sensorSchema);
