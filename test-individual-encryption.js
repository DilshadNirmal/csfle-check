// Test individual sensor encryption
const testData = {
    deviceName: "TestDevice001",
    MuxId: "MUX123",
    PipeNo: "PIPE456",
    sensor1: 23.5,
    sensor2: 45.2,
    sensor3: 67.8,
    sensor4: 12.1,
    sensor5: 89.3
};

async function testIndividualEncryption() {
    const baseURL = "http://localhost:5001";

    try {
        console.log("🧪 Testing Individual Sensor Encryption...");

        // Test POST to individual encryption endpoint
        const postResponse = await fetch(`${baseURL}/api/sensor-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const postResult = await postResponse.json();
        console.log("✅ POST Response:", postResult);

        // Test GET from individual encryption endpoint
        const getResponse = await fetch(`${baseURL}/api/sensor-data`);
        const getResult = await getResponse.json();
        console.log("✅ GET Response:", {
            count: getResult.count,
            firstRecord: getResult.data[0]
        });

        console.log("🎉 Individual encryption test passed!");

    } catch (error) {
        console.error("❌ Test failed:", error.message);
    }
}

testIndividualEncryption();