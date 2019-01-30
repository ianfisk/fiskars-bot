'use-strict';

const path = require('path');

module.exports = {
	apiToken: process.env.FLOWDOCK_API_TOKEN,
	flowIds: ['12937c90-ec98-425b-9a00-8b82f00b1caf'],
	unsplash: {
		accessKey: process.env.UNSPLASH_ACCESS_KEY,
		secret: process.env.UNSPLASH_SECRET,
	},
	paths: {
		modelDirectory: path.join(__dirname, '..', 'weights'),
		imagesDirectory: path.join(__dirname, 'images'),
	},
};
