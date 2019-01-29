'use strict';

const Flowdock = require('flowdock');
const config = require('./config');
const { WorkerBase } = require('./worker-pool');

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

		await new Promise((resolve, reject) => {
			this.session.threadMessage(
				flowId,
				threadId,
				`Hello from the fiskars bot! Your query is ${queryText}`,
				null,
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
