import fs from "fs";

const localMasterKeyBase64 = fs
  .readFileSync("./master-key.txt", "utf-8")
  .trim();

const localMasterKeyBuffer = Buffer.from(localMasterKeyBase64, "base64");

// Verify the key length is exactly 96 bytes
if (localMasterKeyBuffer.length !== 96) {
  throw new Error(
    `Local key must be 96 bytes. Current length: ${localMasterKeyBuffer.length} bytes.`
  );
}

export const kmsProviders = {
  local: {
    key: localMasterKeyBuffer,
  },
};

export const keyVaultNamespace = "encryption.__keyVault";
