import './style.css';
/**
 * Represents a ring in 2D space.
 * @typedef {Object} Ring
 * @property {number} r - Radius of the ring.
 * @property {number} c - Count of vertices in the ring.
 */
// import { setupCounterExample } from './signal-test';
// import { setupShatterExample2 } from './shatter-example-2';

const container = /** @type {HTMLDivElement | null} */ (document.querySelector('#app'));

if (!container) {
	throw new Error('App not found');
}

// https://picsum.photos/400/300

container.innerHTML = `
<style>
	body {
			background-color: #000;
			margin: 0;
		}
	
		#info {
				color: white;
				font-family: monospace;
		}
		
		canvas {
				position: absolute;
				backface-visibility: hidden;
				-webkit-backface-visibility: hidden;
				-moz-backface-visibility: hidden;
				-ms-backface-visibility: hidden;
		}
		
		img {
				cursor: pointer;
				object-fit: cover;
				width: 100%;
				height: 100%;
				object-position: center;
		}
		
		#container {
				width: 485px;
				height: 485px;
				margin: auto;
				max-width: 100%;
				
		}
	</style>
	<div class='overflow-hidden'>
		<div id="container"></div>
	</div>
	`;

import Delaunator from 'delaunator';
import { gsap, Cubic } from 'gsap';
import html2canvas from 'html2canvas-pro';

// Constants
const TWO_PI = Math.PI * 2;

const defaultImageWidth = 485;
const defaultImageHeight = 485;

// store variables
const store = {
	images: /** @type {HTMLImageElement[]} */ ([]),
	imageIndex: 0,
	image: /** @type {HTMLImageElement} */ (/** @type {unknown} */ (null)),
	imageWidth: defaultImageWidth,
	imageHeight: defaultImageWidth,
	vertices: /** @type {[number, number][]} */ ([]),
	indices: /** @type {number[]} */ ([]),
	fragments: /** @type {Fragment[]} */ ([]),
	container: /** @type {HTMLElement} */ (/** @type {unknown} */ (null)),
	/** @type {[number, number]} */
	clickPosition: [defaultImageWidth * 0.5, defaultImageHeight * 0.5],
	/** @type {'in' | 'out'} */
	shatterType: 'out',
};

// Math utility functions

/**
 * Generates a random number within the specified range.
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @returns {number} - Random number within the specified range.
 */
function randomRange(min, max) {
	return min + (max - min) * Math.random();
}

/**
 * Clamps a value within the specified range.
 * @param {number} x - Value to clamp.
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @returns {number} - Clamped value.
 */
function clamp(x, min, max) {
	return x < min ? min : x > max ? max : x;
}

/**
 * Determines the sign of a number.
 * @param {number} x - Input number.
 * @returns {number} - Sign of the number (-1, 0, or 1).
 */
function sign(x) {
	return x < 0 ? -1 : x > 0 ? 1 : 0;
}

/**
 * Represents a Fragment of an image.
 * @constructor
 * @param {[number, number]} v0 - Vertex 0.
 * @param {[number, number]} v1 - Vertex 1.
 * @param {[number, number]} v2 - Vertex 2.
 */
export class Fragment {
	/** @type {[number, number]} */
	centroid = [0, 0];
	/** @type {HTMLCanvasElement} */
	canvas = /** @type {HTMLCanvasElement} */ (/** @type {unknown} */ (null));
	/** @type {CanvasRenderingContext2D} */
	ctx = /** @type {CanvasRenderingContext2D} */ (/** @type {unknown} */ (null));
	/** @type {{ x: number; y: number; w: number; h: number }} */
	box = { x: 0, y: 0, w: 0, h: 0 };

	/**
	 * Creates an instance of Fragment.
	 * @param {[number, number]} v0 - Vertex 0.
	 * @param {[number, number]} v1 - Vertex 1.
	 * @param {[number, number]} v2 - Vertex 2.
	 */
	constructor(v0, v1, v2) {
		this.v0 = v0;
		this.v1 = v1;
		this.v2 = v2;

		this.box = {
			x: 0,
			y: 0,
			w: 0,
			h: 0,
		};
		this.ctx = /** @type {CanvasRenderingContext2D} */ (/** @type {unknown} */ (null));

		this.createCanvas();
		this.computeBoundingBox();
		this.computeCentroid();
		this.setupCanvasDimensions();
		this.clip();
	}

	/**
	 * Computes the bounding box of the fragment.
	 */
	computeBoundingBox() {
		const xMin = Math.min(this.v0[0], this.v1[0], this.v2[0]);
		const xMax = Math.max(this.v0[0], this.v1[0], this.v2[0]);
		const yMin = Math.min(this.v0[1], this.v1[1], this.v2[1]);
		const yMax = Math.max(this.v0[1], this.v1[1], this.v2[1]);

		this.box = {
			x: xMin,
			y: yMin,
			w: xMax - xMin + 1,
			h: yMax - yMin + 1,
		};
	}

	/**
	 * Computes the centroid of the fragment.
	 */
	computeCentroid() {
		const x = (this.v0[0] + this.v1[0] + this.v2[0]) / 3;
		const y = (this.v0[1] + this.v1[1] + this.v2[1]) / 3;

		this.centroid = [x, y];
	}

	/**
	 * Creates a canvas for the fragment.
	 */
	createCanvas() {
		this.canvas = document.createElement('canvas');
		const ctx = this.canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Canvas context is null');
		}

		this.ctx = ctx;
	}

	/**
	 * Creates a canvas for the fragment.
	 */
	setupCanvasDimensions() {
		this.canvas.width = this.box.w;
		this.canvas.height = this.box.h;
		this.canvas.style.width = this.box.w + 'px';
		this.canvas.style.height = this.box.h + 'px';
		this.canvas.style.left = this.box.x + 'px'; // Adjust to use the bounding box position
		this.canvas.style.top = this.box.y + 'px'; // Adjust to use the bounding box position
	}

	/**
	 * Clips the fragment based on its vertices.
	 */
	clip() {
		this.ctx.translate(-this.box.x, -this.box.y);
		this.ctx.beginPath();
		this.ctx.moveTo(this.v0[0], this.v0[1]);
		this.ctx.lineTo(this.v1[0], this.v1[1]);
		this.ctx.lineTo(this.v2[0], this.v2[1]);
		this.ctx.closePath();
		this.ctx.clip();
		this.ctx.drawImage(store.image, 0, 0);
	}
}

/**
 * Triangulates the image based on click position.
 */
function triangulate() {
	/** @type {{ r: number; c: number; }[]} */
	const rings = [
		// { r: 50, c: 21 },
		// { r: 150, c: 21 },
		// { r: 300, c: 21 },
		{ r: 600, c: 52 },
		// { r: Math.min(store.imageWidth, store.imageHeight) / 2, c: 21 },
		// { r: Math.max(store.imageWidth, store.imageHeight) / 2, c: 21 },
		{ r: 100, c: 104 }, // very large in case of corner clicks
		{ r: 1200, c: 21 }, // very large in case of corner clicks
	];

	let x, y;
	const centerX = store.clickPosition[0];
	const centerY = store.clickPosition[1];
	// Calculate aspect ratio of the image

	store.vertices = []; // Clear previous vertices

	store.vertices.push([centerX, centerY]);

	for (const ring of rings) {
		const radius = ring.r;
		const count = ring.c;
		const variance = radius * 0.25;

		for (let i = 0; i < count; i++) {
			x = Math.cos((i / count) * TWO_PI) * radius + centerX + randomRange(-variance, variance);
			y = Math.sin((i / count) * TWO_PI) * radius + centerY + randomRange(-variance, variance);
			store.vertices.push([x, y]);
		}
	}

	for (let i = 0; i < store.vertices.length; i++) {
		const vertex = store.vertices[i];
		vertex[0] = clamp(vertex[0], 0, store.imageWidth);
		vertex[1] = clamp(vertex[1], 0, store.imageHeight);
	}

	store.indices = [...new Delaunator(store.vertices.flat()).triangles];
}

/**
 * Shatters the image into fragments.
 * @param {HTMLImageElement} image - The image to shatter.
 */
function shatter(image) {
	let p0,
		p1,
		p2,
		/** @type {Fragment} */
		fragment;

	const tl0 = gsap.timeline({ onComplete: shatterCompleteHandler });

	for (let i = 0; i < store.indices.length; i += 3) {
		p0 = store.vertices[store.indices[i + 0]];
		p1 = store.vertices[store.indices[i + 1]];
		p2 = store.vertices[store.indices[i + 2]];

		fragment = new Fragment(p0, p1, p2);

		const dPadding = 2;
		const dx = fragment.centroid[0] - store.clickPosition[0] + dPadding;
		const dy = fragment.centroid[1] - store.clickPosition[1] + dPadding;
		const d = Math.sqrt(dx * dx + dy * dy);
		const rx = 30 * sign(dy);
		const ry = 90 * -sign(dx);
		const delay = d * 0.003 * randomRange(0.01, 0.1);

		/** @type {number} */
		let zIndex;
		/** @type {string | undefined} */
		let posX;
		/** @type {string | undefined} */
		let posY;

		const transitionDuration = randomRange(0.5, 1.1) + 0.2;
		const transitionDurationPadding = 0.2;
		const opacityDuration = transitionDuration * 0.95;
		const opacityDelay = transitionDuration * 0.75;

		switch (store.shatterType) {
			case 'in': {
				zIndex = -500;
				break;
			}

			default: {
				zIndex = store.indices.length - i;
				posX = '+=0' + dx;
				posY = '+=0' + dy;
				break;
			}
		}

		fragment.canvas.style.zIndex = Math.floor(zIndex).toString();

		const tl1 = gsap.timeline();

		tl1.to(fragment.canvas, transitionDuration + transitionDurationPadding, {
			z: zIndex,
			x: posX,
			y: posY,
			rotationX: rx,
			rotationY: ry,
			ease: Cubic.easeInOut,
			delay: 0.1,
		});
		tl1.to(fragment.canvas, opacityDuration, { alpha: 0 }, opacityDelay);

		tl0.add(tl1, delay);

		store.fragments.push(fragment);
		store.container.appendChild(fragment.canvas);
	}

	image.parentElement?.removeChild(image);
	image.removeEventListener('click', imageClickHandler);
}

/**
 * Handles the completion of shattering animation.
 */
function shatterCompleteHandler() {
	// add pooling?
	for (const fragment of store.fragments) {
		store.container.removeChild(fragment.canvas);
	}

	store.fragments.length = 0;
	store.vertices.length = 0;
	store.indices.length = 0;
}

/**
 * Places the image.
 * @param {boolean} [transitionIn=true] - Whether to apply transition animation.
 */
function placeImage(transitionIn = true) {
	store.image = new Image();
	store.image.src = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/dj.jpg';

	store.image.style.width = '485px';
	store.image.style.height = '485px';

	store.image.addEventListener('click', imageClickHandler);
	store.container.appendChild(store.image);

	if (store.image.complete) {
		setupPlacedImage(transitionIn);
	} else {
		store.image.onload = () => setupPlacedImage(transitionIn);
	}
}

/** @param {boolean} transitionIn  */
function setupPlacedImage(transitionIn) {
	store.imageWidth = store.image.offsetWidth;
	store.imageHeight = store.image.offsetHeight;
}

/**
 * Handles the click event on the image.
 * @param {MouseEvent} event - The click event.
 */
async function imageClickHandler(event) {
	const screenshotDataURL = await takeScreenshot(store.container);

	store.image.src = screenshotDataURL;

	store.imageWidth = store.image.offsetWidth;
	store.imageHeight = store.image.offsetHeight;

	const box = store.image.getBoundingClientRect();
	const top = box.top;
	const left = box.left;

	store.clickPosition[0] = event.clientX - left;
	store.clickPosition[1] = event.clientY - top;

	triangulate();
	shatter(store.image);
}

const urls = [
	'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/crayon.jpg',
	'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/spaceship.jpg',
	'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/dj.jpg',
	'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/chicken.jpg',
];
export function setup() {
	document.addEventListener('DOMContentLoaded', () => {
		store.container = /** @type {HTMLElement} */ (document.getElementById('container'));

		if (!store.container) {
			throw new Error('Container is null');
		}

		// gsap.set(store.container, { perspective: 500 });
		store.container.style.perspective = '500px';

		placeImage();
	});
}

/**
 * Takes a screenshot of the container element and sets it as the image source.
 * @param {HTMLElement} containerElement - The container element to take a screenshot of.
 */
async function takeScreenshot(containerElement) {
	/** @type {string[]} */
	const urlsToFetch = [];
	if ('src' in containerElement && typeof containerElement.src === 'string') {
		urlsToFetch.push(containerElement.src);
	}

	containerElement.querySelectorAll('img').forEach((img) => {
		if ('src' in img && typeof img.src === 'string') {
			urlsToFetch.push(img.src);
		}
	});

	await Promise.all(urlsToFetch.map((url) => fetch(url, { cache: 'no-cache' })));

	// https://github.com/niklasvh/html2canvas/issues/1544#issuecomment-1270605870
	return html2canvas(containerElement, {
		allowTaint: true,
		useCORS: true,
		logging: true,
		// proxy
	}).then((canvas) => {
		// Get the data URL representation of the canvas
		const img = canvas.toDataURL('image/png');
		// .replace(/^data:image\/jpg/, 'data:application/octet-stream');
		return img;
	});
}

setup();
