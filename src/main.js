import './style.css';
import { setup } from './utils/main';

const app = /** @type {HTMLDivElement | null} */ (document.querySelector('#app'));

if (!app) {
	throw new Error('App not found');
}

app.innerHTML = `
  <div>
    <div>
			<style>
				body {
						background-color: #000;
						margin: 0;
						overflow: hidden;
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
						position: absolute;
						cursor: pointer;
				}
				
				#container {
						position: absolute;
						width: 768px;
						height: 485px;
						left: 0;
						right: 0;
						top: 0;
						bottom: 0;
						margin: auto;
				}
			</style>
			<div id="container"></div>
			<script src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/175711/delaunay.js" defer></script>
			<script src="//cdnjs.cloudflare.com/ajax/libs/gsap/1.13.2/TweenMax.min.js" defer></script>
    </div>
  </div>
`;

setup();
