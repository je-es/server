// test/logger.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect } from 'bun:test'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Logger - Levels', () => {
		test('should handle debug level logging', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('debug', false)

			expect(() => logger.debug({ test: 1 }, 'debug message')).not.toThrow()
			expect(() => logger.info({ test: 1 }, 'info message')).not.toThrow()
			expect(() => logger.warn({ test: 1 }, 'warn message')).not.toThrow()
			expect(() => logger.error({ test: 1 }, 'error message')).not.toThrow()
		})

		test('should handle info level logging', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('info', false)

			expect(() => logger.debug({ test: 1 }, 'debug')).not.toThrow()
			expect(() => logger.info({ test: 1 }, 'info')).not.toThrow()
			expect(() => logger.warn({ test: 1 }, 'warn')).not.toThrow()
			expect(() => logger.error({ test: 1 }, 'error')).not.toThrow()
		})

		test('should handle warn level logging', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('warn', false)

			expect(() => logger.debug({ test: 1 }, 'debug')).not.toThrow()
			expect(() => logger.info({ test: 1 }, 'info')).not.toThrow()
			expect(() => logger.warn({ test: 1 }, 'warn')).not.toThrow()
			expect(() => logger.error({ test: 1 }, 'error')).not.toThrow()
		})

		test('should handle error level logging', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('error', false)

			expect(() => logger.debug({ test: 1 }, 'debug')).not.toThrow()
			expect(() => logger.info({ test: 1 }, 'info')).not.toThrow()
			expect(() => logger.warn({ test: 1 }, 'warn')).not.toThrow()
			expect(() => logger.error({ test: 1 }, 'error')).not.toThrow()
		})

		test('should handle fatal level logging', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('error', false)

			expect(() => logger.fatal({ test: 1 }, 'fatal error')).not.toThrow()
		})
	})

	describe('Logger - Data Types', () => {
		test('should handle null data in logs', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('info', false)

			expect(() => logger.info(null, 'null data')).not.toThrow()
		})

		test('should handle undefined data in logs', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('info', false)

			expect(() => logger.info(undefined, 'undefined data')).not.toThrow()
		})

		test('should handle empty object data', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('info', false)

			expect(() => logger.info({}, 'empty object')).not.toThrow()
		})

		test('should handle complex object data', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('info', false)

			const complexData = {
			nested: {
				deep: {
				value: 123
				}
			},
			array: [1, 2, 3],
			string: 'test'
			}

			expect(() => logger.info(complexData, 'complex data')).not.toThrow()
		})
	})

	describe('Logger - Pretty Mode', () => {
		test('should handle pretty mode', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('info', true)

			expect(() => logger.info({ test: 'data' }, 'pretty log')).not.toThrow()
		})

		test('should handle pretty mode with null message', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('info', true)

			expect(() => logger.info({ test: 'data' })).not.toThrow()
		})
	})

	describe('Logger - Default Values', () => {
		test('should use default log level', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger()

			expect(() => logger.info({ test: 1 }, 'default level')).not.toThrow()
		})

		test('should handle invalid log level', () => {
			const { Logger } = require('../src/mod/logger')
			const logger = new Logger('invalid' as any, false)

			expect(() => logger.info({ test: 1 }, 'invalid level')).not.toThrow()
		})
	})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝