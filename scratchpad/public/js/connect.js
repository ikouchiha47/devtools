(function() {
	let selectedObject = null;
	let canvas = null;

	function $(el, ctx) {
		return document.querySelector(el)
	}

	function $$(el, ctx) {
		return document.querySelectorAll(el)
	}

	function initCanvas() {
		canvas = new fabric.Canvas('canvas', {
			width: window.innerWidth * 0.8,
			height: window.innerHeight * 0.65,
			backgroundColor: '#f0f0f0',
			enablePointerEvents: true,
		});

		canvas.on('selection:created', (e) => {
			selectedObject = e.selected[0];
		});

		canvas.on('selection:cleared', () => {
			selectedObject = null;
		});

		let longPressTimer;
		let isCopying = false;

		canvas.on('mouse:down', (e) => {
			// console.log(e.target.type == 'i-text', "tits");
			if (e.target && e.target.type == 'i-text') {
				longPressTimer = setTimeout(() => {
					isCopying = true;
					copyTextToClipboard(e.target.text);
					alert('Text copied!');
				}, 1000);
			}
		});

		canvas.on('mouse:up', () => {
			clearTimeout(longPressTimer);
			setTimeout(() => {
				isCopying = false;
			}, 100);
		});
	}

	function renderDevices(devices) {
		const deviceList = document.getElementById('device-list');
		let html = devices.map(device => `<li>${device}</li>`).join('');
		deviceList.innerHTML = html;
	}

	function makeItemForTransport(type, content, left, top) {
		return { type, content, left, top }
	}
	function fromItemForTransport(data) {
		return [data.type, data.content, data.left, data.top];
	}

	function createItem(type, content, left, top) {
		let fabricObject;
		console.log("creating item")

		if (type === 'text') {
			fabricObject = new fabric.IText(content, {
				left: left,
				top: top,
				fontSize: 22,
				fill: '#000000',
				fontFamily: 'Quicksand',
				hasControls: false,
			});
		} else if (type === 'image') {
			fabric.Image.fromURL(content, (img) => {
				img.scale(0.5).set({
					left: left,
					top: top
				});
				canvas.add(img);
				canvas.renderAll();

				// Emit the new item to other clients
				// socket.emit('newItem', makeItem(type, content, left, top));
			});
			return;
		} else {
			return
		}

		canvas.add(fabricObject);
		canvas.renderAll();
	}

	document.addEventListener('DOMContentLoaded', () => {
		const socket = io();
		const scratchpad = $('#scratchpad');
		const status = $('#status');
		const addText = $("#addText")
		const imgUpload = $("#imageUpload")

		addText.addEventListener('click', () => {
			if (scratchpad.classList.contains('hidden')) {
				scratchpad.classList.remove('hidden')
			} else {
				scratchpad.classList.add('hidden')
			}
		})

		socket.on('updateDevices', (devices) => {
			renderDevices(devices)
		})

		socket.on('updateScratchpad', (data) => {
			// scratchpad.value = content;
			if (!data) return;

			const rendered = (response) => {
				if (!response) return;

				let args = fromItemForTransport(response)
				if (args.some(v => !!v == false) || args.length < 4) {
					console.log("malformed data ", args);
				}
				createItem.apply(null, args);
			}

			if (data.length && data.splice) {
				data.forEach(content => {
					rendered(content)
				})
			} else {
				rendered(data)
			}

			status.textContent = 'Content updated';
		});

		scratchpad.addEventListener('blur', () => {
			status.textContent = 'Saving...';
			let args = ['text', scratchpad.value, 50, 50]
			createItem.apply(null, args);

			socket.emit('updateScratchpad', makeItemForTransport.apply(null, args));

			status.textContent = 'All changes saved';
			scratchpad.value = '';
		});

		// Fetch the initial list of devices
		// Give it a second for the server to register
		setTimeout(() => {
			fetch('/devices')
				.then(response => response.json())
				.then(data => {
					console.log('Devices:', data);
					renderDevices(data);
				})
				.catch(error => {
					console.error('Error fetching devices:', error);
				});
		}, 500);

	});

	initCanvas();
})()
