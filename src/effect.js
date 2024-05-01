import { Signal } from 'signal-polyfill';

// let needsEnqueue = false;

// const w = new Signal.subtle.Watcher(() => {
// 	if (needsEnqueue) {
// 		needsEnqueue = false;
// 		queueMicrotask.enqueue(processPending);
// 	}
// });

// function processPending() {
// 	needsEnqueue = true;

// 	for (const s of w.getPending()) {
// 		s.get();
// 	}

// 	w.watch();
// }

// export function effect(callback) {
// 	let cleanup;

// 	const computed = new Signal.Computed(() => {
// 		typeof cleanup === 'function' && cleanup();
// 		cleanup = callback();
// 	});

// 	w.watch(computed);
// 	computed.get();

// 	return () => {
// 		w.unwatch(computed);
// 		typeof cleanup === 'function' && cleanup();
// 	};
// }

// This function would usually live in a library/framework, not application code
// NOTE: This scheduling logic is too basic to be useful. Do not copy/paste.
let pending = false;

let w = new Signal.subtle.Watcher(() => {
	if (!pending) {
		pending = true;
		queueMicrotask(() => {
			pending = false;
			for (let s of w.getPending()) s.get();
			w.watch();
		});
	}
});

// An effect effect Signal which evaluates to cb, which schedules a read of
// itself on the microtask queue whenever one of its dependencies might change
export function effect(cb) {
	let destructor;
	let c = new Signal.Computed(() => {
		destructor?.();
		destructor = cb();
	});
	w.watch(c);
	c.get();
	return () => {
		destructor?.();
		w.unwatch(c);
	};
}
