(function() {
	document.addEventListener('DOMContentLoaded', () => {
		const socket = io();
		const scratchpad = document.getElementById('scratchpad');
		const status = document.getElementById('status');

		socket.on('updateDevices', (devices) => {
			renderDevices(devices)
		})

		socket.on('updateScratchpad', (content) => {
			scratchpad.value = content;
			status.textContent = 'Content updated';
		});

		scratchpad.addEventListener('input', () => {
			status.textContent = 'Saving...';
			socket.emit('updateScratchpad', scratchpad.value);
			status.textContent = 'All changes saved';
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

	function renderDevices(devices) {
		const deviceList = document.getElementById('device-list');
		let html = devices.map(device => `<li>${device}</li>`).join('');
		deviceList.innerHTML = html;
	}
})()
