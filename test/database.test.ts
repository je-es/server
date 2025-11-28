// test/database.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } 	from 'bun:test'
	import { server, type ServerInstance, type AppContext } from '../src/main'
	import { SQL } 											from 'bun'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Database - Bun SQL Single Connection', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3202'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 300))

			app = server({
				port: 3202,
				logging: false,
				database: {
					connection: ':memory:' // In-memory database for testing
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

	describe('Database - Bun SQL Multiple Connections', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3203'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 400))

			// SQL is a function in Bun, not a constructor
			// You pass it directly to Drizzle
			const sql1 = SQL // or SQL.open(':memory:') depending on Bun version
			const sql2 = SQL

			app = server({
				port: 3203,
				logging: false,
				database: [
					{
						name: 'default',
						connection: sql1
					},
					{
						name: 'analytics',
						connection: sql2
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

	describe('Database - Bun SQL with Schema', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3204'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 500))

			// Define a simple schema
			const { pgTable, serial, text } = await import('drizzle-orm/pg-core')

			const usersTable = pgTable('users', {
				id: serial('id').primaryKey(),
				name: text('name').notNull(),
				email: text('email').notNull()
			})

			app = server({
				port: 3204,
				logging: false,
				database: {
					connection: ':memory:',
					schema: { users: usersTable }
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

		test('should handle database with schema', async () => {
			expect(app.db.size).toBe(1)
			const res = await fetch(`${baseUrl}/test`)
			expect(res.status).toBe(200)
		})
	})

	describe('Database - Validation', () => {
		test('should throw error for invalid Bun SQL connection type', async () => {
			await new Promise(resolve => setTimeout(resolve, 700))

			expect(async () => {
				const app = server({
					port: 3206,
					logging: false,
					database: {
						connection: 123 as any // Invalid type
					}
				})
				await app.start()
				await app.stop()
			}).toThrow()
		})

		test('should throw error for unsupported database type', async () => {
			await new Promise(resolve => setTimeout(resolve, 800))

			expect(async () => {
				const app = server({
					port: 3207,
					logging: false,
					database: {
						type: 'mongodb' as any, // Unsupported type
						connection: 'mongodb://localhost:27017'
					}
				})
				await app.start()
				await app.stop()
			}).toThrow()
		})
	})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝