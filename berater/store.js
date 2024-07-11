// This is either gonna be something
// or just nothing

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
//
const Mutex = {
	_locked: false,
	_waitQueue: [],
	cancelError: new Error("Mutex operation canceled"),

	lock: function(priority = 0) {
		return new Promise((resolve, reject) => {
			if (!this._locked) {
				this._locked = true;
				resolve();
			} else {
				const task = { resolve, reject, priority };
				const i = this.findIndexFromEnd(this._waitQueue, (other) => priority <= other.priority);
				this._waitQueue.splice(i + 1, 0, task);
			}
		});
	},

	unlock: function() {
		if (!this._locked) {
			throw new Error("Mutex is not locked");
		}
		this._locked = false;
		this._dispatch();
	},

	isLocked: function() {
		return this._locked;
	},

	cancel: function() {
		this._waitQueue.forEach((entry) => entry.reject(this._cancelError));
		this._waitQueue = [];
	},

	_dispatch: function() {
		if (this._waitQueue.length > 0) {
			const nextTask = this._waitQueue.shift();
			this._locked = true;
			nextTask.resolve();
		}
	},

	findIndexFromEnd: function(a, predicate) {
		for (let i = a.length - 1; i >= 0; i--) {
			if (predicate(a[i])) {
				return i;
			}
		}
		return -1;
	}
}

// not much concurrncy going on here
// if you are trying to access the details
// from both server and client at the same time
// you sir, are a lunatic. #respect
//
const Store = {
	_tables: { reviews: [] },
	_mutex: Mutex,
	_prevHash: null,
	_store: ':memory:',
	_hash: (data) => {
		return crypto.createHash('sha256').update(data).digest('hex');
	},

	init: function(name, tables) {
		this._tables = tables || {};
		if (Object.keys(this._tables).length == 0) throw 'StoreNotInitialized'

		this._store = name;
		this._snapperId = this.snapshot();
		this._mutex = Object.create(Mutex);
		return this;
	},

	tryload: async function() {
		let db = `${this._store}.json`

		try {
			let data = await fs.readFile(db, { flag: 'r', encoding: 'utf-8' })
			let diskdata = JSON.parse(data);

			console.log("loading from snapshot");
			this._tables = diskdata;
		} catch (e) {
			console.error(`Failed to load data from disk`)
			await this.flush();
		}

		return this;
	},

	set: function(table, row, data) {
		if (!(table in this._tables)) throw 'TableNotFound'
		if (!(row in this._tables[table])) this._tables[table] = { ...this._tables[table], [row]: null }

		// console.log(this._tables, "on set");
		this._tables[table][row] = data;
		return this;
	},

	get: function(table, row) {
		if (!(table in this._tables)) throw 'TableNotFound'

		return this._tables[table][row]
	},

	flush: async function() {
		let db = `${this._store}.json`

		await this._mutex.lock();

		let copy = { ...this._tables }
		let data = JSON.stringify(copy, null, 2);
		let checksum = this._hash(data);

		if (this._prevHash == checksum) {
			this._mutex.unlock();
			// console.log("skipping save since checksum matches")
			return
		}

		this._prevHash = checksum;
		console.log(`Taking snapshot at ${Date.now()}, checksum ${checksum}`)
		// console.log(data)

		try {
			await fs.writeFile(db, data, { flag: 'w' })
		} catch (e) {
			console.error(e);
		} finally {
			this._mutex.unlock();
		}
	},

	snapshot: function() {
		let that = this;

		return setInterval(async () => {
			await that.flush.call(this);
		}, 4000)
	},

	stop: function() {
		clearInterval()
	},
}

module.exports = Store;
