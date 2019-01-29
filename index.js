'use strict';

const readline = require('readline');
const config = require('./src/config');
const FiskarsBot = require('./src/fiskars-bot');

(function main() {
	const bot = new FiskarsBot({ credentials: config.apiToken, flowIds: config.flowIds });

	console.log('Starting bot.');
	bot.start();

	const rl = readline.createInterface({
		input: process.stdin,
	});
	rl.on('line', () => {
		console.log('Stopping bot');
		bot.stop();
		process.exit(0);
	});
})();
