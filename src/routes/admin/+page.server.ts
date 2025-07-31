import type { PageServerLoad } from './$types';
import { queue } from '$lib/server/queue';
import linkPerfumes from '$lib/server/scrapers/fragrantica/link-perfume';
import type { Actions } from './$types';
import type { Job } from 'bullmq';
import { fail } from '@sveltejs/kit';

export type GroupedJobs = Record<string, Job[]>;

export const load: PageServerLoad = async () => {
  const jobs = await queue.getJobs();
  const grouped: GroupedJobs = {};
  for (const job of jobs) {
    const key = job.name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(job.asJSON());
  }
  return {
    groupedJobs: grouped
  };
};

export const actions = {
  'abort-job': async ({ request }) => {
    const formData = await request.formData();
    const jobId = formData.get('jobId')?.toString() || '';

    const job = await queue.getJob(jobId);
    if (!job) {
      fail(404, {
        success: false,
        message: 'Job not found'
      });
    }
    job.updateData({ aborted: true });
  },
  'import-elinor': async () => {
    await queue.add('import-elinor', {}); // data can be empty or custom
  },
  'link-to-fragrantica': async () => {
    await linkPerfumes();
  },
  'import-parfiumbg': async () => {
    await queue.add('import-parfiumbg', {});
  },
  'import-parfiumbg-one': async ({ request }) => {
    const formData = await request.formData();
    const url = formData.get('url')?.toString() || '';
    await queue.add('import-parfiumbg-one', { url });
  }
} satisfies Actions;
