import { Fragment } from './Fragment';

/**
 * Represents a point in 2D space.
 * This is an array where typically the first element represents the x-coordinate
 * and the second element represents the y-coordinate.
 */
export type Point = number[];

/**
 * Represents an array of vertices.
 * Each vertex is a point in 2D space.
 */
export type Vertices = Point[];

/**
 * Represents an array of triangle indices.
 * Typically used to index into a list of vertices to define the corners of triangles.
 */
export type Indices = number[];

/**
 * Represents an array of fragments.
 * Details of `Fragment` export type should be defined elsewhere as per requirement.
 */
export type Fragments = Fragment[];

/**
 * Represents a ring in 2D space.
 */
interface Ring {
	/** Radius of the ring. */
	r: number;

	/** Count of vertices in the ring. */
	c: number;
}

/**
 * Represents an array of rings.
 * Each entry in the array is an object describing a ring with specific properties.
 */
export type Rings = Ring[];
