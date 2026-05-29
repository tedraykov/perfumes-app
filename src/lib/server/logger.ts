import pino from 'pino';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const LOG_DIR = resolve(process.cwd(), 'logs');
mkdirSync(LOG_DIR, { recursive: true });

const logger = pino({
	level: process.env.LOG_LEVEL ?? 'info',
	transport: {
		targets: [
			{
				target: 'pino-pretty',
				options: { colorize: true }
			},
			{
				target: 'pino-pretty',
				options: {
					colorize: false,
					destination: `${LOG_DIR}/app.log`,
					append: true
				}
			}
		]
	}
});

export default logger;
