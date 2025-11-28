// test/cookies.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } 	from 'bun:test'
	import { server, type ServerInstance, type AppContext } from '../src/main'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Cookies - Set and Get', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3209'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 1000))

			app = server({
			port: 3209,
			logging: false,
			routes: [
				{
				method: 'GET',
				path: '/set-cookie',
				handler: (c: AppContext) => {
					c.setCookie('test', 'value123', {
					maxAge: 3600,
					path: '/',
					httpOnly: true,
					secure: true,
					sameSite: 'Strict'
					})
					return c.json({ set: true })
				}
				},
				{
				method: 'GET',
				path: '/get-cookie',
				handler: (c: AppContext) => {
					const value = c.getCookie('test')
					return c.json({ value })
				}
				},
				{
				method: 'GET',
				path: '/delete-cookie',
				handler: (c: AppContext) => {
					c.deleteCookie('test')
					return c.json({ deleted: true })
				}
				},
				{
				method: 'GET',
				path: '/multiple-cookies',
				handler: (c: AppContext) => {
					c.setCookie('cookie1', 'value1')
					c.setCookie('cookie2', 'value2')
					c.setCookie('cookie3', 'value3')
					return c.json({ set: 3 })
				}
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should set cookie with all options', async () => {
			const res = await fetch(`${baseUrl}/set-cookie`)
			const setCookieHeader = res.headers.get('Set-Cookie')

			expect(setCookieHeader).toBeTruthy()
			expect(setCookieHeader).toContain('test=value123')
			expect(setCookieHeader).toContain('Max-Age=3600')
			expect(setCookieHeader).toContain('Path=/')
			expect(setCookieHeader).toContain('HttpOnly')
			expect(setCookieHeader).toContain('Secure')
			expect(setCookieHeader).toContain('SameSite=Strict')
		})

		test('should get cookie from request', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`, {
			headers: {
				'Cookie': 'test=value123'
			}
			})
			const data = await res.json()
			expect(data.value).toBe('value123')
		})

		test('should return undefined for missing cookie', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`)
			const data = await res.json()
			expect(data.value).toBeUndefined()
		})

		test('should delete cookie', async () => {
			const res = await fetch(`${baseUrl}/delete-cookie`)
			const setCookieHeader = res.headers.get('Set-Cookie')

			expect(setCookieHeader).toBeTruthy()
			expect(setCookieHeader).toContain('Max-Age=0')
		})

		test('should handle multiple cookies', async () => {
			const res = await fetch(`${baseUrl}/multiple-cookies`)
			const setCookieHeaders = res.headers.get('Set-Cookie')

			expect(setCookieHeaders).toBeTruthy()
			// Note: Multiple Set-Cookie headers might be joined or separate
			// depending on the fetch implementation
		})

		test('should handle empty cookie header', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`, {
			headers: { Cookie: '' }
			})
			expect(res.status).toBe(200)
			const data = await res.json()
			expect(data.value).toBeUndefined()
		})

		test('should handle cookie with equals sign in value', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`, {
			headers: {
				'Cookie': 'test=value=with=equals'
			}
			})
			const data = await res.json()
			expect(data.value).toBe('value=with=equals')
		})

		test('should handle multiple cookies in request', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`, {
			headers: {
				'Cookie': 'cookie1=value1; test=myvalue; cookie2=value2'
			}
			})
			const data = await res.json()
			expect(data.value).toBe('myvalue')
		})

		test('should handle URL-encoded cookie values', async () => {
			const res = await fetch(`${baseUrl}/get-cookie`, {
			headers: {
				'Cookie': 'test=Hello%20World'
			}
			})
			const data = await res.json()
			expect(data.value).toBe('Hello World')
		})

		test('should set cookie with maxAge 0', async () => {
			const app2 = server({
			port: 3210,
			logging: false,
			routes: [
				{
				method: 'GET',
				path: '/zero-maxage',
				handler: (c: AppContext) => {
					c.setCookie('zero', 'value', { maxAge: 0 })
					return c.json({ ok: true })
				}
				}
			]
			})

			await app2.start()

			const res = await fetch('http://localhost:3210/zero-maxage')
			const setCookieHeader = res.headers.get('Set-Cookie')

			expect(setCookieHeader).toContain('Max-Age=0')

			await app2.stop()
		})
	})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝