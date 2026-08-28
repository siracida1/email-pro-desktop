const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

function readAll() {
  if (!fs.existsSync(DB_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getData(key) {
  const data = readAll();
  return data[key] ?? null;
}

function saveData(key, value) {
  const data = readAll();
  data[key] = value;
  writeAll(data);
  return true;
}

module.exports = { getData, saveData };
