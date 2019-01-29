'use strict';

const { Worker, MessageChannel } = require('worker_threads');

class WorkerPool {
	constructor({ workerScriptPath, maxWorkers }) {
		this.workerScriptPath = workerScriptPath;
		this.maxWorkers = maxWorkers;
		this.workerCount = 0;
		this.freeWorkers = [];
		this.callbacksWaitingForWorker = [];
	}

	async processData(workerData) {
		const worker = await this._getNextWorker();

		// construct a separate message channel instead of using the global one per the doc's recommendations
		const subChannel = new MessageChannel();
		worker.postMessage({ communicationPort: subChannel.port1 }, [subChannel.port1]);

		subChannel.port2.postMessage({ workerData });

		try {
			const result = await new Promise((resolve, reject) => {
				subChannel.port2.on('message', result => {
					if (typeof result !== 'object' && typeof result !== 'undefined') {
						throw new Error('Result from worker must be undefined, null, or an object.');
					}

					subChannel.port2.close();

					const { data, error } = result || {};
					if (!error) {
						resolve(data);
					} else {
						reject(error);
					}
				});
			});

			return result;
		} finally {
			if (this.callbacksWaitingForWorker.length) {
				// process the next client request if there is one
				const callbackWaitingForWorker = this.callbacksWaitingForWorker.pop();
				callbackWaitingForWorker(worker);
			} else {
				this.freeWorkers.push(worker);
			}
		}
	}

	async _getNextWorker() {
		let nextWorkerToUse;
		if (this.freeWorkers.length) {
			nextWorkerToUse = this.freeWorkers.pop();
		} else if (this.workerCount < this.maxWorkers) {
			nextWorkerToUse = this._createWorker();
		} else {
			nextWorkerToUse = await new Promise(resolve => {
				this.callbacksWaitingForWorker.push(worker => {
					resolve(worker);
				});
			});
		}

		return nextWorkerToUse;
	}

	_createWorker() {
		if (this.workerCount === this.maxWorkers) {
			throw new Error('Cannot create another worker. Max count reached.');
		}

		this.workerCount++;
		return new Worker(this.workerScriptPath);
	}
}

module.exports = WorkerPool;
