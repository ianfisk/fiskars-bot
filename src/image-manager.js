'use-strict';

const tmp = require('tmp');

class ImageManager {
	constructor({ imageService }) {
		this.imageService = imageService;
		tmp.setGracefulCleanup();
	}

	async tryGetRandomImage({ query }) {
		try {
			const filePath = await getTempFileName();
			const image = await this.imageService.getRandomImage({ query });
			await this.imageService.downloadImage({ image, filePath });

			return filePath;
		} catch (error) {
			console.error('Error downloading image: ', error);
			return null;
		}
	}
}

function getTempFileName() {
	return new Promise((resolve, reject) => {
		tmp.tmpName((err, path) => {
			if (!err) {
				resolve(path);
			} else {
				reject(err);
			}
		});
	});
}

module.exports = ImageManager;
