const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../data/store.json");

function readStore() {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeStore(store) {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

module.exports = { readStore, writeStore };
