import { parentPort, workerData } from 'worker_threads';

// Worker receives: { records } - data is already decrypted by autoEncryptClient
const { records } = workerData;

async function processBatch() {
    try {
        // Data is already decrypted, just process it
        const processedRecords = records.map(record => ({
            ...record,
            // Add any additional processing here if needed
            processedAt: new Date()
        }));

        // Send results back to main thread
        parentPort.postMessage({
            success: true,
            data: processedRecords,
            processedCount: processedRecords.length
        });

    } catch (error) {
        parentPort.postMessage({
            success: false,
            error: error.message,
            processedCount: 0
        });
    }
}

processBatch();