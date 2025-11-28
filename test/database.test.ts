// test/database.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } 	from 'bun:test'
	import { server, type ServerInstance, type AppContext } from '../src/main'
	import { Database } 									from 'bun:sqlite'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Database - Single Connection', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3202'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 300))

			const sqlite = new Database(':memory:')

			app = server({
			port: 3202,
			logging: false,
			database: {
				type: 'sqlite',
				connection: sqlite
			},
			routes: [
				{
				method: 'GET',
				path: '/db-check',
				handler: (c: AppContext) => {
					return c.json({
					hasDb: !!c.db,
					dbType: typeof c.db
					})
				}
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should have database connection in context', async () => {
			const res = await fetch(`${baseUrl}/db-check`)
			const data = await res.json()
			expect(data.hasDb).toBe(true)
			expect(data.dbType).toBe('object')
		})

		test('should show database connected in readiness check', async () => {
			const res = await fetch(`${baseUrl}/readiness`)
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.checks.database).toBe('connected')
		})
	})

	describe('Database - Multiple Connections', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3203'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 400))

			const sqlite1 = new Database(':memory:')
			const sqlite2 = new Database(':memory:')

			app = server({
			port: 3203,
			logging: false,
			database: [
				{
				type: 'sqlite',
				name: 'default',
				connection: sqlite1
				},
				{
				type: 'sqlite',
				name: 'secondary',
				connection: sqlite2
				}
			],
			routes: [
				{
				method: 'GET',
				path: '/db-count',
				handler: (c: AppContext) => {
					return c.json({
					hasDb: !!c.db,
					dbCount: app.db.size
					})
				}
				}
			]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should support multiple database connections', async () => {
			const res = await fetch(`${baseUrl}/db-count`)
			const data = await res.json()
			expect(data.hasDb).toBe(true)
			expect(data.dbCount).toBe(2)
		})
	})

	describe('Database - String Connection', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3204'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 500))

			app = server({
			port: 3204,
			logging: false,
			database: {
				type: 'sqlite',
				connection: ':memory:'
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

		test('should handle string database connection', async () => {
			expect(app.db.size).toBe(1)
			const res = await fetch(`${baseUrl}/test`)
			expect(res.status).toBe(200)
		})
	})

	describe('Database - Validation', () => {
		test('should throw error for invalid SQLite connection type', async () => {
			await new Promise(resolve => setTimeout(resolve, 600))

			expect(async () => {
			const app = server({
				port: 3205,
				logging: false,
				database: {
				type: 'sqlite',
				connection: 123 as any // Invalid type
				}
			})
			await app.start()
			await app.stop()
			}).toThrow()
		})
		})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝