// Persistence port implementations. The core has no dependency on either adapter.
export class MemoryStorage {
  async load() { return this.value ? structuredClone(this.value) : null; }
  async save(value) { this.value=structuredClone(value); }
  async clear() { this.value=null; }
}
export class IndexedDBStorage {
  constructor(name='solarpolis-arrival-commons-v1') {this.name=name;}
  async database() {
    if(this.db)return this.db;
    this.db=await new Promise((resolve,reject)=>{
      const request=indexedDB.open(this.name,1);
      request.onupgradeneeded=()=>request.result.createObjectStore('sessions');
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error);
      request.onblocked=()=>reject(new Error('Database upgrade is blocked by another tab'));
    });
    return this.db;
  }
  async operation(mode,fn) {
    const db=await this.database();
    return new Promise((resolve,reject)=>{
      const transaction=db.transaction('sessions',mode);
      let result;
      const request=fn(transaction.objectStore('sessions'));
      request.onsuccess=()=>{result=request.result;};
      transaction.oncomplete=()=>resolve(result??null);
      transaction.onerror=()=>reject(transaction.error);
      transaction.onabort=()=>reject(transaction.error??new Error('Storage transaction aborted'));
    });
  }
  load() {return this.operation('readonly',store=>store.get('current'));}
  save(value) {return this.operation('readwrite',store=>store.put(value,'current'));}
  clear() {return this.operation('readwrite',store=>store.delete('current'));}
}
