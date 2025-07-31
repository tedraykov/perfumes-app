import { produce } from 'sveltekit-sse';
import { queue } from '$lib/server/queue';

function delay(milliseconds: number) {
  return new Promise(function run(resolve) {
    setTimeout(resolve, milliseconds);
  });
}

export function POST({ params }) {
  return produce(async function start({ emit }) {
    // Get the initial state of the job
    const { id } = params;
    const job = await queue.getJob(id);

    if (!job) {
      return;
    }

    let lastProgress = await job.getProgress();

    // Loop until the job is closed
    while (true) {
      const updated = await queue.getJob(id);
      if (!updated) return;

      const progress = await updated.getProgress();
      const state = await updated.getState();

      // Dedupe sending process if the value hasn't changed
      if (progress !== lastProgress) {
        lastProgress = progress;
        const { error } = emit('progress', lastProgress);

        if (error) {
          return;
        }
      }

      // If the job is closed, send last message and close the connection
      if (state === 'completed' || state === 'failed') {
        const { error } = emit('status', state);

        if (error) {
          return;
        }
        return;
      }

      await delay(1000);
    }
  });
}
