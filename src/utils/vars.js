// Constants
const TWO_PI = Math.PI * 2;

const defaultImageWidth = 768;
const defaultImageHeight = 485;

// store variables
const store = {
	images: /** @type {HTMLImageElement[]} */ ([]),
	imageIndex: 0,
	image: /** @type {HTMLImageElement} */ (/** @type {unknown} */ (null)),
	imageWidth: 768,
	imageHeight: 485,
	vertices: /** @type {[number, number][]} */ ([]),
	indices: /** @type {number[]} */ ([]),
	fragments: /** @type {import('./types').Fragments} */ ([]),
	container: /** @type {HTMLElement} */ (/** @type {unknown} */ (null)),
	/** @type {[number, number]} */
	clickPosition: [defaultImageWidth * 0.5, defaultImageHeight * 0.5],
};

export { store, TWO_PI };
