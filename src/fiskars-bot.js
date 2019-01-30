'use strict';

require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');
const util = require('util');
const Flowdock = require('flowdock');
const canvas = require('canvas');
const faceapi = require('face-api.js');
const config = require('./config');
const ImageManager = require('./image-manager');
const ImageService = require('./image-service');

const readdirAsync = util.promisify(fs.readdir);

const { Canvas, Image, ImageData, loadImage } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class FiskarsBot {
	constructor({ credentials, flowIds }) {
		this.credentials = credentials;
		this.flowIds = flowIds;
		this.imageManager = new ImageManager({
			imageService: new ImageService(),
		});
		this.fiskarsFaceImagePaths = [];
	}

	async start() {
		await faceapi.nets.tinyFaceDetector.loadFromDisk(config.paths.modelDirectory);

		// get filenames of face images
		this.fiskarsFaceImagePaths = (await readdirAsync(config.paths.imagesDirectory)).map(fileName =>
			path.join(config.paths.imagesDirectory, fileName)
		);

		this.session = new Flowdock.Session(this.credentials);
		this.stream = this.session.stream(this.flowIds);

		this.stream.on('connected', () => {
			console.log('Connected to Flowdock API.');
		});
		this.stream.on('end', () => {
			console.log('Stream ending!');
		});
		this.stream.on('message', this._handleMessage.bind(this));
	}

	stop() {
		this.stream.end();
	}

	async _handleMessage(message) {
		const { event: messageKind, thread_id: threadId, content, flow: flowId } = message;
		if (messageKind !== 'message') {
			return;
		}

		const shouldRespondToMessage = content.toLowerCase().indexOf('fiskars') !== -1;
		if (!shouldRespondToMessage) {
			return;
		}

		try {
			console.log('Processing message:', content);
			await this._answer({ flowId, threadId });
		} catch (error) {
			console.error('Caught error from message processor:', error);
			await this._postMessage({
				flowId,
				threadId,
				content: 'Fiskars Bot messed up 😔',
			});
		}
	}

	async _answer({ flowId, threadId }) {
		const imageFilePath = await this.imageManager.tryGetRandomImage({ query: 'face' });
		if (!imageFilePath) {
			await this._postMessage({
				flowId,
				threadId,
				content: 'Fiskars Bot is unable to generate an image 😔',
			});
			return;
		}

		const imageBuffer = await addFiskarsFaceToImage({
			imageFilePath,
			fiskarsFaceImagePaths: this.fiskarsFaceImagePaths,
		});

		await this._postMessage({
			threadId,
			flowId,
			messageKind: 'file',
			content: {
				data: imageBuffer.toString('base64'),
				content_type: 'image/jpeg',
				file_name: 'your-welcome.jpeg',
			},
		});
	}

	_postMessage({ threadId, flowId, content, messageKind = 'message' }) {
		return new Promise((resolve, reject) => {
			this.session.post(
				'/messages',
				{
					event: messageKind,
					flow: flowId,
					thread_id: threadId,
					tags: [],
					content,
				},
				err => {
					if (!err) {
						resolve();
					} else {
						reject(err);
					}
				}
			);
		});
	}
}

async function addFiskarsFaceToImage({ imageFilePath, fiskarsFaceImagePaths }) {
	const image = await canvas.loadImage(imageFilePath);
	const detections = await faceapi.detectAllFaces(
		image,
		new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.25 })
	);

	const imageCanvas = faceapi.createCanvasFromMedia(image);
	const ctx = imageCanvas.getContext('2d');

	for (const detection of detections) {
		const { box } = detection;
		const fiskarsFaceImagePath =
			fiskarsFaceImagePaths[Math.floor(Math.random() * fiskarsFaceImagePaths.length)];
		const fiskarsFace = await loadImage(fiskarsFaceImagePath);
		ctx.drawImage(fiskarsFace, box.x, box.y, box.width, box.height);
	}

	return imageCanvas.toBuffer('image/jpeg');
}

module.exports = FiskarsBot;
