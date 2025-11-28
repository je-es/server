// test/health.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } 	from 'bun:test'
	import { server, type ServerInstance, type AppContext } from '../src/main'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Health Endpoints', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3215'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 1500))

			app = server({
			port: 3215,
			logging: false
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should respond to health check', async () => {
			const res = await fetch(`${baseUrl}/health`)
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.status).toBe('healthy')
			expect(data.timestamp).toBeTruthy()
			expect(typeof data.uptime).toBe('number')
			expect(data.activeRequests).toBeDefined()
		})

		test('should respond to readiness check', async () => {
			const res = await fetch(`${baseUrl}/readiness`)
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.ready).toBe(true)
			expect(data.checks).toBeDefined()
			expect(data.checks.database).toBe('not configured')
			expect(data.timestamp).toBeTruthy()
		})

		test('should include security headers in health check', async () => {
			const res = await fetch(`${baseUrl}/health`)

			expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
			expect(res.headers.get('X-Frame-Options')).toBe('DENY')
			expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block')
			expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
		})

		test('should include request ID in health check', async () => {
			const res = await fetch(`${baseUrl}/health`)
			const requestId = res.headers.get('X-Request-ID')

			expect(requestId).toBeTruthy()
			expect(typeof requestId).toBe('string')
		})
	})

	describe('Health Endpoints - With Database', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3216'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 1600))

			const { Database } = require('bun:sqlite')
			const sqlite = new Database(':memory:')

			app = server({
			port: 3216,
			logging: false,
			database: {
				connection: sqlite
			}
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should show database connected in readiness', async () => {
			const res = await fetch(`${baseUrl}/readiness`)
			const data = await res.json()

			expect(res.status).toBe(200)
			expect(data.ready).toBe(true)
			expect(data.checks.database).toBe('connected')
		})
	})

	describe('Health Endpoints - Concurrent Requests', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3217'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 1700))

			app = server({
			port: 3217,
			logging: false
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should handle concurrent health checks', async () => {
			const requests = Array.from({ length: 10 }, () =>
			fetch(`${baseUrl}/health`)
			)

			const responses = await Promise.all(requests)

			expect(responses.every(r => r.status === 200)).toBe(true)
		})

		test('should track active requests', async () => {
			// Make a request and check active count
			const res = await fetch(`${baseUrl}/health`)
			const data = await res.json()

			// Active requests should be a number
			expect(typeof data.activeRequests).toBe('number')
		})
	})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝