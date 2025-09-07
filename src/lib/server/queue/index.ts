import { REDIS_URL } from '$env/static/private';
import type { Job } from 'bullmq';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const QUEUE_NAME = 'perfumes';

export const connection = new IORedis(REDIS_URL);

export const queue = new Queue(QUEUE_NAME, {
	connection
});

export interface JobObserver {
	updateData(jobData: Record<any, any>): Promise<void>;
	updateProgress(progress: number): Promise<void>;
	assertJobNotAborted(): Promise<void>;
	getLatestJobData(): Promise<any>;
}

export class BullJobObserver implements JobObserver {
	job: Job<any, any, string>;
	queue: Queue;

	constructor(queue: Queue, job: Job) {
		this.queue = queue;
		this.job = job;
	}
	async updateData(jobData: Record<any, any>) {
		const initialJobData = (await this.getLatestJobData()) || {};

		await this.job.updateData({
			...initialJobData,
			...jobData
		});
	}

	async updateProgress(progress: number) {
		this.job.updateProgress(progress);
	}

	async isJobAborted() {
		const jobData = (await this.getLatestJobData()) || {};
		return Boolean(jobData['aborted']);
	}

	async assertJobNotAborted() {
		if (await this.isJobAborted()) {
			throw new Error('Job was aborted');
		}
	}

	async getLatestJobData() {
		if (!this.job.id) {
			throw new Error('Job is missing');
		}
		const latestJob: Job = await this.queue.getJob(this.job.id);

		return latestJob.data;
	}
}
