import { store } from './vars';

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
		this.ctx.drawImage(store.image, 0, 0);
	}
}
