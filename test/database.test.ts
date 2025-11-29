// test/database.test.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

	import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
	import {
		server,
		type ServerInstance,
		type AppContext,
		table,
		integer,
		text,
		primaryKey,
		notNull
	} from '../src/main'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TEST ════════════════════════════════════════╗

	describe('Database - Single Connection', () => {
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

	describe('Database - Multiple Connections', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3203'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 400))

			app = server({
				port: 3203,
				logging: false,
				database: [
					{
						name: 'default',
						connection: ':memory:'
					},
					{
						name: 'analytics',
						connection: ':memory:'
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

	describe('Database - With Schema', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3204'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 500))

			// Define schema using our custom solution
			const users = table('users', [
				primaryKey(integer('id'), true),
				notNull(text('name')),
				notNull(text('email'))
			])

			app = server({
				port: 3204,
				logging: false,
				database: {
					connection: ':memory:',
					schema: { users }
				},
				routes: [
					{
						method: 'GET',
						path: '/test',
						handler: (c: AppContext) => c.json({ ok: true })
					},
					{
						method: 'POST',
						path: '/users',
						handler: (c: AppContext) => {
							const user = c.db.insert('users', c.body)
							return c.json(user)
						}
					},
					{
						method: 'GET',
						path: '/users',
						handler: (c: AppContext) => {
							const users = c.db.all('users')
							return c.json(users)
						}
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

		test('should insert and retrieve data', async () => {
			// Insert a user
			const insertRes = await fetch(`${baseUrl}/users`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Test User',
					email: 'test@example.com'
				})
			})
			const insertData = await insertRes.json()
			expect(insertRes.status).toBe(200)
			expect(insertData.name).toBe('Test User')
			expect(insertData.email).toBe('test@example.com')

			// Get all users
			const getRes = await fetch(`${baseUrl}/users`)
			const getData = await getRes.json()
			expect(Array.isArray(getData)).toBe(true)
			expect(getData.length).toBeGreaterThan(0)
		})
	})

	describe('Database - CRUD Operations', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3205'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 600))

			const products = table('products', [
				primaryKey(integer('id'), true),
				notNull(text('name')),
				text('description'),
				integer('price'),
				integer('stock')
			])

			app = server({
				port: 3205,
				logging: false,
				database: {
					connection: ':memory:',
					schema: { products }
				},
				routes: [
					{
						method: 'POST',
						path: '/products',
						handler: (c: AppContext) => {
							const product = c.db.insert('products', c.body)
							return c.json(product)
						}
					},
					{
						method: 'GET',
						path: '/products/:id',
						handler: (c: AppContext) => {
							const product = c.db.findById('products', parseInt(c.params.id))
							if (!product) return c.status(404).json({ error: 'Not found' })
							return c.json(product)
						}
					},
					{
						method: 'PUT',
						path: '/products/:id',
						handler: (c: AppContext) => {
							const product = c.db.update('products', parseInt(c.params.id), c.body)
							if (!product) return c.status(404).json({ error: 'Not found' })
							return c.json(product)
						}
					},
					{
						method: 'DELETE',
						path: '/products/:id',
						handler: (c: AppContext) => {
							c.db.delete('products', parseInt(c.params.id))
							return c.json({ deleted: true })
						}
					}
				]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should create a product', async () => {
			const res = await fetch(`${baseUrl}/products`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Laptop',
					description: 'Gaming laptop',
					price: 1500,
					stock: 10
				})
			})
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.id).toBeDefined()
			expect(data.name).toBe('Laptop')
		})

		test('should read a product', async () => {
			// Create first
			const createRes = await fetch(`${baseUrl}/products`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Mouse',
					price: 50,
					stock: 100
				})
			})
			const created = await createRes.json()

			// Read
			const res = await fetch(`${baseUrl}/products/${created.id}`)
			const data = await res.json()
			expect(res.status).toBe(200)
			expect(data.name).toBe('Mouse')
		})

		test('should update a product', async () => {
			// Create first
			const createRes = await fetch(`${baseUrl}/products`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Keyboard',
					price: 100,
					stock: 50
				})
			})
			const created = await createRes.json()

			// Update
			const updateRes = await fetch(`${baseUrl}/products/${created.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Mechanical Keyboard',
					price: 150
				})
			})
			const updated = await updateRes.json()
			expect(updateRes.status).toBe(200)
			expect(updated.name).toBe('Mechanical Keyboard')
			expect(updated.price).toBe(150)
		})

		test('should delete a product', async () => {
			// Create first
			const createRes = await fetch(`${baseUrl}/products`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: 'Monitor',
					price: 300,
					stock: 20
				})
			})
			const created = await createRes.json()

			// Delete
			const deleteRes = await fetch(`${baseUrl}/products/${created.id}`, {
				method: 'DELETE'
			})
			const deleteData = await deleteRes.json()
			expect(deleteRes.status).toBe(200)
			expect(deleteData.deleted).toBe(true)

			// Verify deleted
			const getRes = await fetch(`${baseUrl}/products/${created.id}`)
			expect(getRes.status).toBe(404)
		})
	})

	describe('Database - Validation', () => {
		test('should throw error for invalid connection type', async () => {
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

		test('should handle file-based connection', async () => {
			await new Promise(resolve => setTimeout(resolve, 800))

			const app = server({
				port: 3207,
				logging: false,
				database: {
					connection: './test-db.sqlite' // File-based
				}
			})

			await app.start()
			expect(app.db.size).toBe(1)
			await app.stop()

			// Cleanup test database file
			try {
				await Bun.write('./test-db.sqlite', '')
			} catch (e) {
				// Ignore cleanup errors
			}
		})
	})

	describe('Database - Query Builder', () => {
		let app: ServerInstance
		const baseUrl = 'http://localhost:3208'

		beforeAll(async () => {
			await new Promise(resolve => setTimeout(resolve, 900))

			const users = table('users', [
				primaryKey(integer('id'), true),
				notNull(text('name')),
				integer('age')
			])

			app = server({
				port: 3208,
				logging: false,
				database: {
					connection: ':memory:',
					schema: { users }
				},
				routes: [
					{
						method: 'POST',
						path: '/seed',
						handler: (c: AppContext) => {
							c.db.insert('users', { name: 'Alice', age: 25 })
							c.db.insert('users', { name: 'Bob', age: 30 })
							c.db.insert('users', { name: 'Charlie', age: 35 })
							return c.json({ seeded: true })
						}
					},
					{
						method: 'GET',
						path: '/users/age-filter',
						handler: (c: AppContext) => {
							const minAge = parseInt(c.query.min || '0')
							const users = c.db.query()
								.select()
								.from('users')
								.where({ column: 'age', operator: '>=', value: minAge })
								.orderBy('age', 'ASC')
								.execute()
							return c.json(users)
						}
					}
				]
			})

			await app.start()
		})

		afterAll(async () => {
			await app.stop()
		})

		test('should filter users by age', async () => {
			// Seed data
			await fetch(`${baseUrl}/seed`, { method: 'POST' })

			// Filter
			const res = await fetch(`${baseUrl}/users/age-filter?min=30`)
			const data = await res.json()
			expect(Array.isArray(data)).toBe(true)
			expect(data.length).toBe(2) // Bob and Charlie
			expect(data[0].age).toBeGreaterThanOrEqual(30)
		})
	})

// ╚══════════════════════════════════════════════════════════════════════════════════════╝