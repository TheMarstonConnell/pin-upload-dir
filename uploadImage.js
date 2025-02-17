import { promises as fs } from "fs";
import { join } from "path";
import FormData from "form-data";
import "dotenv/config";
import mime from "mime-types";
import path from "path";
import fetch from "node-fetch";

const API_BASE = "https://pinapi.jackalprotocol.com/api";
const BEARER_TOKEN = process.env.API_TOKEN;

async function processFile(filepath, collectionId) {
  const filename = filepath.split("/").pop();
  console.log(`Processing ${filename}...`);

  try {
    // Step 1: Upload file
    console.log("Uploading file...");
    const contentType =
      mime.lookup(path.extname(filepath)) || "application/octet-stream";

    const formData = new FormData();
    formData.append("files", await fs.readFile(filepath), {
      filename,
      contentType,
    });

    const initialUpload = await fetch(`${API_BASE}/v1/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });
    //
    // {"cid":"bafybeicx77sf2ikzoaznr4sjeyq3343rjg4vqc7q2xkxaty4nj7a3u2xu4",
    // "merkle":"5f626117939dd44448fa850fbcf6374fac1ccf7c1ee680b3f7f6e3b612ba07c69ad21ffa9d761297db429a68b506c31dddb3ffa38cabc963be708f019a9d799a",
    // "name":"727.png"}
    // console.log("Initial upload response:", await initialUpload.text());
    const initialUploadResponse = await initialUpload.json();

    console.log("initial upload response", initialUploadResponse);

    
    const fileId = initialUploadResponse[0].id;
    console.log("file id", fileId);

    // Step 3: Add to collection
    console.log(
      `Adding to collection... (${`${API_BASE}/collections/${collectionId}/${fileId}`})`
    );
    const collectionAdditionResp = await fetch(
      `${API_BASE}/collections/${collectionId}/${fileId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
      }
    );

    console.log(
      "collection addition response: ",
      collectionAdditionResp.status
    );

    console.log(`Completed processing ${filename}`);
    console.log("----------------------------------------");
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
  }
}

async function processDirectory(directory, collectionName) {
  // Step 1: Get collection ID
  console.log("Getting collection ID...");
  const collectionsResp = await fetch(
    `${API_BASE}/collections?name=${collectionName}`,
    {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
    }
  );
  // {"collections":[
  // {"name":"test_architects_lvl2",
  // "id":187,"cid":"QmZbTmk3TrXdZHnDhqsmDSZgPTytD3Gv8br5zJQifikDXF"}
  // ],"count":1}
  const collectionInfo = await collectionsResp.json();
  const collectionId = collectionInfo.collections.at(0).id;

  try {
    const files = await fs.readdir(directory);
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|mp4|json)$/i.test(file)
    );

    for (const file of imageFiles) {
      console.log(`Processing file: ${join(directory, file)}`);

      await processFile(join(directory, file), collectionId);
    }

    console.log("All files processed!");
  } catch (error) {
    console.error("Error processing directory:", error);
  }
}

// Check command line arguments
if (process.argv.length < 4) {
  console.log("Usage: node script.js <directory> <collection_id>");
  process.exit(1);
}

const [, , directory, collectionName] = process.argv;

// Check if API_TOKEN exists in environment
if (!BEARER_TOKEN) {
  console.error("Error: API_TOKEN not found in environment variables");
  console.log("Make sure you have a .env file with API_TOKEN=your_token");
  process.exit(1);
}

processDirectory(directory, collectionName);
