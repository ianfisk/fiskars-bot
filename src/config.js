'use-strict';

const path = require('path');

module.exports = {
	apiToken: '',
	flowIds: ['12937c90-ec98-425b-9a00-8b82f00b1caf'],
	unsplash: {
		accessKey: '',
		secret: '',
	},
	paths: {
		modelDirectory: path.join(__dirname, '..', 'weights'),
		imagesDirectory: path.join(__dirname, 'images'),
	},
};
