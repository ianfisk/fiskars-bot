'use-strict';

const tmp = require('tmp');

class ImageManager {
	constructor({ imageService }) {
		this.imageService = imageService;
		this.previousFilePaths = [];

		tmp.setGracefulCleanup();
	}

	async tryGetRandomImage({ query }) {
		try {
			const filePath = await getTempFileName();
			const image = await this.imageService.getRandomImage({ query });
			await this.imageService.downloadImage({ image, filePath });

			this._addUsedFilePath(filePath);

			return filePath;
		} catch (error) {
			console.error('Error getting image: ', error);

			return this.previousFilePaths.length > 0
				? this.previousFilePaths[Math.floor(Math.random() * this.previousFilePaths.length)]
				: null;
		}
	}

	_addUsedFilePath(filePath) {
		this.previousFilePaths.push(filePath);
		if (this.previousFilePaths.length > 100) {
			this.previousFilePaths = this.previousFilePaths.slice(1);
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
