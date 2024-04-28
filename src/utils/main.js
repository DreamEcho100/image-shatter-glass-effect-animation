import '../style.css';
import Delaunator from 'delaunator';
import { gsap, Cubic, Back } from 'gsap';
import { TWO_PI, store } from './vars';
import { Fragment } from './Fragment';
// import '//cdnjs.cloudflare.com/ajax/libs/gsap/1.13.2/TweenMax.min.js';
// import 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/delaunay.js';

/**
 * Triangulates the image based on click position.
 */
function triangulate() {
	/** @type {import('./types').Rings} */
	const rings = [
		{ r: 50, c: 12 },
		{ r: 150, c: 12 },
		{ r: 300, c: 12 },
		{ r: 1200, c: 12 }, // very large in case of corner clicks
	];

	let x, y;
	const centerX = store.clickPosition[0];
	const centerY = store.clickPosition[1];

	store.vertices.push([centerX, centerY]);

	rings.forEach((ring) => {
		const radius = ring.r;
		const count = ring.c;
		const variance = radius * 0.25;

		for (let i = 0; i < count; i++) {
			x = Math.cos((i / count) * TWO_PI) * radius + centerX + randomRange(-variance, variance);
			y = Math.sin((i / count) * TWO_PI) * radius + centerY + randomRange(-variance, variance);
			store.vertices.push([x, y]);
		}
	});

	store.vertices.forEach((v) => {
		v[0] = clamp(v[0], 0, store.imageWidth);
		v[1] = clamp(v[1], 0, store.imageHeight);
	});

	store.indices = [...new Delaunator(store.vertices.flat()).triangles];
	// Delaunay.triangulate
}

/**
 * Shatters the image into fragments.
 */
function shatter() {
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

		const dx = fragment.centroid[0] - store.clickPosition[0];
		const dy = fragment.centroid[1] - store.clickPosition[1];
		const d = Math.sqrt(dx * dx + dy * dy);
		const rx = 30 * sign(dy);
		const ry = 90 * -sign(dx);
		const delay = d * 0.003 * randomRange(0.9, 1.1);
		fragment.canvas.style.zIndex = Math.floor(d).toString();

		const tl1 = gsap.timeline();

		tl1.to(fragment.canvas, 0.6, {
			z: -500,
			rotationX: rx,
			rotationY: ry,
			ease: Cubic.easeIn,
		});
		tl1.to(fragment.canvas, 0.2, { alpha: 0 }, 0.5);

		tl0.add(tl1, delay);

		store.fragments.push(fragment);
		store.container.appendChild(fragment.canvas);
	}

	store.container.removeChild(store.image);
	store.image.removeEventListener('click', imageClickHandler);
}

/**
 * Handles the completion of shattering animation.
 */
function shatterCompleteHandler() {
	// add pooling?
	store.fragments.forEach((f) => {
		store.container.removeChild(f.canvas);
	});
	store.fragments.length = 0;
	store.vertices.length = 0;
	store.indices.length = 0;

	placeImage();
}

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
	store.image = store.images[store.imageIndex];

	if (++store.imageIndex === store.images.length) store.imageIndex = 0;

	store.image.addEventListener('click', imageClickHandler);
	store.container.appendChild(store.image);

	if (transitionIn !== false) {
		gsap.fromTo(store.image, 0.75, { y: -1000 }, { y: 0, ease: Back.easeOut });
	}
}

/**
 * Handles the click event on the image.
 * @param {MouseEvent} event - The click event.
 */
function imageClickHandler(event) {
	const box = store.image.getBoundingClientRect();
	const top = box.top;
	const left = box.left;

	store.clickPosition[0] = event.clientX - left;
	store.clickPosition[1] = event.clientY - top;

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

export function setup() {
	// Event listener for window.onload
	document.addEventListener('DOMContentLoaded', () => {
		store.container = /** @type {HTMLElement} */ (document.getElementById('container'));

		if (!store.container) {
			throw new Error('Container is null');
		}

		gsap.set(store.container, { perspective: 500 });

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
			store.images[index] = new Image();
			/** @type {HTMLImageElement} */ (store.images[index]).onload = function () {
				if (++loaded === 1) {
					imagesLoaded();
					for (let i = 1; i < 4; i++) {
						store.images[i] = new Image();
						/** @type {HTMLImageElement} */ (store.images[i]).src = urls[i];
					}
				}
			};
			/** @type {HTMLImageElement} */ (store.images[index]).src = url;
		});
	});
}
