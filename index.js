'use strict';

const readline = require('readline');
const config = require('./src/config');
const FiskarsBot = require('./src/fiskars-bot');
const ImageManager = require('./src/image-manager');
const UnsplashImageService = require('./src/unsplash-image-service');

(async function main() {
	const bot = new FiskarsBot({
		credentials: config.apiToken,
		flowIds: config.flowIds,
		imageManager: new ImageManager({
			imageService: new UnsplashImageService({
				accessKey: config.unsplash.accessKey,
				secret: config.unsplash.secret,
			}),
		}),
	});

	console.log('Starting bot.');
	await bot.start();

	const rl = readline.createInterface({
		input: process.stdin,
	});
	rl.on('line', () => {
		console.log('Stopping bot');
		bot.stop();
		process.exit(0);
	});
})();
