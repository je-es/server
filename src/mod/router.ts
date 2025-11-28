// lib/router.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

	export interface RegexRoute {
		pattern		: RegExp
		method		: string
		handler		: any
		key			: string
	}

	export type RegexRoutes = Array<RegexRoute>

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class Router {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

			private routes 			= new Map<string, any>()
			private regexRoutes		: RegexRoutes = []

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

			match(method: string, path: string): { handler: any; params: Record<string, string> } | null {
				const key = `${method}:${path}`

				// Try static route first (faster)
				if (this.routes.has(key)) {
				return { handler: this.routes.get(key), params: {} }
				}

				// Try dynamic routes
				for (const route of this.regexRoutes) {
				if (route.method === method) {
					const match = path.match(route.pattern)
					if (match?.groups) {
					return { handler: route.handler, params: match.groups }
					}
				}
				}

				return null
			}

			getAll() {
				const staticRoutes = Array.from(this.routes.entries()).map(([key, handler]) => {
				const colonIndex = key.indexOf(':')
				const method = key.substring(0, colonIndex)
				const path = key.substring(colonIndex + 1)
				return { method, path, handler }
				})

				const dynamicRoutes = this.regexRoutes.map(route => {
				const colonIndex = route.key.indexOf(':')
				return {
					method: route.method,
					path: route.key.substring(colonIndex + 1),
					handler: route.handler
				}
				})

				return [...staticRoutes, ...dynamicRoutes]
			}

			clear() {
				this.routes.clear()
				this.regexRoutes = []
			}

			remove(method: string, path: string): boolean {
				const key = `${method}:${path}`

				if (this.routes.has(key)) {
				this.routes.delete(key)
				return true
				}

				const index = this.regexRoutes.findIndex(r => r.key === key)
				if (index >= 0) {
				this.regexRoutes.splice(index, 1)
				return true
				}

				return false
			}

			register(method: string, path: string, handler: any, config: any = {}) {
				const key = `${method}:${path}`

				if (path.includes(':')) {
				// Dynamic route with params
				const pattern = this.pathToRegex(path)

				// Check if route already exists to prevent duplicates
				const existingIndex = this.regexRoutes.findIndex(r => r.key === key)

				const route = {
					pattern,
					method,
					handler,
					key
				}

				if (existingIndex >= 0) {
					// Update existing route
					this.regexRoutes[existingIndex] = route
				} else {
					// Add new route
					this.regexRoutes.push(route)
				}
				} else {
				// Static route
				this.routes.set(key, handler)
				}
			}

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

			private pathToRegex(path: string): RegExp {
				// Escape special regex characters except ':'
				const escaped = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
				// Replace :param with named capture groups
				const pattern = escaped.replace(/:(\w+)/g, '(?<$1>[^/]+)')
				return new RegExp(`^${pattern}$`)
			}

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
