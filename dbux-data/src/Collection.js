import { newLogger } from '@dbux/common/src/log/logger';

/**
 * @template {T}
 */
export default class Collection {
  /**
   * NOTE: collection ids can be 0
   * @type {number}
   */
  _id;
  /**
   * @type {T[]}
   */
  _all = [];

  /**
   * @type {string}
   */
  name;

  /**
   * @type {DataProvider}
   */
  dp;

  constructor(name, dp) {
    this.log = newLogger(`${name} (Col)`);
    this.name = name;
    this.dp = dp;

    this._id = dp.versions.length; // dp.versions[_id] = 1
    dp.versions.push(1);
  }

  // ###########################################################################
  // Writes
  // ###########################################################################

  /**
   * @param {T[]} entries 
   */
  add(entries) {
    if (!this._all.length && entries[0] !== null) {
      // pad with a `null`, if necessary
      this._all.push(null);
    }

    // WARNING: cannot use push(...entries) for large `entries` array.
    // see: https://github.com/nodejs/node/issues/27732
    for (const entry of entries) {
      if (!entry.id) {
        // add a general purpose id
        entry.id = this._all.length;
      }
      this._all.push(entry);
    }
  }

  /**
   * Collections can use this to massage data after all data has been added, but before indexes have been processed.
   * @virtual
   * 
   * @param {T[]} entries
   */
  postAdd(entries) {
    if (this.handleEntryAdded) {
      for (const entry of entries) {
        this.handleEntryAdded(entry);
      }
    }
  }

  // handleEntryAdded(entry) {}

  /**
   * Collections can use this to massage data after all data has been added, and after indexes have been processed.
   * @virtual
   */
  postIndex(/* entries */) { }

  // ###########################################################################
  // Reads
  // ###########################################################################

  *[Symbol.iterator]() {
    for (let i = 1; i < this._all.length; ++i) {
      yield this._all[i];
    }
  }

  /**
   * @type {number}
   */
  get size() {
    // TODO: make this more consistent (currently, we are padding null only after first add)
    return this._all.length > 0 ? this._all.length - 1 : 0;
  }

  get all() {
    return this._all;
  }

  /**
   * @return {T[]}
   */
  getAll() {
    return this._all;
  }

  /**
   * @param {number} id
   * @return {T}
   */
  getById(id) {
    return this._all[id];
  }

  getLast() {
    if (!this._all.length) {
      return null;
    }
    return this._all[this._all.length - 1];
  }

  find(cb) {
    const { all } = this;
    for (let i = 1; i < all.length; ++i) {
      const entry = all[i];
      if (cb(entry)) {
        return entry;
      }
    }
    return undefined;
  }
}