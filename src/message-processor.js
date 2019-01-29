'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const Flowdock = require('flowdock');
const config = require('./config');
const { WorkerBase } = require('./worker-pool');
const ImageManager = require('./image-manager');
const ImageService = require('./image-service');

const readFile = util.promisify(fs.readFile);

class MessageProcessor extends WorkerBase {
	constructor() {
		super();

		this.session = new Flowdock.Session(config.apiToken);
		this.imageManager = new ImageManager({
			imageService: new ImageService(),
		});
	}

	async handleWorkerData(workerData) {
		if (!workerData) {
			throw new Error('Worker data must be sent to worker.');
		}

		const { threadId, flowId } = workerData;
		if (!threadId || !flowId) {
			console.warn('Missing thread ID or flow ID in worker thread.');
			return;
		}

		await this._uploadFile(workerData);
	}

	async _uploadFile({ flowId, threadId }) {
		const imageFilePath = await this.imageManager.tryGetRandomImage({ query: 'man' });
		if (!imageFilePath) {
			await this._postMessage({
				flowId,
				threadId,
				content: 'Fiskars Bot is unable to generate image 😔',
			});
			return;
		}

		const fileContents = await readFile(imageFilePath);
		const buffer = Buffer.from(fileContents);

		await this._postMessage({
			threadId,
			flowId,
			messageKind: 'file',
			content: {
				data: buffer.toString('base64'),
				content_type: 'image/png',
				file_name: 'your-welcome.png',
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

new MessageProcessor().start();
