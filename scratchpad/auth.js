const generateName = require('./babynames');
const crypto = require("crypto");

let store = {
	__usedNames: new Set(),
	__tokensIndex: {},
	users: {},
};

const allowedCodes = ["ABCDEFGHIJKLMNPQRSTUVWXYZ", "023456789"]
const [_nCodeStrs, _nCodeInts] = allowedCodes.map(codes => codes.length);

const generateCode = (len) => {
	return [...Array(len)].reduce((acc, _, i) => {
		const rand = Math.floor(Math.random() * (10 * 1))

		if (i % 3 == 0) {
			let idx = rand % _nCodeInts;
			return acc + allowedCodes[1][idx];
		}

		let idx = rand % _nCodeStrs;
		return acc + allowedCodes[0][idx];

	}, "")
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

// TODO: use JWT
const generateToken = (l) => {
	l ||= 64;
	return crypto.randomBytes(l / 2).toString('hex')
}

const AuthorizedStates = ["authn", "authz"]

const AuthToken = {
	id: null,
	authzed: null,
	authCode: null,
	userName: null,
	authToken: null,
	markDelete: false,
}

const Auth = {
	__codeLength: 6,
	__validatePresence: (id) => {
		if (!(id in store.users))
			throw Error('unauthorized')
	},

	__validateDuplicate: (id) => {
		if (id in store.users)
			throw Error('duplicate')
	},

	__validateAuthorized: (id) => {
		if (store.users[id].authzed != AuthorizedStates[1])
			throw Error('unauthorized')
	},

	__validateAuthenticated: (id) => {
		if (AuthorizedStates.includes(store.users[id].authzed))
			throw Error('fucked_auth')
	},

	init: function(id) {
		this.__validateDuplicate(id);

		store.users[id] = Object.assign(AuthToken, {
			id: id,
			authzed: null,
			authCode: generateCode(this.__codeLength),
			userName: null,
		});

		return store.users[id];
	},

	verify: function(id, code) {
		this.__validatePresence(id);

		if (code !== store.users[id].authCode) {
			throw Error('dead')
		}

		// We need mutexz here
		let name = generateUniqueNames()

		store.users[id].authzed = AuthorizedStates[0];
		store.users[id].userName = name;
		store.users[id].authToken = generateToken();

		console.log("resetting");

		store.__tokensIndex[name] = { token: store.users[id].authToken, id: id };
		store.__usedNames.add(name);

		return store.users[id]
	},

	authorize: function(name, token) {
		console.log("authorize", store.__tokensIndex);

		let res = store.__tokensIndex[name]

		if (!res) {
			throw Error('fucked_auth')
		}

		if (res.token != token) {
			throw Error('unauthorized')
		}

		return [true, store.__tokensIndex[name]];
	},

	rehydrate: function(oldId, newId, name) {
		let user = store.users[oldId]
		if (!user) throw Error('da_faq')

		store.users[newId] = { ...store.users[oldId], markDelete: false }
		// console.log(store.users, newId, oldId);

		store.__tokensIndex[name].id = newId;

		delete store.users[oldId]
	},

	isAuthz: function(id) {
		this.__validatePresence(id);
		this.__validateAuthorized(id)

		return true;
	},

	deregister: function(id) {
		// this.__validatePresence(id);
		store.users[id].markDelete = true;
	},

	devices: function() {
		return Object.values(store.users) || []
	},

	find: function(id) {
		this.__validatePresence(id);
		return store.users[id]
	},
	debug: () => store
}

module.exports = Auth;
