/**
 * Represents a Fragment of an image.
 * @constructor
 * @param {[number, number]} v0 - Vertex 0.
 * @param {[number, number]} v1 - Vertex 1.
 * @param {[number, number]} v2 - Vertex 2.
 */
class Fragment {
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

		this.computeBoundingBox();
		this.computeCentroid();
		this.createCanvas();
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
			w: xMax - xMin,
			h: yMax - yMin,
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
		this.canvas.width = this.box.w;
		this.canvas.height = this.box.h;
		this.canvas.style.width = this.box.w + 'px';
		this.canvas.style.height = this.box.h + 'px';
		this.canvas.style.left = this.box.x + 'px';
		this.canvas.style.top = this.box.y + 'px';
		const ctx = this.canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Canvas context is null');
		}

		this.ctx = ctx;
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
		this.ctx.drawImage(image, 0, 0);
	}
}

/**
 * Represents a point in 2D space.
 * @typedef {number[]} Point
 */

/**
 * Represents an array of vertices.
 * @typedef {Point[]} Vertices
 */

/**
 * Represents an array of triangle indices.
 * @typedef {number[]} Indices
 */

/**
 * Represents an array of fragments.
 * @typedef {Fragment[]} Fragments
 */

/**
 * Represents an array of rings.
 * @typedef {Object[]} Rings
 * @property {number} r - Radius of the ring.
 * @property {number} c - Count of vertices in the ring.
 */

/**
 * Triangulates the image based on click position.
 */
function triangulate() {
	/** @type {Rings} */
	const rings = [
		{ r: 50, c: 12 },
		{ r: 150, c: 12 },
		{ r: 300, c: 12 },
		{ r: 1200, c: 12 }, // very large in case of corner clicks
	];

	let x, y;
	const centerX = clickPosition[0];
	const centerY = clickPosition[1];

	vertices.push([centerX, centerY]);

	rings.forEach((ring) => {
		const radius = ring.r;
		const count = ring.c;
		const variance = radius * 0.25;

		for (let i = 0; i < count; i++) {
			x = Math.cos((i / count) * TWO_PI) * radius + centerX + randomRange(-variance, variance);
			y = Math.sin((i / count) * TWO_PI) * radius + centerY + randomRange(-variance, variance);
			vertices.push([x, y]);
		}
	});

	vertices.forEach((v) => {
		v[0] = clamp(v[0], 0, imageWidth);
		v[1] = clamp(v[1], 0, imageHeight);
	});

	indices = Delaunay.triangulate(vertices);
}

/**
 * Shatters the image into fragments.
 */
function shatter() {
	let p0, p1, p2, fragment;

	const tl0 = new TimelineMax({ onComplete: shatterCompleteHandler });

	for (let i = 0; i < indices.length; i += 3) {
		p0 = vertices[indices[i + 0]];
		p1 = vertices[indices[i + 1]];
		p2 = vertices[indices[i + 2]];

		fragment = new Fragment(p0, p1, p2);

		const dx = fragment.centroid[0] - clickPosition[0];
		const dy = fragment.centroid[1] - clickPosition[1];
		const d = Math.sqrt(dx * dx + dy * dy);
		const rx = 30 * sign(dy);
		const ry = 90 * -sign(dx);
		const delay = d * 0.003 * randomRange(0.9, 1.1);
		fragment.canvas.style.zIndex = Math.floor(d).toString();

		const tl1 = new TimelineMax();

		tl1.to(fragment.canvas, 1, {
			z: -500,
			rotationX: rx,
			rotationY: ry,
			ease: Cubic.easeIn,
		});
		tl1.to(fragment.canvas, 0.4, { alpha: 0 }, 0.6);

		tl0.insert(tl1, delay);

		fragments.push(fragment);
		canvas.appendChild(fragment.canvas);
	}

	canvas.removeChild(image);
	image.removeEventListener('click', imageClickHandler);
}

/**
 * Handles the completion of shattering animation.
 */
function shatterCompleteHandler() {
	// add pooling?
	fragments.forEach((f) => {
		canvas.removeChild(f.canvas);
	});
	fragments.length = 0;
	vertices.length = 0;
	indices.length = 0;

	placeImage();
}

// Constants
const TWO_PI = Math.PI * 2;

// Variables
/** @type {HTMLImageElement[]} */
let images = [];
let imageIndex = 0;
/** @type {HTMLImageElement} */
let image;
const imageWidth = 768;
const imageHeight = 485;
/** @type {[number, number][]} */
let vertices = [];
/** @type {number[]} */
let indices = [];
/** @type {Fragments} */
let fragments = [];
const canvas = document.querySelector('canvas');

if (!canvas) {
	throw new Error('Container is null');
}

/** @type {[number, number]} */
const clickPosition = [imageWidth * 0.5, imageHeight * 0.5];

// Event listener for window.onload
window.onload = function () {
	TweenMax.set(canvas, { perspective: 500 });

	// URLs of images
	const urls = [
		'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/crayon.jpg',
		'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/spaceship.jpg',
		'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/dj.jpg',
		'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/chicken.jpg',
	];
	let loaded = 0;

	// Load images
	urls.forEach((url, index) => {
		images[index] = new Image();
		/** @type {HTMLImageElement} */ (images[index]).onload = function () {
			if (++loaded === 1) {
				imagesLoaded();
				for (let i = 1; i < 4; i++) {
					images[i] = new Image();
					/** @type {HTMLImageElement} */ (images[i]).src = urls[i];
				}
			}
		};
		/** @type {HTMLImageElement} */ (images[index]).src = url;
	});
};

/**
 * Handles the loaded images.
 */
function imagesLoaded() {
	placeImage(false);
	triangulate();
	shatter();
}

/**
 * Places the image.
 * @param {boolean} [transitionIn=true] - Whether to apply transition animation.
 */
function placeImage(transitionIn = true) {
	image = images[imageIndex];

	if (++imageIndex === images.length) imageIndex = 0;

	image.addEventListener('click', imageClickHandler);
	canvas.appendChild(image);

	if (transitionIn !== false) {
		TweenMax.fromTo(image, 0.75, { y: -1000 }, { y: 0, ease: Back.easeOut });
	}
}

/**
 * Handles the click event on the image.
 * @param {MouseEvent} event - The click event.
 */
function imageClickHandler(event) {
	const box = image.getBoundingClientRect();
	const top = box.top;
	const left = box.left;

	clickPosition[0] = event.clientX - left;
	clickPosition[1] = event.clientY - top;

	triangulate();
	shatter();
}

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
