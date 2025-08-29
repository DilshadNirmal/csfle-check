/**
 *  Performance Test: Automatic vs Manual Encryption - benchmark done in intel i5 10400F with 24 GB of ram

1️⃣ Testing Automatic Encryption...
   POST Time: 87ms
   Result: Sensor data saved with manual encryption!

2️⃣ Testing Fast Metadata Retrieval...
   Fast GET Time: 912ms
   Records: 100/14157

2️⃣b Testing Count Only...
   Count Time: 22ms
   Total Records: 14157

2️⃣c Testing Latest Records...
   Latest Time: 9ms
   Latest Records: 10

3️⃣ Testing Streaming with Pagination...
   Stream Time: 3757ms
   Records: 100/14157

4️⃣ Testing Manual Encryption (Bulk)...
   Manual Time: 18ms
   Result: Sensor data saved successfully with bulk encryption!

📊 Performance Summary:
   Automatic Encryption: 87ms
   Fast Metadata GET: 912ms
   Count Only: 22ms
   Latest Records: 9ms
   Streaming (paginated): 3757ms
   Manual Encryption: 18ms

🚀 Performance Tips:
   • Use /api/sensor-data (metadata only) for listings
   • Use /api/sensor-data/count for total counts
   • Use /api/sensor-data/latest for recent data
   • Use /api/sensor-data/decrypt/:id for individual records
   • Add ?decrypt=true only when you need sensor values
 */

// Performance test comparing manual vs automatic encryption/decryption
const testData = {
    deviceName: "PerformanceTest",
    MuxId: "MUX999",
    PipeNo: "PIPE999",
    sensor1: 23.5,
    sensor2: 45.2,
    sensor3: 67.8,
    sensor4: 12.1,
    sensor5: 89.3,
    sensor6: 34.7,
    sensor7: 56.9,
    sensor8: 78.1,
    sensor9: 90.3,
    sensor10: 12.5
};

async function performanceTest() {
    const baseURL = "http://localhost:5001";

    console.log("🚀 Performance Test: Automatic vs Manual Encryption\n");

    try {
        // Test 1: Automatic encryption (efficient)
        console.log("1️⃣ Testing Automatic Encryption...");
        const autoStart = Date.now();

        const autoPostResponse = await fetch(`${baseURL}/api/sensor-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        const autoPostResult = await autoPostResponse.json();
        const autoPostTime = Date.now() - autoStart;
        console.log(`   POST Time: ${autoPostTime}ms`);
        console.log(`   Result: ${autoPostResult.message}`);

        // Test 2: Fast metadata retrieval (ultra-fast)
        console.log("\n2️⃣ Testing Fast Metadata Retrieval...");
        const fastGetStart = Date.now();

        const fastGetResponse = await fetch(`${baseURL}/api/sensor-data?limit=100`);
        const fastGetResult = await fastGetResponse.json();
        const fastGetTime = Date.now() - fastGetStart;
        console.log(`   Fast GET Time: ${fastGetTime}ms`);
        console.log(`   Records: ${fastGetResult.count}/${fastGetResult.totalCount}`);

        // Test 2b: Count only (instant)
        console.log("\n2️⃣b Testing Count Only...");
        const countStart = Date.now();

        const countResponse = await fetch(`${baseURL}/api/sensor-data/count`);
        const countResult = await countResponse.json();
        const countTime = Date.now() - countStart;
        console.log(`   Count Time: ${countTime}ms`);
        console.log(`   Total Records: ${countResult.totalCount}`);

        // Test 2c: Latest records (very fast)
        console.log("\n2️⃣c Testing Latest Records...");
        const latestStart = Date.now();

        const latestResponse = await fetch(`${baseURL}/api/sensor-data/latest?limit=10`);
        const latestResult = await latestResponse.json();
        const latestTime = Date.now() - latestStart;
        console.log(`   Latest Time: ${latestTime}ms`);
        console.log(`   Latest Records: ${latestResult.count}`);

        // Test 3: Streaming with pagination (for large datasets)
        console.log("\n3️⃣ Testing Streaming with Pagination...");
        const streamStart = Date.now();

        const streamResponse = await fetch(`${baseURL}/api/sensor-data/stream?limit=100&skip=0`);
        const streamResult = await streamResponse.json();
        const streamTime = Date.now() - streamStart;
        console.log(`   Stream Time: ${streamTime}ms`);
        console.log(`   Records: ${streamResult.count}/${streamResult.totalCount}`);

        // Test 4: Manual encryption (for comparison)
        console.log("\n4️⃣ Testing Manual Encryption (Bulk)...");
        const manualStart = Date.now();

        const manualResponse = await fetch(`${baseURL}/api/efficient-sensor-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });

        const manualResult = await manualResponse.json();
        const manualTime = Date.now() - manualStart;
        console.log(`   Manual Time: ${manualTime}ms`);
        console.log(`   Result: ${manualResult.message}`);

        // Summary
        console.log("\n📊 Performance Summary:");
        console.log(`   Automatic Encryption: ${autoPostTime}ms`);
        console.log(`   Fast Metadata GET: ${fastGetTime}ms`);
        console.log(`   Count Only: ${countTime}ms`);
        console.log(`   Latest Records: ${latestTime}ms`);
        console.log(`   Streaming (paginated): ${streamTime}ms`);
        console.log(`   Manual Encryption: ${manualTime}ms`);

        console.log("\n🚀 Performance Tips:");
        console.log("   • Use /api/sensor-data (metadata only) for listings");
        console.log("   • Use /api/sensor-data/count for total counts");
        console.log("   • Use /api/sensor-data/latest for recent data");
        console.log("   • Use /api/sensor-data/decrypt/:id for individual records");
        console.log("   • Add ?decrypt=true only when you need sensor values");

    } catch (error) {
        console.error("❌ Performance test failed:", error.message);
    }
}

performanceTest();