const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function readCollection(collection) {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8');
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeCollection(collection, data) {
  ensureDataDir();
  fs.writeFileSync(getFilePath(collection), JSON.stringify(data, null, 2), 'utf8');
}

function generateId() {
  return crypto.randomUUID();
}

function nowISO() {
  return new Date().toISOString();
}

function createStore(collection) {
  return {
    getAll(filterFn) {
      const items = readCollection(collection);
      return filterFn ? items.filter(filterFn) : items;
    },

    getById(id) {
      const items = readCollection(collection);
      return items.find((item) => item._id === id) || null;
    },

    findOne(filterFn) {
      const items = readCollection(collection);
      return items.find(filterFn) || null;
    },

    create(data) {
      const items = readCollection(collection);
      const now = nowISO();
      const record = { _id: generateId(), ...data, createdAt: now, updatedAt: now };
      items.push(record);
      writeCollection(collection, items);
      return record;
    },

    update(id, data) {
      const items = readCollection(collection);
      const idx = items.findIndex((item) => item._id === id);
      if (idx === -1) return null;
      const { _id, createdAt, ...rest } = data;
      items[idx] = { ...items[idx], ...rest, updatedAt: nowISO() };
      writeCollection(collection, items);
      return items[idx];
    },

    upsert(id, data) {
      const items = readCollection(collection);
      const idx = items.findIndex((item) => item._id === id);
      if (idx === -1) {
        return this.create(data);
      }
      const { _id, createdAt, ...rest } = data;
      items[idx] = { ...items[idx], ...rest, updatedAt: nowISO() };
      writeCollection(collection, items);
      return items[idx];
    },

    deleteById(id) {
      const items = readCollection(collection);
      const idx = items.findIndex((item) => item._id === id);
      if (idx === -1) return null;
      const [removed] = items.splice(idx, 1);
      writeCollection(collection, items);
      return removed;
    },

    deleteMany(filterFn) {
      const items = readCollection(collection);
      const keep = items.filter((item) => !filterFn(item));
      const deletedCount = items.length - keep.length;
      writeCollection(collection, keep);
      return { deletedCount };
    },

    bulkUpdate(updates) {
      const items = readCollection(collection);
      for (const { id, changes } of updates) {
        const idx = items.findIndex((item) => item._id === id);
        if (idx !== -1) {
          items[idx] = { ...items[idx], ...changes, updatedAt: nowISO() };
        }
      }
      writeCollection(collection, items);
    },

    replaceAll(data) {
      writeCollection(collection, data);
    },
  };
}

ensureDataDir();

module.exports = {
  filesStore: createStore('files'),
  annotationsStore: createStore('annotations'),
  crossRefsStore: createStore('cross-references'),
};
