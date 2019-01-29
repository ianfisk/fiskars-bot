const { MessagePort, parentPort } = require('worker_threads');

// encapsulate interfacing with the worker pool in a class that can be extended by worker scripts.
class WorkerBase {
	start() {
		parentPort.on('message', async value => {
			const { communicationPort } = value;
			if (!(communicationPort instanceof MessagePort)) {
				throw new Error('Invalid communication port.');
			}

			communicationPort.once('message', async ({ workerData } = {}) => {
				try {
					const result = await this.handleWorkerData(workerData);
					communicationPort.postMessage({ data: result });
				} catch (error) {
					console.error('Error in worker:', error);
					communicationPort.postMessage({ error: { message: 'Error in worker process.' } });
				}
			});
		});
	}

	handleWorkerData() {
		throw new Error(
			'Subclasses must override handleWorkerData to process data sent from the main thread.'
		);
	}
}

module.exports = WorkerBase;
