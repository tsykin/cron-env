import * as dotenv from 'dotenv';
import * as cron from 'node-cron';
import { z } from 'zod';
import type { Env } from '@/utils/types';
import { parseValue } from '@/utils/utils';

dotenv.config();

// Validation schema for HTTP methods
const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

// Validation schema for cron schedule
const CronScheduleSchema = z
	.string()
	.refine((schedule) => cron.validate(schedule), {
		message: 'Invalid cron schedule format',
	});

// Validation schema for URL
const UrlSchema = z.string().url({
	message: 'Invalid URL format',
});

// Validation schema for props (can be string, number, or boolean)
const PropsSchema = z
	.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
	.optional();

// Validation schema for a single job
const JobSchema = z.object({
	id: z.number().positive(),
	schedule: CronScheduleSchema,
	method: HttpMethodSchema,
	url: UrlSchema,
	props: PropsSchema,
});

// Validation schema for timezone
const TimezoneSchema = z.string().refine(
	(tz) => {
		try {
			Intl.DateTimeFormat(undefined, { timeZone: tz });
			return true;
		} catch (e) {
			console.error('Invalid timezone:', e);
			return false;
		}
	},
	{
		message: 'Invalid timezone. Must be a valid IANA timezone name',
	}
);

// Validation schema for RUN_ON_START
const RunOnStartSchema = z
	.enum(['true', 'false'])
	.transform((val) => val === 'true')
	.optional()
	.default(() => false);

// Validation schema for REQUEST_TIMEOUT
const RequestTimeoutSchema = z
	.string()
	.optional()
	.transform((val) => {
		if (!val) return 60000; // Default to 60000ms (1 minute)
		const parsed = parseInt(val, 10);
		return Number.isNaN(parsed) ? 60000 : parsed;
	});

// Export validated environment variables
export const env = {
	timezone: TimezoneSchema.parse(process.env.TIMEZONE || 'UTC'),
	runOnStart: RunOnStartSchema.parse(process.env.RUN_ON_START),
	requestTimeout: RequestTimeoutSchema.parse(process.env.REQUEST_TIMEOUT),
};

export function getAllEnv() {
	const envList: Env[] = [];
	let i = 0;
	let hasMoreJobs = true;

	while (hasMoreJobs) {
		const jobId = `JOB${i + 1}`;
		console.log(`Processing env variable ${jobId}...`);
		const envVar = process.env[jobId];

		if (envVar) {
			try {
				// Parse the environment variable value
				// Format: "SCHEDULE::METHOD::URL::prop1=value1::prop2=value2"
				const parts = envVar.split('::');

				if (parts.length < 3) {
					throw new Error(
						`Invalid format. Expected: "SCHEDULE::METHOD::URL::prop1=value1::prop2=value2"`
					);
				}

				const [schedule, method, url, ...propParts] = parts;

				// Parse props if they exist
				const props: Record<string, string | number | boolean> = {};
				if (propParts.length > 0) {
					for (const propPart of propParts) {
						const [key, value] = propPart.split('=');
						if (key && value !== undefined) {
							props[key] = parseValue(value);
						}
					}
				}

				// Validate the job using Zod schema
				const validatedJob = JobSchema.parse({
					id: i + 1,
					schedule,
					method: method as z.infer<typeof HttpMethodSchema>,
					url,
					props: Object.keys(props).length > 0 ? props : undefined,
				});

				envList.push(validatedJob);
			} catch (error: unknown) {
				if (error instanceof z.ZodError) {
					console.error(`Validation error for ${jobId}:`, error.message);
				} else if (error instanceof Error) {
					console.error(`Error processing ${jobId}:`, error.message);
				} else {
					console.error(`Unknown error processing ${jobId}:`, error);
				}
				process.exit(1);
			}

			i++;
		} else {
			hasMoreJobs = false;
		}
	}

	if (envList.length === 0) {
		throw new Error('No valid jobs found in environment variables');
	}

	return envList;
}
