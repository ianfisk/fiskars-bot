'use-strict';

require('isomorphic-fetch');
const fs = require('fs');
const request = require('request');
const sharp = require('sharp');
const { default: Unsplash, toJson } = require('unsplash-js');
const config = require('./config');

class UnsplashImageService {
	constructor() {
		this.unsplashService = new Unsplash({
			applicationId: config.unsplash.accessKey,
			secret: config.unsplash.secret,
		});
	}

	async getRandomImage({ query }) {
		const response = await this.unsplashService.photos.getRandomPhoto({ query });
		const image = await toJson(response);
		return image;
	}

	async downloadImage({ image, filePath, width = 300, height = 300 }) {
		if (!image || !filePath) {
			return;
		}

		const downloadResponse = await this.unsplashService.photos.downloadPhoto(image);
		const { url: downloadUrl } = await toJson(downloadResponse);

		const imageResizer = sharp()
			.resize(width, height, {
				fit: sharp.fit.inside,
			})
			.png();

		await new Promise(resolve => {
			const downloadStream = request(downloadUrl)
				.pipe(imageResizer)
				.pipe(fs.createWriteStream(filePath));
			downloadStream.on('finish', resolve);
		});
	}
}

module.exports = UnsplashImageService;
