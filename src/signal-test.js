import { Signal } from 'signal-polyfill';
import { effect } from './effect';

/** @param {HTMLElement} container  */
export function setupCounterExample(container) {
	container.innerHTML = `<div class="flex flex-col gap-4 items-center justify-center">
	<div class="flex flex-wrap gap-4 capitalize">
	<button class='bg-slate-800 px-4 py-2 rounded-lg font-semibold' id='decrement-counter-button' type="button" title='decrement'>-</button>
	<button class='bg-slate-800 px-4 py-2 rounded-lg font-semibold' id='reset-counter-button' type="button">reset</button>
	<button class='bg-slate-800 px-4 py-2 rounded-lg font-semibold' id='increment-counter-button' type="button" title='increment'>+</button>
	</div>
	<p>{<span id='counter'>0</span>} is: <span id='parity' class='w-[4ch] inline-block'></span></p>
</div>`;

	const incrementCounterButton = container.querySelector('#increment-counter-button');
	const resetCounterButton = container.querySelector('#reset-counter-button');
	const decrementCounterButton = container.querySelector('#decrement-counter-button');

	const counterDisplay = container.querySelector('#counter');
	const parityDisplay = container.querySelector('#parity');
	if (!incrementCounterButton || !resetCounterButton || !decrementCounterButton || !counterDisplay || !parityDisplay) {
		throw new Error('Elements not found');
	}

	const counter = new Signal.State(0);
	const isEven = new Signal.Computed(() => (counter.get() & 1) == 0);
	const parity = new Signal.Computed(() => (isEven.get() ? 'even' : 'odd'));

	incrementCounterButton.addEventListener('click', () => counter.set(counter.get() + 1));
	resetCounterButton.addEventListener('click', () => counter.set(0));
	decrementCounterButton.addEventListener('click', () => counter.set(counter.get() - 1));

	effect(() => {
		console.log(parity.get());
		counterDisplay.textContent = counter.get().toString();
		parityDisplay.textContent = parity.get();
	});
}
