import cliArgs from "command-line-args";
import axios from "axios";
import fs from "promise-fs";

import { cliOptionDefinitions, BASE_URL } from "./constants.js";

// This object stores all global data.
const globalConst = {
  txId: null,
  outputFile: null,
  axiosInstance: axios.create({
    baseURL: BASE_URL,
  }),
  txSize: 0,
  txStartOffset: 0,
  txEndOffset: 0,
  chunkSize: 256 * 1024,
  txChunks: [],
};

/**
 * This function check txId, and outputFile then return true if they are valid data otherwise return false.
 * @param {string} txId transaction hash value
 * @param {string} outputFile file output file path
 * @returns true or false
 */
const validateCliArgs = (txId, outputFile) => {
  if (!txId) {
    console.error("Transaction arg is empty!");
    return false;
  }

  if (!outputFile) {
    console.error("Output arg is empty!");
    return false;
  }

  return true;
};

/**
 * This function initialize all global variables.
 * @returns
 */
const init = async () => {
  const { transaction, output } = cliArgs(cliOptionDefinitions);

  if (!validateCliArgs(transaction, output)) {
    console.error("Args are invalid!");
    return;
  }

  globalConst.txId = transaction;
  globalConst.outputFile = output;

  // Get offset and transaction size from arweave
  try {
    const TX_OFFSET_URL = `${BASE_URL}/tx/${globalConst.txId}/offset`;
    const response = await globalConst.axiosInstance.get(TX_OFFSET_URL);
    const { size: txSize, offset: txOffset } = response.data;

    globalConst.txSize = +txSize;
    globalConst.txStartOffset = +txOffset - +txSize + 1;
    globalConst.txEndOffset = +txOffset + 1;
  } catch (err) {
    console.error(err);
  }

  // create a file for output
  try {
    await fs.open(globalConst.outputFile, "w");
  } catch (err) {
    console.error(err);
  }
};

/**
 * This function fetch all chunk transaction from arweave
 */
const getTransaction = async () => {
  const { axiosInstance, chunkSize, txEndOffset, txStartOffset, txSize } =
    globalConst;

  const txChunkPromises = [];

  /**
   * This function generates a Promise that fetch chunk from arweave and store it to global.txChunks.
   * @param {number} offset This param indicates the start position of chunk
   * @param {number} index This param indicates the chunk order
   * @returns Promise
   */
  const fetchChunkPromiseGenerator = (offset, index) =>
    new Promise((resolve, reject) => {
      (async () => {
        try {
          const response = await axiosInstance.get(`/chunk/${offset}`);
          const chunk = response.data.chunk;

          globalConst.txChunks[index] = chunk;
          resolve();
        } catch (err) {
          reject(err);
        }
      })();
    });

  for (let i = 0; txStartOffset + i * chunkSize < txEndOffset; i++) {
    let offset = txStartOffset + i * chunkSize;
    globalConst.txChunks.push(null);
    txChunkPromises.push(fetchChunkPromiseGenerator(offset, i));
  }

  // Display Aggregation
  console.log(`Transaction Size: ${txSize}, Chunk Size: ${chunkSize}`);
  console.log(`Chunk Range: ${txStartOffset} ~ ${txEndOffset}`);
  console.log(`Total Chunk Count: ${txChunkPromises.length}`);

  await Promise.all(txChunkPromises).catch((err) => {
    console.error(err);
  });
};

/**
 * This function saves chunk as a completed transaction.
 */
const saveTransaction = async () => {
  try {
    const { txChunks, outputFile } = globalConst;

    const fd = await fs.open(outputFile, "w");

    for (let chunk of txChunks) {
      await fs.write(fd, Buffer.from(chunk, "base64"));
    }
  } catch (err) {
    console.error(err);
  }
};

/**
 * Downloader.js start from this function
 */
const Main = async () => {
  await init();

  await getTransaction();
  await saveTransaction();
};

Main();
