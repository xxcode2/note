// Tiny IndexedDB key/value store — used as the persistence backend for zustand.
const DB_NAME = 'haven-db'
const STORE = 'kv'

let dbPromise = null
const openDb = () => {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

export const idbGet = async (key) => {
  try {
    const db = await openDb()
    return await new Promise((res, rej) => {
      const t = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
      t.onsuccess = () => res(t.result === undefined ? null : t.result)
      t.onerror = () => rej(t.error)
    })
  } catch {
    return localStorage.getItem(key)
  }
}

export const idbSet = async (key, value) => {
  try {
    const db = await openDb()
    await new Promise((res, rej) => {
      const t = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key)
      t.onsuccess = res
      t.onerror = () => rej(t.error)
    })
  } catch {
    localStorage.setItem(key, value)
  }
}

export const idbDel = async (key) => {
  try {
    const db = await openDb()
    await new Promise((res) => {
      const t = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(key)
      t.onsuccess = res
      t.onerror = res
    })
  } catch {
    localStorage.removeItem(key)
  }
}

// zustand persist storage adapter (async, value stored as-is — JSON strings)
export const idbStorage = {
  getItem: async (name) => idbGet(name),
  setItem: async (name, value) => idbSet(name, value),
  removeItem: async (name) => idbDel(name),
}
