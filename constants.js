// This Object defines command line args, so we can use --transaction | --output in cli as parameters.
export const cliOptionDefinitions = [
  { name: "transaction", alias: "t", type: String },
  { name: "output", alias: "o", type: String },
];

// Axios configuration constants
export const BASE_URL = 'https://arweave.net';
