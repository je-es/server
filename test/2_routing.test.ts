// test/2-routing.test.ts
//
// Tests for routing: dynamic routes, parameters, wildcards, route registration
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
	import { server, type ServerInstance, type AppContext } from '../src/main'
	import { Router } from '../src/mod/router'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Routing - Dynamic Routes', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3201'

		beforeAll(async () => {
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

		test('single parameter routes', async () => {
			const res = await fetch(`${baseUrl}/users/123`)
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.userId).toBe('123')
		})

		test('multiple parameter routes', async () => {
			const res = await fetch(`${baseUrl}/posts/456/comments/789`)
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.postId).toBe('456')
			expect(data.commentId).toBe('789')
		})

		test('complex parameter routes', async () => {
			const res = await fetch(`${baseUrl}/api/v2/products`)
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.version).toBe('v2')
			expect(data.resource).toBe('products')
		})

		test('parameters with special characters', async () => {
			const res = await fetch(`${baseUrl}/users/user-123-abc`)
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.userId).toBe('user-123-abc')
		})
	})

	describe('Routing - Route Management', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3202'

		beforeAll(async () => {
			app = server({
				port: 3202,
				logging: false,
				routes: [
					{
						method: 'GET',
						path: '/initial',
						handler: (c: AppContext) => c.json({ route: 'initial' })
					}
				]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('getRoutes - returns initial routes', async () => {
			const routes = app.getRoutes()
			expect(routes.length).toBeGreaterThan(0)

			const initialRoute = routes.find(r => r.path === '/initial')
			expect(initialRoute).toBeDefined()
		})

		test('addRoute - adds route dynamically', async () => {
			app.addRoute({
				method: 'GET',
				path: '/dynamic',
				handler: (c: AppContext) => c.json({ route: 'dynamic' })
			})

			const res = await fetch(`${baseUrl}/dynamic`)
			expect(res.status).toBe(200)

			const data = await res.json()
			expect(data.route).toBe('dynamic')
		})

		test('addRoute - supports multiple HTTP methods', async () => {
			app.addRoute({
				method: ['GET', 'POST'],
				path: '/multi-method',
				handler: (c: AppContext) => c.json({ method: c.request.method })
			})

			const getRes = await fetch(`${baseUrl}/multi-method`)
			expect(getRes.status).toBe(200)

			const postRes = await fetch(`${baseUrl}/multi-method`, { method: 'POST' })
			expect(postRes.status).toBe(200)
		})

		test('addRoutes - adds multiple routes at once', async () => {
			app.addRoutes([
				{
					method: 'GET',
					path: '/route1',
					handler: (c: AppContext) => c.json({ route: 1 })
				},
				{
					method: 'GET',
					path: '/route2',
					handler: (c: AppContext) => c.json({ route: 2 })
				}
			])

			const res1 = await fetch(`${baseUrl}/route1`)
			const data1 = await res1.json()
			expect(data1.route).toBe(1)

			const res2 = await fetch(`${baseUrl}/route2`)
			const data2 = await res2.json()
			expect(data2.route).toBe(2)
		})
	})

	describe('Routing - Router Class Unit Tests', () => {
		test('register and match static routes', () => {
			const router = new Router()
			const handler = () => ({} as any)
			
			router.register('GET', '/static', handler)

			const match = router.match('GET', '/static')
			expect(match).toBeDefined()
			expect(match?.params).toEqual({})
		})

		test('register and match dynamic routes', () => {
			const router = new Router()
			const handler = () => ({} as any)
			
			router.register('GET', '/users/:id', handler)

			const match = router.match('GET', '/users/123')
			expect(match).toBeDefined()
			expect(match?.params.id).toBe('123')
		})

		test('match returns null for non-matching method', () => {
			const router = new Router()
			const handler = () => ({} as any)
			
			router.register('GET', '/test', handler, {})

			const match = router.match('POST', '/test')
			expect(match).toBe(null)
		})

		test('match returns null for non-matching path', () => {
			const router = new Router()
			const handler = () => ({} as any)
			
			router.register('GET', '/test', handler, {})

			const match = router.match('GET', '/other')
			expect(match).toBe(null)
		})

		test('getAll returns all registered routes', () => {
			const router = new Router()
			const handler = () => ({} as any)
			
			router.register('GET', '/test1', handler)
			router.register('GET', '/test2', handler)
			router.register('GET', '/dynamic/:id', handler)

			const allRoutes = router.getAll()
			expect(allRoutes.length).toBe(3)
		})

		test('remove - removes static route', () => {
			const router = new Router()
			const handler = () => ({} as any)
			
			router.register('GET', '/test', handler)
			expect(router.remove('GET', '/test')).toBe(true)
			expect(router.match('GET', '/test')).toBe(null)
		})

		test('remove - removes dynamic route', () => {
			const router = new Router()
			const handler = () => ({} as any)
			
			router.register('GET', '/dynamic/:id', handler)
			expect(router.remove('GET', '/dynamic/:id')).toBe(true)
			expect(router.match('GET', '/dynamic/123')).toBe(null)
		})

		test('remove - returns false for non-existent route', () => {
			const router = new Router()
			expect(router.remove('GET', '/nonexistent')).toBe(false)
		})

		test('clear - removes all routes', () => {
			const router = new Router()
			const handler = () => ({} as any)
			
			router.register('GET', '/test1', handler)
			router.register('GET', '/test2', handler)
			router.register('GET', '/dynamic/:id', handler)

			router.clear()

			expect(router.match('GET', '/test1')).toBe(null)
			expect(router.match('GET', '/test2')).toBe(null)
			expect(router.match('GET', '/dynamic/123')).toBe(null)
		})

		test('handles route updates without duplicates', () => {
			const router = new Router()
			const handler1 = () => 'first' as any
			const handler2 = () => 'second' as any

			router.register('GET', '/dynamic/:id', handler1)
			router.register('GET', '/dynamic/:id', handler2)

			const allRoutes = router.getAll()
			const dynamicRoutes = allRoutes.filter((r: any) => r.path === '/dynamic/:id')

			expect(dynamicRoutes.length).toBe(1)
		})

		test('pathToRegex - handles wildcards', () => {
			const router = new Router()
			const handler = () => ({} as any)

			router.register('GET', '/files/*', handler)

			const match = router.match('GET', '/files/path/to/file.txt')
			expect(match).toBeTruthy()
		})
	})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
