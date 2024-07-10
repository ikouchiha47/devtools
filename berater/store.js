// This is either gonna be something
// or just nothing

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
//
const Mutex = {
	_waitqueue: [],
	_islocked: false,

	lock: function() {
		const that = this;
		return new Promise((resolve, reject) => {
			const locker = () => {
				if (!that._islocked) {
					that._islocked = true
					resolve();
				} else {
					// console.log("pushing to queue")
					that._waitqueue.push(locker)
				}
			}

			locker();
		})
	},
	unlock: function() {
		// console.log("unlocking ", this._waitqueue.length)
		if (this._waitqueue.length > 0) {
			let reliver = this._waitqueue.shift()
			reliver()
		} else {
			this._islocked = false
		}
		// console.log("locked?", this._islocked);
	},
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
