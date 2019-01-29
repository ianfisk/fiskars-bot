'use strict';

const path = require('path');
const Flowdock = require('flowdock');
const { WorkerPool } = require('./worker-pool');

const fiskarsMessageCommand = /^\s*fiskars:\s*(.*)/i;

class FiskarsBot {
	constructor({ credentials, flowIds }) {
		this.credentials = credentials;
		this.flowIds = flowIds;

		this.workerPool = new WorkerPool({
			workerScriptPath: path.join(__dirname, 'message-processor.js'),
			maxWorkers: 2,
		});
	}

	start() {
		const session = new Flowdock.Session(this.credentials);
		this.stream = session.stream(this.flowIds);

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
			await this.workerPool.processData({
				queryText,
				threadId,
				flowId,
			});
		} catch (error) {
			console.error('Caught error from worker:', error);
		}
	}
}

module.exports = FiskarsBot;
