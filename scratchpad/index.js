const express = require('express');
const http = require('http');
const auth = require('./auth');
const scractes = require("./data");

const socketIo = require('socket.io');
const bonjour = require('bonjour')();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let scratchpadContents = [];

// discovered by mdns
let peers = new Map();

// discovered on single network
// let devices = new Set();

app.use(express.static('public'));

app.get('/devices', (req, res) => {
	let allDevices = new Set(auth.devices().filter(d => d && d.authzed));

	// console.log(allDevices, auth.devices());

	for (let peerDevices of peers.values()) {
		for (let device of peerDevices) {
			if (device && device.authzed)
				allDevices.add(device);
		}
	}

	res.json([...allDevices]);
});

app.get('/scratchpad', (req, res) => {
	res.json({ content: scratchpadContents });
});

bonjour.find({ type: 'http' }, (service) => {
	if (!peers.has(service.name)) {
		peers.set(service.name, new Set());
	}

	// get the other devices form the api?
	// io.emit('newDevice', service);
});

// setInterval(() => {
// 	console.log(scratchpadContents);
// }, 2000)

// Two things:
// First:
// Need to validate a user with authentication code
// So assign the socket_id: { auth_code: '', authzed: true/false, user_name: }
// Second:
// Break down updateDevices into
// flushData (on new connection)
// upsertData 
// Third:
// Also handle position changes of components
// So, socket_id: {data: []}
// Each data would be, { type, top, left, content, fabricStuff: {} }

const removeObjAttribute = (obj, key) => {
	let _copy = { ...obj }
	delete _copy[key]
	return _copy;
}

const FishtownHookers = {
	__socket: null,

	init: function(socket) {
		this.__socket = socket;
		return this;
	},

	openPortal: function() {
		try {
			console.log(this.__socket.id, "socketid");

			let res = auth.init(this.__socket.id)
			console.log("auth code: ", res.authCode);

			return { stage: 'auth_pending' }
		} catch (e) {
			console.error("failed to get new connection", e);
			return { error: 'shit_went_south' }
		}
	},

	handleIdentity: function(response, onComplete, onError) {
		try {
			let { authCode } = response;
			auth.verify(this.__socket.id, authCode);

			console.log("user verified");
			onComplete(this.__socket, authCode)

		} catch (e) {
			if (e.message == 'dead') {
				console.error("failed verification", e);
				onError(this.__socket, { error: 'fuck_off' })
			}

			console.warn('too many people on boat')
			onError(this.__socket, { error: 'overcrowded' })
		}
	},
}

io.on('connection', (socket) => {
	console.log('New client connected', socket.id);
	// devices.add(socket.id);

	// lifecycle = FishtownHookers.init(socket)
	// lifecycle.openPortal('new_connection')
	// lifecycle.handleVerification('knock_knock', response, onComplete, onError)
	// lifecycle.addStuff('add_item')
	// lifecycle.handleDeregister('')

	const lifecycle = FishtownHookers.init(socket);

	const sendVerificationEvent = (sock, userData) => {
		let response = { data: removeObjAttribute(userData, 'authCode') }

		console.log(scractes.all(), "stuff");

		sock.emit('comeIn', response);
		sock.emit('flushAll', scractes.all());
		sock.broadcast.emit('dingDing', response);
	}

	const sendError = (sock, error) => {
		sock.emit('error', { error: error })
	}

	//openPortal
	socket.emit('newConnection', lifecycle.openPortal());

	// handleIdentity
	socket.on('knockKnock', (response) => {
		lifecycle.handleIdentity(response, sendVerificationEvent, sendError)
	});

	// io.emit('updateDevices', Array.from(devices));

	// console.log(scratchpadContents);
	// socket.emit('updateScratchpad', scratchpadContents);

	socket.on('updateScratchpad', ({ id, content }) => {
		try {
			//TODO: validate id with socket.id
			console.log("id matchers", id, socket.id);

			let isAuthzed = auth.isAuthz(socket.id)
			if (!isAuthzed) return { error: 'unauthorized' }

			scractes.create(id, content)
			socket.broadcast.emit('broadcastScratches', { id, content });

		} catch (e) {
			if (e.message == 'unauthorized') {
				console.error("Failed to find id", e);
				socket.emit('error', { error: 'unauthorized' })
			}
		}

		// validate types
		// scratchpadContents.push(content);
		// make sure not to send the update to the
		// producer of the content
		// io.emit('updateScratchpad', content);
	});

	// Handle client disconnection
	socket.on('disconnect', () => {
		try {
			auth.deregister(socket.id);
			// devices.delete(socket.id);
			// io.emit('updateDevices', Array.from(devices));
			console.log('Client disconnected', socket.id);
			socket.broadcast.emit('updateDevices', auth.devices);
		} catch (e) {
			console.error("Error disconnecting", e)
		}
	});
});

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, HOST, () => {
	console.log(`Server is running on http://${HOST}:${PORT}`);
	bonjour.publish({ name: 'Scratchpad', type: 'http', port: PORT });
});

