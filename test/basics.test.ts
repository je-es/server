// test/basic.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } 	from 'bun:test'
	import { server, type ServerInstance, type AppContext } from '../src/main'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Basic HTTP Methods', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3200'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 100))

			app = server({
			port: 3200,
			logging: false,
			routes: [
				{
				method: 'GET',
				path: '/test',
				handler: (c: AppContext) => c.json({ method: 'GET' })
				},
				{
				method: 'POST',
				path: '/test',
				handler: (c: AppContext) => c.json({ method: 'POST', body: c.body })
				},
				{
				method: 'PUT',
				path: '/update',
				handler: (c: AppContext) => c.json({ method: 'PUT', body: c.body })
				},
				{
				method: 'PATCH',
				path: '/patch',
				handler: (c: AppContext) => c.json({ method: 'PATCH', body: c.body })
				},
				{
				method: 'DELETE',
				path: '/delete',
				handler: (c: AppContext) => c.json({ method: 'DELETE' })
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should handle GET requests', async () => {
			const res = await fetch(`${baseUrl}/test`)
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.method).toBe('GET')
		})

		test('should handle POST requests with JSON body', async () => {
			const res = await fetch(`${baseUrl}/test`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ test: 'data' })
			})
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.method).toBe('POST')
			expect(data.body).toEqual({ test: 'data' })
		})

		test('should handle PUT requests', async () => {
			const res = await fetch(`${baseUrl}/update`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ update: true })
			})
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.method).toBe('PUT')
			expect(data.body).toEqual({ update: true })
		})

		test('should handle PATCH requests', async () => {
			const res = await fetch(`${baseUrl}/patch`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ field: 'value' })
			})
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.method).toBe('PATCH')
			expect(data.body).toEqual({ field: 'value' })
		})

		test('should handle DELETE requests', async () => {
			const res = await fetch(`${baseUrl}/delete`, { method: 'DELETE' })
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.method).toBe('DELETE')
		})

		test('should handle empty JSON body', async () => {
			const res = await fetch(`${baseUrl}/test`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: ''
			})
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.body).toEqual({})
		})

		test('should handle requests with no content-type', async () => {
			const res = await fetch(`${baseUrl}/update`, {
			method: 'PUT',
			body: 'plain text data'
			})
			const data = await res.json()
			expect(data.body).toEqual({})
		})

		test('should return 404 for non-existent routes', async () => {
			const res = await fetch(`${baseUrl}/nonexistent`)
			expect(res.status).toBe(404)
			const data = await res.json()
			expect(data.error).toBe('Not Found')
		})
	})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝