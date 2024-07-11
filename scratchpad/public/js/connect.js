(function() {
	let selectedObject = null;
	let canvas = null;
	let lastLeft = 50;
	let lastTop = 50;
	let itemSpacing = 30; // Distance between items

	const themes = {
		dark: { bgColor: '#000', fgColor: '#fff' },
		bright: { bgColor: 'rgb(249, 245, 242)', fgColor: '#000' },
	}

	let currentTheme = localStorage.getItem('_scratchpad_theme_') || 'bright';

	function $(el, ctx) {
		return document.querySelector(el)
	}

	function $$(el, ctx) {
		return document.querySelectorAll(el)
	}

	function adjustCanvasSize(newItem) {
		let canvasWidth = canvas.getWidth();
		let canvasHeight = canvas.getHeight();

		// console.log(newItem.width, newItem.left, canvasWidth);
		if (!newItem) { return; }

		if (newItem.left + newItem.width > canvasWidth) {
			canvas.setWidth(newItem.left + newItem.width + 50); // Add some extra space
		}

		if (newItem.top + newItem.height > canvasHeight) {
			canvas.setHeight(newItem.top + newItem.height + 50); // Add some extra space
		}

		canvas.renderAll();
	}

	function initCanvas() {
		canvas = new fabric.Canvas('canvas', {
			width: window.innerWidth * 0.8,
			height: window.innerHeight * 0.65,
			backgroundColor: themes[currentTheme].bgColor,
			enablePointerEvents: true,
		});

		canvas.on('selection:created', (e) => {
			selectedObject = e.selected[0];
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

			let evt = e.e;
			if (evt.altKey === true) {
				isPanning = true;
				lastPosX = evt.clientX;
				lastPosY = evt.clientY;
			}

			adjustCanvasSize(selectedObject)
		});

		canvas.on('mouse:up', () => {
			isPanning = false;
			clearTimeout(longPressTimer);
			setTimeout(() => {
				isCopying = false;
			}, 100);
		});

		canvas.on('mouse:wheel', (opt) => {
			let delta = opt.e.deltaY;
			let zoom = canvas.getZoom();
			zoom = zoom + delta / 200;
			if (zoom > 3) zoom = 3;
			if (zoom < 0.5) zoom = 0.5;
			canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
			opt.e.preventDefault();
			opt.e.stopPropagation();
		});

		let isPanning = false;
		let lastPosX = 0;
		let lastPosY = 0;

		// canvas.on('mouse:down', (opt) => {
		// 	let evt = opt.e;
		// 	if (evt.altKey === true) {
		// 		isPanning = true;
		// 		lastPosX = evt.clientX;
		// 		lastPosY = evt.clientY;
		// 	}
		//
		// 	adjustCanvasSize(fabricObject)
		// });

		canvas.on('mouse:move', (opt) => {
			if (isPanning) {
				let e = opt.e;
				let vpt = canvas.viewportTransform;
				vpt[4] += e.clientX - lastPosX;
				vpt[5] += e.clientY - lastPosY;
				canvas.requestRenderAll();
				lastPosX = e.clientX;
				lastPosY = e.clientY;
			}
		});

		canvas.on('mouse:up', () => {
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

	function toss(options) {
		let choice = Math.floor(Math.random() * options.length) % options.lenth;
		return options[choice]
	}

	function createItem(type, content, left, top) {
		let fabricObject;
		console.log("creating item")

		if (type === 'text') {
			fabricObject = new fabric.IText(content, {
				left: left,
				top: top,
				fontSize: 22,
				fill: themes[currentTheme].fgColor,
				fontFamily: 'Quicksand',
				hasControls: true,
			});

			// console.log("wh", fabricObject.width, fabricObject.height);

			if (toss(['left', 'top']) == 'left') {
				lastLeft = left + fabricObject.width + itemSpacing;
				lastTop = top + itemSpacing;
			} else {
				lastLeft = left + itemSpacing;
				lastTop = top + fabricObject.height + itemSpacing;
			}
		} else if (type === 'image') {
			fabric.Image.fromURL(content, (img) => {
				img.scale(0.5).set({
					left: left,
					top: top
				});
				canvas.add(img);
				canvas.renderAll();

				if (toss(['left', 'top']) == 'left') {
					lastLeft = left + img.width * img.scaleX + itemSpacing;
					lastTop = top + itemSpacing;
				} else {
					lastLeft = left + itemSpacing;
					lastTop = top + img.height * img.scaleY + itemSpacing;
				}
				// Emit the new item to other clients
				// socket.emit('newItem', makeItem(type, content, left, top));
				adjustCanvasSize(fabricObject)
			});
			return;
		} else {
			return
		}
		canvas.add(fabricObject);
		canvas.renderAll();
		adjustCanvasSize(fabricObject)
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
			let args = ['text', scratchpad.value, lastLeft, lastTop]
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
