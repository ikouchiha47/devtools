const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bonjour = require('bonjour')();

const generateName = require('./babynames');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let scratchpadContents = [];

// discovered by mdns
let peers = new Map();

// discovered on single network
let devices = new Set();

app.use(express.static('public'));

app.get('/devices', (req, res) => {
	let allDevices = new Set(devices);
	console.log(devices);

	for (let peerDevices of peers.values()) {
		for (let device of peerDevices) {
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
	io.emit('newDevice', service);
});

// setInterval(() => {
// 	console.log(scratchpadContents);
// }, 2000)

io.on('connection', (socket) => {
	console.log('New client connected', socket.id);
	devices.add(socket.id);

	io.emit('updateDevices', Array.from(devices));

	// console.log(scratchpadContents);
	socket.emit('updateScratchpad', scratchpadContents);

	socket.on('updateScratchpad', (content) => {
		// validate types
		scratchpadContents.push(content);
		// make sure not to send the update to the
		// producer of the content
		io.emit('updateScratchpad', content);
	});

	// Handle client disconnection
	socket.on('disconnect', () => {
		devices.delete(socket.id);
		console.log('Client disconnected', devices.id);
		io.emit('updateDevices', Array.from(devices));
	});
});

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, HOST, () => {
	console.log(`Server is running on http://${HOST}:${PORT}`);
	bonjour.publish({ name: 'Scratchpad', type: 'http', port: PORT });
});

