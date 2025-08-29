const url = "http://localhost:5001/api/sensor-data";

const payload = {
  deviceName: "Device 1",
  MuxId: "1",
  PipeNo: "2",

  // random sensor value generator
  ...Array.from({ length: 60 }, (_, index) => index + 1).reduce(
    (acc, sensor) => {
      acc[`sensor${sensor}`] = Math.floor(Math.random(0, 1) * 100);
      return acc;
    },
    {}
  ),
};

// const generatePayload = () => {
//   const payload = {
//     deviceName: "Device 1",
//     MuxId: "MUX_001",
//     PipeNo: "PIPE_002",
//   };

//   for (let i = 1; i <= 60; i++) {
//     payload[`sensor${i}`] = Math.floor(Math.random() * 100);
//   }

//   return payload;
// };

const testPost = async () => {
  const start = Date.now();
  // const payload = generatePayload();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    const end = Date.now();
    console.log("POST response:", data);
    console.log("POST duration (ms):", end - start);
  } catch (error) {
    console.error("POST error:", error.response?.data || error.message);
  }
};

// testPost();
setInterval(testPost, 100);
