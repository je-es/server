// test/routing.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } 	from 'bun:test'
	import { server, type ServerInstance, type AppContext } from '../src/main'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Router - Dynamic Routes', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3201'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 200))

			app = server({
			port: 3201,
			logging: false,
			routes: [
				{
				method: 'GET',
				path: '/users/:id',
				handler: (c: AppContext) => c.json({ userId: c.params.id })
				},
				{
				method: 'GET',
				path: '/posts/:postId/comments/:commentId',
				handler: (c: AppContext) => c.json({
					postId: c.params.postId,
					commentId: c.params.commentId
				})
				},
				{
				method: 'GET',
				path: '/api/:version/:resource',
				handler: (c: AppContext) => c.json({
					version: c.params.version,
					resource: c.params.resource
				})
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should match single parameter routes', async () => {
			const res = await fetch(`${baseUrl}/users/123`)
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.userId).toBe('123')
		})

		test('should match multiple parameter routes', async () => {
			const res = await fetch(`${baseUrl}/posts/456/comments/789`)
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.postId).toBe('456')
			expect(data.commentId).toBe('789')
		})

		test('should match complex parameter routes', async () => {
			const res = await fetch(`${baseUrl}/api/v2/products`)
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.version).toBe('v2')
			expect(data.resource).toBe('products')
		})

		test('should handle parameters with special characters', async () => {
			const res = await fetch(`${baseUrl}/users/user-123-abc`)
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.userId).toBe('user-123-abc')
		})

		test('should return 404 for partial matches', async () => {
			const res = await fetch(`${baseUrl}/users`)
			expect(res.status).toBe(404)
		})
	})

	describe('Router - Unit Tests', () => {
		test('should register and match static routes', () => {
			const { Router } = require('../src/mod/router')
			const router = new Router()

			const handler = () => 'test'
			router.register('GET', '/static', handler)

			const match = router.match('GET', '/static')
			expect(match).toBeDefined()
			expect(match?.params).toEqual({})
		})

		test('should register and match dynamic routes', () => {
			const { Router } = require('../src/mod/router')
			const router = new Router()

			const handler = () => 'test'
			router.register('GET', '/users/:id', handler)

			const match = router.match('GET', '/users/123')
			expect(match).toBeDefined()
			expect(match?.params.id).toBe('123')
		})

		test('should return null for non-matching method', () => {
			const { Router } = require('../src/mod/router')
			const router = new Router()

			router.register('GET', '/test', () => 'handler', {})

			const match = router.match('POST', '/test')
			expect(match).toBe(null)
		})

		test('should return null for non-matching path', () => {
			const { Router } = require('../src/mod/router')
			const router = new Router()

			router.register('GET', '/test', () => 'handler', {})

			const match = router.match('GET', '/other')
			expect(match).toBe(null)
		})

		test('should handle route updates without duplicates', () => {
			const { Router } = require('../src/mod/router')
			const router = new Router()

			const handler1 = () => 'first'
			const handler2 = () => 'second'

			router.register('GET', '/dynamic/:id', handler1)
			router.register('GET', '/dynamic/:id', handler2)

			const allRoutes = router.getAll()
			const dynamicRoutes = allRoutes.filter((r: any) => r.path === '/dynamic/:id')

			// Should only have one route, not duplicates
			expect(dynamicRoutes.length).toBe(1)
		})

		test('should remove routes correctly', () => {
			const { Router } = require('../src/mod/router')
			const router = new Router()

			router.register('GET', '/test', () => 'handler')
			router.register('GET', '/dynamic/:id', () => 'handler')

			expect(router.remove('GET', '/test')).toBe(true)
			expect(router.remove('GET', '/dynamic/:id')).toBe(true)
			expect(router.remove('GET', '/nonexistent')).toBe(false)
		})

		test('should clear all routes', () => {
			const { Router } = require('../src/mod/router')
			const router = new Router()

			router.register('GET', '/test1', () => 'handler')
			router.register('GET', '/test2', () => 'handler')
			router.register('GET', '/dynamic/:id', () => 'handler')

			router.clear()

			expect(router.match('GET', '/test1')).toBe(null)
			expect(router.match('GET', '/test2')).toBe(null)
			expect(router.match('GET', '/dynamic/123')).toBe(null)
		})
	})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝