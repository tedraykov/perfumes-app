import { vi } from 'vitest';
import type { JobObserver } from '.';

export const mockObserver: JobObserver = {
	updateData: vi.fn().mockResolvedValue(undefined),
	updateProgress: vi.fn().mockResolvedValue(undefined),
	assertJobNotAborted: vi.fn().mockResolvedValue(undefined),
	getLatestJobData: vi.fn().mockResolvedValue({ foo: 'bar' })
};
