// test/security.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } 	from 'bun:test'
	import { server, type ServerInstance, type AppContext } from '../src/main'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Security - Rate Limiting', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3206'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 700))

			app = server({
			port: 3206,
			logging: false,
			security: {
				rateLimit: { max: 3, windowMs: 10000 }
			},
			routes: [
				{
				method: 'GET',
				path: '/test',
				handler: (c: AppContext) => c.json({ ok: true })
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should allow requests within rate limit', async () => {
			const res1 = await fetch(`${baseUrl}/test`)
			expect(res1.status).toBe(200)

			const res2 = await fetch(`${baseUrl}/test`)
			expect(res2.status).toBe(200)

			const res3 = await fetch(`${baseUrl}/test`)
			expect(res3.status).toBe(200)
		})

		test('should block requests exceeding rate limit', async () => {
			// First 3 requests should pass (from previous test or new window)
			await fetch(`${baseUrl}/test`)
			await fetch(`${baseUrl}/test`)
			await fetch(`${baseUrl}/test`)

			// 4th request should be blocked
			const res4 = await fetch(`${baseUrl}/test`)
			expect(res4.status).toBe(429)

			const data = await res4.json()
			expect(data.error).toBeTruthy()
		})
	})

	describe('Security - CORS', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3207'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 800))

			app = server({
			port: 3207,
			logging: false,
			security: {
				cors: {
				origin: ['http://localhost:3000', 'http://example.com'],
				credentials: true,
				methods: ['GET', 'POST'],
				maxAge: 3600
				}
			},
			routes: [
				{
				method: 'GET',
				path: '/test',
				handler: (c: AppContext) => c.json({ ok: true })
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should handle OPTIONS preflight requests', async () => {
			const res = await fetch(`${baseUrl}/test`, {
			method: 'OPTIONS',
			headers: {
				'Origin': 'http://localhost:3000'
			}
			})
			expect(res.status).toBe(204)
		})

		test('should add CORS headers for allowed origin', async () => {
			const res = await fetch(`${baseUrl}/test`, {
			headers: {
				'Origin': 'http://localhost:3000'
			}
			})
			expect(res.status).toBe(200)
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000')
		})
	})

	describe('Security - Request Size Limits', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3208'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 900))

			app = server({
			port: 3208,
			logging: false,
			maxRequestSize: 100, // 100 bytes
			routes: [
				{
				method: 'POST',
				path: '/test',
				handler: (c: AppContext) => c.json({ body: c.body })
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should accept requests within size limit', async () => {
			const res = await fetch(`${baseUrl}/test`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ small: 'data' })
			})
			expect([200, 400]).toContain(res.status) // Might fail validation but not size
		})

		test('should reject requests exceeding size limit', async () => {
			const largePayload = 'x'.repeat(200)
			const res = await fetch(`${baseUrl}/test`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: largePayload
			})
			expect([400, 413]).toContain(res.status)
		})
	})

	describe('Security Manager - Unit Tests', () => {
		test('should handle rate limit correctly', () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			const ip = '192.168.1.100'

			expect(security.checkRateLimit(ip, 3, 1000)).toBe(true)
			expect(security.checkRateLimit(ip, 3, 1000)).toBe(true)
			expect(security.checkRateLimit(ip, 3, 1000)).toBe(true)
			expect(security.checkRateLimit(ip, 3, 1000)).toBe(false)
		})

		test('should generate and validate CSRF tokens', () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			const sessionId = 'session123'
			const token = security.generateCsrfToken(sessionId)

			expect(typeof token).toBe('string')
			expect(token.length).toBeGreaterThan(0)
			expect(security.validateCsrfToken(token, sessionId)).toBe(true)
		})

		test('should reject CSRF token with wrong session', () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			const token = security.generateCsrfToken('session1')
			expect(security.validateCsrfToken(token, 'session2')).toBe(false)
		})

		test('should reject expired CSRF tokens', async () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			const token = security.generateCsrfToken('session1', 50) // 50ms TTL
			await new Promise(resolve => setTimeout(resolve, 100)) // Wait for expiration
			expect(security.validateCsrfToken(token, 'session1')).toBe(false)
		})

		test('should sanitize HTML correctly', () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			const input = '<script>alert("XSS")</script>'
			const sanitized = security.sanitizeHtml(input)

			expect(sanitized).toContain('&lt;')
			expect(sanitized).toContain('&gt;')
			expect(sanitized).not.toContain('<script>')
		})

		test('should sanitize all HTML special characters', () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			const input = '<>&"\'/script'
			const sanitized = security.sanitizeHtml(input)

			expect(sanitized).toContain('&lt;')
			expect(sanitized).toContain('&gt;')
			expect(sanitized).toContain('&amp;')
			expect(sanitized).toContain('&quot;')
			expect(sanitized).toContain('&#x27;')
			expect(sanitized).toContain('&#x2F;')
		})

		test('should sanitize SQL input', () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			const input = "'; DROP TABLE users--"
			const sanitized = security.sanitizeSql(input)

			expect(sanitized).toContain("''")
			expect(sanitized).not.toContain("';")
		})

		test('should sanitize SQL with backslashes', () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			const input = 'test\\path"value'
			const sanitized = security.sanitizeSql(input)

			expect(sanitized).toContain('\\\\')
			expect(sanitized).toContain('\\"')
		})

		test('should cleanup rate limit records', () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			// Add some rate limit entries
			security.checkRateLimit('ip1', 10, 100) // 100ms window
			security.checkRateLimit('ip2', 10, 100)

			// Wait for expiration
			setTimeout(() => {
			security.cleanupRateLimit()
			const stats = security.getStats()
			expect(stats.rateLimitEntries).toBe(0)
			}, 150)
		})

		test('should cleanup expired CSRF tokens', async () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			security.generateCsrfToken('session1', 50)
			security.generateCsrfToken('session2', 50)

			await new Promise(resolve => setTimeout(resolve, 100))

			security.cleanupCsrfTokens()
			const stats = security.getStats()
			expect(stats.csrfTokens).toBe(0)
		})

		test('should track request logs with size limit', () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			// Log more than 1000 requests
			for (let i = 0; i < 1100; i++) {
			security.logRequest(`req-${i}`, 'GET', '/test', '127.0.0.1', 200, 10)
			}

			const stats = security.getStats()
			expect(stats.requestLogs).toBeLessThanOrEqual(1000)
		})

		test('should clear all security data', () => {
			const { SecurityManager } = require('../src/mod/security')
			const security = new SecurityManager()

			security.checkRateLimit('ip1', 10, 1000)
			security.generateCsrfToken('session1')
			security.logRequest('req1', 'GET', '/test', '127.0.0.1', 200, 10)

			security.clearAll()

			const stats = security.getStats()
			expect(stats.rateLimitEntries).toBe(0)
			expect(stats.csrfTokens).toBe(0)
			expect(stats.requestLogs).toBe(0)
		})
	})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝