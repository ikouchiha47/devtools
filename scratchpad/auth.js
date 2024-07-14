const generateName = require('./babynames');

let store = {
	__usedNames: new Set(),
	users: {},
};

const allowedCodes = "ABCDEFGHIJKLMNPQRSTUVWXYZ023456789"
const _allowedCodeLen = allowedCodes.length;

const generateCode = (len) => {
	return [...Array(len)].reduce((acc) => {
		let idx = Math.floor(Math.random() * (10 * 1)) % _allowedCodeLen;
		return acc + allowedCodes[idx];
	}, "")
}

const removeObjAttribute = (obj, key) => {
	let _copy = { ...obj }
	delete _copy[key]
	return _copy;
}

const MAX_TRY = 100;
const generateUniqueNames = () => {
	let i = 0;

	while (i < MAX_TRY) {
		let name = generateName();
		if (!(store.__usedNames.has(name))) {
			return name;
		}
		i += 1;
	}

	throw Error('max_users_capacity')
}

const Auth = {
	__codeLength: 6,
	__validatePresence: (id) => {
		if (!(id in store.users)) {
			throw Error('unauthorized')
		}
	},

	__validateDuplicate: (id) => {
		if (id in store.users) {
			throw Error('duplicate')
		}
	},

	init: function(id) {
		this.__validateDuplicate(id);

		store.users[id] = {
			id: id,
			authzed: false,
			authCode: generateCode(this.__codeLength),
			userName: null,
		};

		return store.users[id];
	},

	verify: function(id, code) {
		this.__validatePresence(id);

		if (code !== store.users[id].authCode) {
			throw Error('dead')
		}

		// We need mutexz here
		let name = generateUniqueNames()
		store.users[id].authzed = true;
		store.users[id].userName = name;

		return true
	},

	isAuthz: function(id) {
		this.__validatePresence(id);
		return store.users[id].authzed;
	},

	deregister: function(id) {
		this.__validatePresence(id);

		delete store.users[id];
	},

	devices: function() {
		return Object.values(store.users) || []
	},

	find: function(id) {
		this.__validatePresence(id);
		return store.users[id]
	}
}

module.exports = Auth;
