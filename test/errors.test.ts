// test/errors.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } 								from 'bun:test'
	import { server, type ServerInstance, type AppContext, ValidationError, AppError } 	from '../src/main'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Error Handling - Validation Errors', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3211'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 1100))

			app = server({
			port: 3211,
			logging: false,
			routes: [
				{
				method: 'POST',
				path: '/validate',
				handler: (c: AppContext) => {
					if (!c.body?.name) {
					throw new ValidationError('Name is required')
					}
					return c.json({ valid: true })
				}
				},
				{
				method: 'POST',
				path: '/invalid-json',
				handler: (c: AppContext) => {
					return c.json({ body: c.body })
				}
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should return 400 for validation errors', async () => {
			const res = await fetch(`${baseUrl}/validate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.error).toBe('Name is required')
			expect(data.code).toBe('VALIDATION_ERROR')
		})

		test('should handle malformed JSON', async () => {
			const res = await fetch(`${baseUrl}/invalid-json`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '{invalid json'
			})

			expect(res.status).toBe(400)
			const data = await res.json()
			expect(data.code).toBe('VALIDATION_ERROR')
		})
	})

	describe('Error Handling - Custom App Errors', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3212'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 1200))

			app = server({
			port: 3212,
			logging: false,
			routes: [
				{
				method: 'GET',
				path: '/custom-error',
				handler: (c: AppContext) => {
					throw new AppError('Custom error message', 418, 'CUSTOM_ERROR')
				}
				},
				{
				method: 'GET',
				path: '/unhandled-error',
				handler: (c: AppContext) => {
					throw new Error('Unhandled error')
				}
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should handle custom AppError', async () => {
			const res = await fetch(`${baseUrl}/custom-error`)

			expect(res.status).toBe(418)
			const data = await res.json()
			expect(data.error).toBe('Custom error message')
			expect(data.code).toBe('CUSTOM_ERROR')
			expect(data.requestId).toBeTruthy()
		})

		test('should handle unhandled errors gracefully', async () => {
			const res = await fetch(`${baseUrl}/unhandled-error`)

			expect(res.status).toBe(500)
			const data = await res.json()
			expect(data.error).toBeTruthy()
			expect(data.requestId).toBeTruthy()
		})
	})

	describe('Error Handling - Timeout', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3213'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 1300))

			app = server({
			port: 3213,
			logging: false,
			requestTimeout: 100, // 100ms timeout
			routes: [
				{
				method: 'GET',
				path: '/slow',
				handler: async (c: AppContext) => {
					await new Promise(resolve => setTimeout(resolve, 200))
					return c.json({ done: true })
				}
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should timeout slow requests', async () => {
			const res = await fetch(`${baseUrl}/slow`)

			expect(res.status).toBe(408)
			const data = await res.json()
			expect(data.code).toBe('TIMEOUT_ERROR')
		})
	})

	describe('Error Handling - Request ID', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3214'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 1400))

			app = server({
			port: 3214,
			logging: false,
			routes: [
				{
				method: 'GET',
				path: '/test',
				handler: (c: AppContext) => {
					return c.json({ requestId: c.requestId })
				}
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should include request ID in context', async () => {
			const res = await fetch(`${baseUrl}/test`)
			const data = await res.json()

			expect(data.requestId).toBeTruthy()
			expect(typeof data.requestId).toBe('string')
		})

		test('should include request ID in response headers', async () => {
			const res = await fetch(`${baseUrl}/test`)
			const requestId = res.headers.get('X-Request-ID')

			expect(requestId).toBeTruthy()
		})
	})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝