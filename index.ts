import * as cron from 'node-cron';
import { env, getAllEnv } from '@/utils/env';
import type { Env } from '@/utils/types';
import { formatDate } from '@/utils/utils';

// Log timezone configuration
if (env.timezone) {
	console.log(`Using timezone: ${env.timezone}`);
}

// Log request timeout configuration
if (env.requestTimeout > 0) {
	console.log(`Using request timeout: ${env.requestTimeout}ms`);
}

// Get all environment variables with validation
const jobs = getAllEnv();

// Log the jobs that will be scheduled
console.log(`Found ${jobs.length} jobs to schedule.\n`);
jobs.forEach((job) => {
	console.log(
		`Job ${job.id}:\n  Schedule "${job.schedule}"\n  ${job.method} "${job.url}"${
			job.props ? `\n  with props: ${JSON.stringify(job.props)}` : ''
		}`
	);
});

// Wrapper function to handle the process for a specific job
async function performCronJob(job: Env) {
	try {
		// Create an AbortController with the configured timeout
		const controller = new AbortController();

		// If timeout is 0, it means no timeout
		if (env.requestTimeout > 0) {
			setTimeout(() => controller.abort(), env.requestTimeout);
		}

		const options: RequestInit = {
			method: job.method,
			headers: {
				'Content-Type': 'application/json',
			},
			signal: controller.signal,
		};

		// Add body for non-GET requests if props exist
		if (job.method !== 'GET' && job.props) {
			options.body = JSON.stringify(job.props);
		}

		const response = await fetch(job.url, options);
		const status = response.status;
		const now = new Date();

		console.log(
			`\n✅ Process for job ${job.id} completed\nMade ${job.method} request to: ${
				job.url
			}\nProps: ${JSON.stringify(job.props)}\nResponse status: ${status}\nCompleted at: ${formatDate(
				now,
				'YYYY-MM-DD HH:MM'
			)}`
		);
	} catch (error: unknown) {
		// Check if it's an abort error
		if (error instanceof Error && error.name === 'AbortError') {
			console.error(
				`❌ Request for Job ${job.id} timed out after ${env.requestTimeout}ms`
			);
		} else {
			console.error(`❌ Error during process for Job ${job.id}:`, error);
		}
	}
}

// New line
console.log('');

// Schedule each job
jobs.forEach((job) => {
	// Validate cron schedule
	if (!cron.validate(job.schedule)) {
		console.error(`Invalid cron schedule for Job ${job.id}: ${job.schedule}`);
		return; // Skip this job
	}

	// Schedule the task
	console.log(`Scheduling Job ${job.id} with cron: ${job.schedule}`);
	cron.schedule(job.schedule, () => performCronJob(job), {
		timezone: env.timezone as string,
	});

	// Optional: Run on startup if configured
	if (env.runOnStart) {
		console.log(`Running Job ${job.id} on startup...`);
		performCronJob(job).catch((error) => {
			console.error(`Failed to run initial job ${job.id}:`, error);
		});
	}
});

console.log(
	'\nAll jobs scheduled successfully. Waiting for cron schedules to trigger...'
);
