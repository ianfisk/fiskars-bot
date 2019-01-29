'use strict';

const fs = require('fs');
const util = require('util');
const Flowdock = require('flowdock');
const ImageManager = require('./image-manager');
const ImageService = require('./image-service');

const readFile = util.promisify(fs.readFile);

const fiskarsMessageCommand = /^\s*fiskars:\s*(.*)/i;

class FiskarsBot {
	constructor({ credentials, flowIds }) {
		this.credentials = credentials;
		this.flowIds = flowIds;
		this.imageManager = new ImageManager({
			imageService: new ImageService(),
		});
	}

	start() {
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

		const messageTextContent = content;
		const match = fiskarsMessageCommand.exec(messageTextContent);
		if (!match) {
			return;
		}

		const queryText = match[1].trim();
		try {
			console.log('Processing message:', queryText);
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
		const imageFilePath = await this.imageManager.tryGetRandomImage({ query: 'man' });
		if (!imageFilePath) {
			await this._postMessage({
				flowId,
				threadId,
				content: 'Fiskars Bot is unable to generate an image 😔',
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

module.exports = FiskarsBot;
