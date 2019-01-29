'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const Flowdock = require('flowdock');
const config = require('./config');
const { WorkerBase } = require('./worker-pool');

const readFile = util.promisify(fs.readFile);

class MessageProcessor extends WorkerBase {
	constructor() {
		super();

		this.session = new Flowdock.Session(config.apiToken);
	}

	async handleWorkerData(workerData) {
		if (!workerData) {
			throw new Error('Worker data must be sent to worker.');
		}

		const { queryText, threadId, flowId } = workerData;
		if (!threadId || !flowId) {
			console.warn('Missing thread ID or flow ID in worker thread.');
			return;
		}

		await this.uploadFile(workerData);
	}

	async uploadFile({ flowId, threadId }) {
		const fileContents = await readFile(path.join(__dirname, 'me.jpeg'));
		const buffer = Buffer.from(fileContents);

		await new Promise((resolve, reject) => {
			this.session.post(
				'/messages',
				{
					event: 'file',
					flow: flowId,
					thread_id: threadId,
					tags: [],
					content: {
						data: buffer.toString('base64'),
						content_type: 'image/png',
						file_name: 'cabinet_icon.png',
					},
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
