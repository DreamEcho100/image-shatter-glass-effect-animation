/** @param {HTMLDivElement} container  */
export function setupShatterExample2(container) {
	container.innerHTML = `<div class="flex flex-col gap-4 items-center justify-center w-full h-full>
	<p class="text-lg">This is a minimal example of an image shatter effect</p>
	<div class="flex gap-4">
		<button class="bg-slate-800 px-4 py-2 rounded-lg font-semibold" id="shatter-button" type="button">Shatter</button>
		<button class="bg-slate-800 px-4 py-2 rounded-lg font-semibold" id="reset-button" type="button">Reset</button>
	</div>
	<div id="image-container" class="w-full h-full relative">
		<img id="image" src="https://picsum.photos/400/300" alt="Random image" class="w-full h-full object-cover" />
	</div>
</div>`;

	const imageContainer = container.querySelector('#image-container');
	const image = /**  @type {HTMLImageElement | null} */ (container.querySelector('#image'));
	const shatterButton = container.querySelector('#shatter-button');
	const resetButton = container.querySelector('#reset-button');

	if (!imageContainer || !image || !shatterButton || !resetButton) {
		throw new Error('Elements not found');
	}

	const columns = 20;
	const rows = 15;
	const total = columns * rows;
	const fragments = Array.from({ length: total }, (_, i) => {
		const fragment = document.createElement('div');
		fragment.style.width = `${100 / columns}%`;
		fragment.style.height = `${100 / rows}%`;
		fragment.style.backgroundImage = `url(${image.src})`;
		fragment.style.backgroundSize = `${columns * 100}% ${rows * 100}%`;
		fragment.style.backgroundPosition = `${(i % columns) * -100}% ${((i / columns) | 0) * -100}%`;
		fragment.style.position = 'absolute';
		fragment.style.left = `${((i % columns) * 100) / columns}%`;
		fragment.style.top = `${(((i / columns) | 0) * 100) / rows}%`;
		imageContainer.appendChild(fragment);
		return fragment;
	});

	shatterButton.addEventListener('click', () => {
		fragments.forEach((fragment, i) => {
			const x = (i % columns) - columns / 2;
			const y = ((i / columns) | 0) - rows / 2;
			const angle = Math.atan2(y, x);
			const distance = Math.hypot(x, y);
			const delay = distance * 0.1;
			const duration = Math.min(1, distance * 0.1);
			fragment.style.transition = `transform ${duration}s ease-out ${delay}s`;
			fragment.style.transform = `translate(${x * 10}px, ${y * 10}px) rotate(${angle}rad)`;
		});
	});

	resetButton.addEventListener('click', () => {
		fragments.forEach((fragment, i) => {
			fragment.style.transition = '';
			fragment.style.transform = '';
		});
	});
}
