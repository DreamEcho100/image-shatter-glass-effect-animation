// first lesson

/*
5. Offscreen Canvas Rendering
You can use an offscreen canvas for heavy drawing tasks. This feature allows you to render graphics on a background thread.

Basic Usage of OffscreenCanvas
javascript
Copy code
if ('OffscreenCanvas' in window) {
    const offscreen = new OffscreenCanvas(256, 256);
    const ctx = offscreen.getContext('2d');
    // Draw something on the offscreen canvas
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 0, 50, 50);

    // Transfer to the main canvas
    const mainCanvas = document.getElementById('mainCanvas');
    const mainContext = mainCanvas.getContext('2d');
    const bitmap = offscreen.transferToImageBitmap();
    mainContext.drawImage(bitmap, 0, 0);
}
6. Web Workers for Heavy Computation
Web Workers allow you to run JavaScript in background threads. Using them for heavy image processing can keep your UI responsive.

Example of Using Web Workers
javascript
Copy code
// Create a new worker
const worker = new Worker('worker.js');

worker.onmessage = function(e) {
    console.log('Message from worker:', e.data);
};

worker.postMessage({
    type: 'process',
    imageData: '<image data here>'
});

// In worker.js
self.onmessage = function(e) {
    if (e.data.type === 'process') {
        // Process data
        const result = processData(e.data.imageData);
        postMessage(result);
    }
};
*/

import './style.css';
import '//cdnjs.cloudflare.com/ajax/libs/gsap/1.13.2/TweenMax.min.js';

/**
 * Debounces a function to limit the rate at which it is called.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
function debounce(func, delay) {
	/** @type {number | undefined} */
	let timeoutId;
	/** @param {any[]} args */
	return function (...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			// @ts-ignore
			func.apply(this, args);
		}, delay);
	};
}

const app = /** @type {HTMLDivElement | null} */ (document.querySelector('#app'));

if (!app) {
	throw new Error('App not found');
}

app.innerHTML = `
  <div>
    <div>
			<style>
					#canvas {
							width: 768px;
							/* height: 485px; */
							border: 1px solid black;
							aspect-ratio: 16 / 9;
					}
			</style>
			<canvas id="canvas"></canvas>
    </div>
  </div>
`;

const canvas = /** @type {HTMLCanvasElement | null} */ (document.getElementById('canvas'));
if (!canvas) {
	throw new Error('Canvas not found');
}

const ctx = canvas.getContext('2d');

if (!canvas || !ctx) {
	throw new Error('Canvas not supported');
}

const imageSources = [
	'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/crayon.jpg',
	'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/spaceship.jpg',
	'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/dj.jpg',
	'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/chicken.jpg',
];

/**
 * Load images and call callback when all images are loaded
 * @param {string[]} sources - Array of image URLs
 * @param {(images: Record<string, HTMLImageElement>) => void} callback - Callback function to call when all images are loaded
 * @param {(errorMessage: string) => void} errorCallback - Callback function to call when there is an error loading images
 * @returns {void}
 */
function loadImages(sources, callback, errorCallback) {
	/** @type {Record<string, HTMLImageElement>} */
	let images = {};
	let loadedCount = 0;
	let numImages = sources.length;

	// Loop through sources to load images
	sources.forEach(function (source) {
		const image = new Image();
		image.onload = function () {
			if (++loadedCount >= numImages) {
				callback(images); // When all images are loaded, call callback
			}
		};

		image.onerror = function (err) {
			errorCallback(`${err}, Failed to load image at ${source}`);
		};
		image.src = source;
		images[source] = image;
	});
}

document.addEventListener('DOMContentLoaded', function () {
	// const images = document.querySelectorAll('img.lazy-load');
	const config = {
		rootMargin: '50px 0px', // Load images 50px before they come into view
		threshold: 0.01,
	};

	const observer = new IntersectionObserver(function (entries, self) {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				// Load images and process after all are loaded
				loadImages(
					imageSources,
					(images) => {
						// All images are loaded
						// Example: draw all images
						Object.keys(images).forEach((key) => {
							ctx.drawImage(images[key], 0, 0, canvas.width, canvas.height); // Adjust size and position as needed
						});
					},
					console.error,
				);

				// Update resizeCanvas to use debounce
				const debouncedResizeCanvas = debounce(resizeCanvas, 300); // Adjust delay as needed

				// Attach debounced resize event listener
				window.addEventListener('resize', function () {
					debouncedResizeCanvas(canvas, ctx);
				});

				self.unobserve(entry.target);
			}
		});
	}, config);

	observer.observe(canvas);
});

/**
 *
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 */
function resizeCanvas(canvas, ctx) {
	// canvas.width = window.innerWidth;
	// canvas.height = window.innerHeight;
	// ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	loadImages(
		imageSources,
		(images) => {
			// All images are loaded
			// Example: draw all images
			Object.keys(images).forEach((key, index) => {
				ctx.drawImage(
					images[key],
					// index * 100, 0, 200, 200
					0,
					0,
					canvas.width,
					canvas.height,
				); // Adjust size and position as needed
			});
		},
		console.error,
	);
}
