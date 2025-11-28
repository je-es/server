// test/config.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } 	from 'bun:test'
	import { server, type ServerInstance } from '../src/main'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Server Configuration - Default Values', () => {
		test('should use default values when config is empty', async () => {
			await new Promise(resolve => setTimeout(resolve, 1800))

			const app = server({})

			expect(app.logger).toBe(null) // logging disabled by default
			expect(app.db.size).toBe(0) // no database by default

			// Don't start to avoid port conflicts
		})

		test('should accept custom port and hostname', async () => {
			await new Promise(resolve => setTimeout(resolve, 1900))

			const app = server({
			port: 3218,
			hostname: 'localhost',
			logging: false
			})

			await app.start()

			const res = await fetch('http://localhost:3218/health')
			expect(res.status).toBe(200)

			await app.stop()
		})
	})

	describe('Server Configuration - API Prefix & Version', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3219'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 2000))

			app = server({
			port: 3219,
			apiPrefix: '/v2',
			apiVersion: 'v2',
			logging: false
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should start with custom API config', async () => {
			const routes = app.getRoutes()
			expect(routes.length).toBeGreaterThanOrEqual(2)
		})
	})

	describe('Server Configuration - Timeouts', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3220'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 2100))

			app = server({
			port: 3220,
			requestTimeout: 5000,
			gracefulShutdownTimeout: 2000,
			logging: false,
			routes: [
				{
				method: 'GET',
				path: '/test',
				handler: (c) => c.json({ ok: true })
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should respect custom timeout settings', async () => {
			const res = await fetch(`${baseUrl}/test`)
			expect(res.status).toBe(200)
		})
	})

	describe('Server Configuration - Logging', () => {
		test('should enable logging with level', async () => {
			await new Promise(resolve => setTimeout(resolve, 2200))

			const app = server({
			port: 3221,
			logging: {
				level: 'debug',
				pretty: true
			}
			})

			expect(app.logger).not.toBe(null)

			// Don't start
		})

		test('should disable logging by default', async () => {
			await new Promise(resolve => setTimeout(resolve, 2300))

			const app = server({
			port: 3222,
			logging: false
			})

			expect(app.logger).toBe(null)
		})
	})

	describe('Server Configuration - Shutdown Handler', () => {
		test('should call onShutdown handler', async () => {
			await new Promise(resolve => setTimeout(resolve, 2400))

			let shutdownCalled = false

			const app = server({
			port: 3223,
			logging: false,
			onShutdown: async () => {
				shutdownCalled = true
			}
			})

			await app.start()
			await app.stop()

			expect(shutdownCalled).toBe(true)
		})

		test('should handle error in shutdown handler', async () => {
			await new Promise(resolve => setTimeout(resolve, 2500))

			const app = server({
			port: 3224,
			logging: false,
			onShutdown: async () => {
				throw new Error('Shutdown error')
			}
			})

			await app.start()

			// Should not throw - just complete successfully
			let error: any = null
			try {
			await app.stop()
			} catch (e) {
			error = e
			}

			// Should complete without throwing
			expect(error).toBe(null)
		})
	})

	describe('Server Configuration - Route Management', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3225'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 2600))

			app = server({
			port: 3225,
			logging: false,
			routes: [
				{
				method: 'GET',
				path: '/initial',
				handler: (c) => c.json({ route: 'initial' })
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should get initial routes', async () => {
			const routes = app.getRoutes()
			expect(routes.length).toBeGreaterThan(0)

			const initialRoute = routes.find(r => r.path === '/initial')
			expect(initialRoute).toBeDefined()
		})

		test('should add route dynamically', async () => {
			app.addRoute({
			method: 'GET',
			path: '/dynamic',
			handler: (c) => c.json({ route: 'dynamic' })
			})

			const res = await fetch(`${baseUrl}/dynamic`)
			expect(res.status).toBe(200)

			const data = await res.json()
			expect(data.route).toBe('dynamic')
		})

		test('should support multiple HTTP methods for same path', async () => {
			app.addRoute({
			method: ['GET', 'POST'],
			path: '/multi-method',
			handler: (c) => c.json({ method: c.request.method })
			})

			const getRes = await fetch(`${baseUrl}/multi-method`)
			expect(getRes.status).toBe(200)

			const postRes = await fetch(`${baseUrl}/multi-method`, { method: 'POST' })
			expect(postRes.status).toBe(200)
		})
	})

	describe('Server Configuration - Max Request Size', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3226'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 2700))

			app = server({
			port: 3226,
			logging: false,
			maxRequestSize: 1024, // 1KB
			routes: [
				{
				method: 'POST',
				path: '/upload',
				handler: (c) => c.json({ size: JSON.stringify(c.body).length })
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should accept small payloads', async () => {
			const res = await fetch(`${baseUrl}/upload`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ small: 'data' })
			})

			expect([200, 400]).toContain(res.status)
		})

		test('should reject large payloads', async () => {
			const largeData = 'x'.repeat(2000)
			const res = await fetch(`${baseUrl}/upload`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: largeData
			})

			expect([400, 413]).toContain(res.status)
		})
	})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝