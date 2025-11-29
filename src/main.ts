// src/main.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { DB }               from './mod/db'
    import { Router }           from './mod/router'
    import { SecurityManager }  from './mod/security'
    import { Logger }       	from './mod/logger'
    import * as types           from './types.d'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ INIT ════════════════════════════════════════╗

    const security  = new SecurityManager()
    const router    = new Router()

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export function server(config: types.ServerConfig = {}): types.ServerInstance {

		// ════════ Configuration ════════
		const port                      = config.port || 3000
		const hostname                  = config.hostname || 'localhost'
		const maxReqSize                = config.maxRequestSize || 10 * 1024 * 1024
		const requestTimeout            = config.requestTimeout || 30000
		const gracefulShutdownTimeout   = config.gracefulShutdownTimeout || 10000

		const logCfg                    = typeof config.logging === 'object' ? config.logging : {}
		const logger                    = config.logging ? new Logger(logCfg.level || 'info', logCfg.pretty) : null

		const dbs                       = new Map<string, any>()
		const routes: types.RouteDefinition[] = []
		const activeRequests            = new Set<string>()

		// ════════ Cleanup intervals ════════
        const cleanupInterval = setInterval(() => {
            security.cleanupRateLimit()
            security.cleanupCsrfTokens()
        }, 2 * 60 * 1000)

        async function handleRequest(request: Request): Promise<Response> {
            const startTime = Date.now()
            const requestId = crypto.randomUUID()
            const url       = new URL(request.url)
            const path      = url.pathname
            const method    = request.method.toUpperCase()
            const ip        = getClientIp(request)

            activeRequests.add(requestId)

            try {
                // Check request size from header
                const contentLength = request.headers.get('content-length')
                if (contentLength && parseInt(contentLength) > maxReqSize) {

                    logger?.warn({ requestId, size: contentLength, ip }, 'Request too large')

                    return new Response(JSON.stringify({ error: 'Payload too large' }), {
						status	: 413,
						headers	: { 'Content-Type': 'application/json' }
                    })
                }

                // CORS handling
                const corsHeaders = handleCors(request, config)
                if (method === 'OPTIONS') {
                    return new Response(null, { status: 204, headers: corsHeaders })
                }

                // Rate limiting
                if (config.security && typeof config.security === 'object' && config.security.rateLimit) {
                    const rateLimitCfg = typeof config.security.rateLimit === 'object'
                    ? config.security.rateLimit
                    : {}
                    const max           = rateLimitCfg.max || 100
                    const windowMs      = rateLimitCfg.windowMs || 60000
                    const rateLimitKey  = rateLimitCfg.keyGenerator
                    ? rateLimitCfg.keyGenerator({ request, ip } as any)
                    : ip

                    if (!security.checkRateLimit(rateLimitKey, max, windowMs)) {
                    logger?.warn({ requestId, ip, key: rateLimitKey }, 'Rate limit exceeded')
                    return new Response(
                        JSON.stringify({ error: rateLimitCfg.message || 'Too many requests' }),
                        { status: 429, headers: { 'Content-Type': 'application/json' } }
                    )
                    }
                }

                // Parse body
                let body: any = null
                if (['POST', 'PUT', 'PATCH'].includes(method)) {
                    body = await parseBody(request, logger, maxReqSize)
                }

                // Get database
                const defaultDb = dbs.get('default')

                // Match route
                const routeMatch = router.match(method, path)
                if (!routeMatch) {
                    const ctx = createAppContext(request, {}, defaultDb, logger, requestId)
                    logger?.warn({ requestId, method, path, ip }, 'Route not found')
                    return ctx.json({ error: 'Not Found', path }, 404)
                }

                const ctx = createAppContext(request, routeMatch.params || {}, defaultDb, logger, requestId)
                ctx.body = body
                ctx.request = request

                // Execute route handler with timeout
                const controller = new AbortController()
                const timeoutPromise = new Promise<never>((_, reject) => {
                    const id = setTimeout(() => {
                    controller.abort()
                    reject(new types.TimeoutError('Request timeout'))
                    }, requestTimeout)
                    controller.signal.addEventListener('abort', () => clearTimeout(id))
                })

                const response = await Promise.race([
                    routeMatch.handler(ctx),
                    timeoutPromise
                ]) as Response

                // Merge CORS and security headers
                const resHeaders = new Headers(response.headers)
                corsHeaders.forEach((value, key) => {
                    if (!resHeaders.has(key)) resHeaders.set(key, value)
                })

                resHeaders.set('X-Request-ID', requestId)
                resHeaders.set('X-Content-Type-Options', 'nosniff')
                resHeaders.set('X-Frame-Options', 'DENY')
                resHeaders.set('X-XSS-Protection', '1; mode=block')
                resHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')

                // Audit log
                const duration = Date.now() - startTime
                security.logRequest(requestId, method, path, ip, response.status, duration)
                logger?.info({
                    requestId,
                    method,
                    path,
                    status: response.status,
                    duration,
                    ip
                }, 'Request completed')

                return new Response(response.body, {
                    status: response.status,
                    headers: resHeaders
                })
            } catch (error) {
                if (error instanceof types.AppError) {
                    logger?.warn({ error: error.message, requestId, ip }, `App error: ${error.message}`)
                    return new Response(
                    JSON.stringify({
                        error	: error.message,
                        code	: error.code,
                        requestId
                    }),
                    { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
                    )
                }

                logger?.error({ error: String(error), requestId, ip }, 'Unhandled error')

                const errorMessage = process.env.NODE_ENV === 'production'
                    ? 'Internal Server Error'
                    : (error as Error).message

                return new Response(
                    JSON.stringify({ error: errorMessage, requestId }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                )
            } finally {
                activeRequests.delete(requestId)
            }
        }

        // ════════ Health & Readiness routes ════════
        const healthRoute: types.RouteDefinition = {
            method              : 'GET',
            path                : '/health',
            handler             : (c: types.AppContext) => c.json({
                status          : 'healthy',
                timestamp       : new Date().toISOString(),
                uptime          : process.uptime(),
                activeRequests  : activeRequests.size
            })
        }

        const readinessRoute: types.RouteDefinition = {
            method      : 'GET',
            path        : '/readiness',
            handler     : (c: types.AppContext) => {
                const dbConnected = dbs.size > 0
                const ready = dbConnected || dbs.size === 0
                return c.json({
                    ready,
                    checks          : {
                    database        : dbConnected ? 'connected' : 'not configured',
                    activeRequests  : activeRequests.size
                    },
                    timestamp: new Date().toISOString()
                }, ready ? 200 : 503)
            }
        }

        // ════════ Register routes ════════
        if (config.routes) {
                config.routes.forEach(route => {
                routes.push(route)
                const methods = Array.isArray(route.method) ? route.method : [route.method]
                methods.forEach(m => {
                    router.register(m, route.path, route.handler, route)
                })
            })
        }

        routes.push(healthRoute, readinessRoute)
        router.register('GET', '/health', healthRoute.handler, healthRoute)
        router.register('GET', '/readiness', readinessRoute.handler, readinessRoute)

        let bunServer: any = null

        const instance: types.ServerInstance = {
            app         : null,
            logger,
            db          : dbs,
            bunServer   : null,

            async start() {
                // Initialize databases with our custom DB solution
                if (config.database) {
                    const dbConfigs = Array.isArray(config.database) ? config.database : [config.database]
                    for (const dbCfg of dbConfigs) {
                        const dbName = dbCfg.name || 'default'

                        try {
                            if (typeof dbCfg.connection === 'string') {
                                // Create DB instance with connection string
                                const db = new DB(dbCfg.connection)

                                // Define schemas if provided
                                if (dbCfg.schema && typeof dbCfg.schema === 'object') {
                                    for (const [tableName, tableSchema] of Object.entries(dbCfg.schema)) {
                                        if (tableSchema && typeof tableSchema === 'object') {
                                            db.defineSchema(tableSchema as any)
                                        }
                                    }
                                }

                                dbs.set(dbName, db)

                                logger?.info({
                                    name: dbName,
                                    connection: dbCfg.connection
                                }, '✅ Database connected')
                            } else {
                                throw new Error(`Database connection must be a string path (got ${typeof dbCfg.connection})`)
                            }
                        } catch (error) {
                            logger?.error({
                                error: String(error),
                                name: dbName
                            }, 'Failed to connect to database')
                            throw error
                        }
                    }
                }

                bunServer = Bun.serve({ port, hostname, fetch: handleRequest })
                instance.bunServer = bunServer

                const url = `http://${hostname}:${port}`
                console.log(
                    `→ URL:          ${url}` + `\n` +
                    `→ Environment:  ${(process.env.NODE_ENV || 'development')}` + `\n` +
                    `→ Routes:       ${routes.length.toString()}` + `\n` +
                    `→ Database:     ${(dbs.size > 0 ? '✅ Connected' : '❌ None')}` + `\n` +
                    `→ Security:     ${(config.security ? '✅ ENABLED' : '❌ Disabled')}` + `\n` +
                        `\n` +
                    `🔍 Health:    ${url}/health` + `\n` +
                    `🔍 Ready:     ${url}/readiness`+  `\n`
                )

                logger?.info({ url }, 'Server started')
            },

            async stop() {
                logger?.info('Stopping server...')

                // Wait for active requests to complete
                if (activeRequests.size > 0) {
                    logger?.info({ count: activeRequests.size }, 'Waiting for active requests...')
                    const deadline = Date.now() + gracefulShutdownTimeout

                    while (activeRequests.size > 0 && Date.now() < deadline) {
                        await new Promise(resolve => setTimeout(resolve, 100))
                    }

                    if (activeRequests.size > 0) {
                        logger?.warn({ count: activeRequests.size }, 'Force closing with active requests')
                    }
                }

                clearInterval(cleanupInterval)

                if (config.onShutdown) {
                    try {
                        await config.onShutdown()
                    } catch (e) {
                        logger?.error({ error: String(e) }, 'Error in shutdown handler')
                    }
                }

                // Close database connections
                for (const [name, db] of dbs.entries()) {
                    try {
                        if (db && typeof db.close === 'function') {
                            db.close()
                        }
                        logger?.info({ name }, 'Database closed')
                    } catch (e) {
                        logger?.error({ error: String(e), name }, 'Error closing database')
                    }
                }

                if (bunServer) {
                    bunServer.stop()
                    logger?.info('Bun server stopped')
                }

                logger?.info('Server stopped successfully')
            },

            addRoute(route: types.RouteDefinition) {
                routes.push(route)
                const methods = Array.isArray(route.method) ? route.method : [route.method]
                methods.forEach(m => {
                    router.register(m, route.path, route.handler, route)
                })
                logger?.info({ method: route.method, path: route.path }, 'Route added')
                },

                getRoutes() {
                return routes
            }
        }

        return instance
	}

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ HELP ════════════════════════════════════════╗

    // Better body parsing with size validation
    async function parseBody(
        request : Request,
        logger  : Logger | null,
        maxSize : number
    ): Promise<any> {
        const contentType = request.headers.get('content-type') || ''

        try {
            if (contentType.includes('application/json')) {
				const text = await request.text()

				// Validate size after reading
				if (text.length > maxSize) {
					throw new types.ValidationError('Payload too large')
				}

				if (!text.trim()) return {}

				try {
					return JSON.parse(text)
				} catch (e) {
					logger?.warn({
						error		: String(e),
						bodyPreview	: text.substring(0, 100)
					}, 'Invalid JSON in request body')

					throw new types.ValidationError('Invalid JSON in request body')
				}
            }

            if (contentType.includes('application/x-www-form-urlencoded')) {
                const text = await request.text()
                if (text.length > maxSize) {
                    throw new types.ValidationError('Payload too large')
                }

                return Object.fromEntries(new URLSearchParams(text))
            }

            if (contentType.includes('multipart/form-data')) {
                // Note: FormData size can't be validated before parsing
                return await request.formData()
            }

        } catch (e) {
            if (e instanceof types.ValidationError) throw e
            logger?.error({ error: String(e) }, 'Error parsing request body')
            throw new types.ValidationError('Failed to parse request body')
        }

        return {}
    }

    // Better cookie parsing
    function parseCookies(cookieHeader: string): Map<string, string> {
        const cookies = new Map<string, string>()

        if (!cookieHeader) return cookies

        const pairs = cookieHeader.split(';')
        for (const pair of pairs) {
            const [key, ...valueParts] = pair.trim().split('=')
            if (key) {
            const value = valueParts.join('=') // Handle '=' in value
            cookies.set(key, value ? decodeURIComponent(value) : '')
            }
        }

        return cookies
    }

    // Create app context with request ID
    function createAppContext(
        request     : Request,
        params      : Record<string, string>,
        db          : any,
        logger      : Logger | null,
        requestId   : string
    ): types.AppContext {
        const url           = new URL(request.url)
        const query         = Object.fromEntries(url.searchParams)
        const headers       = request.headers
        let statusCode      = 200
        const cookieStore   = new Map<string, string>()
        const parsedCookies = parseCookies(headers.get('cookie') || '')

        const ctx: any = {
            request,
            params,
            query,
            headers,
            db,
            logger,
            requestId,
            get statusCode() { return statusCode },
            set statusCode(code: number) { statusCode = code },
            body: null,

            json(data: any, status?: number): Response {
                return new Response(JSON.stringify(data), {
                    status  : status ?? statusCode,
                    headers : {
                        'Content-Type': 'application/json',
                        ...this._setCookieHeaders()
                    }
                })
            },

            text(data: string, status?: number): Response {
                return new Response(data, {
                    status  : status ?? statusCode,
                    headers : {
                        'Content-Type': 'text/plain',
                        ...this._setCookieHeaders()
                    }
                })
            },

            html(data: string, status?: number): Response {
                return new Response(data, {
                    status  : status ?? statusCode,
                    headers : {
                        'Content-Type': 'text/html; charset=utf-8',
                        ...this._setCookieHeaders()
                    }
                })
            },

            redirect(url: string, status = 302): Response {
                return new Response(null, {
                    status,
                    headers : {
                        Location    : url,
                        ...this._setCookieHeaders()
                    }
                })
            },

            file(path: string, contentType = 'application/octet-stream'): Response {
                const file = Bun.file(path)
                return new Response(file, {
                    headers: {
                        'Content-Type': contentType,
                        ...this._setCookieHeaders()
                    }
                })
            },

            setCookie(name: string, value: string, options: types.CookieOptions = {}): types.AppContext {
                let cookie = `${name}=${encodeURIComponent(value)}`

                if (options.maxAge !== undefined) {
                    cookie += `; Max-Age=${options.maxAge}`
                }
                if (options.expires) {
                    cookie += `; Expires=${options.expires.toUTCString()}`
                }
                if (options.path) {
                    cookie += `; Path=${options.path}`
                }
                if (options.domain) {
                    cookie += `; Domain=${options.domain}`
                }
                if (options.secure) {
                    cookie += '; Secure'
                }
                if (options.httpOnly) {
                    cookie += '; HttpOnly'
                }
                if (options.sameSite) {
                    cookie += `; SameSite=${options.sameSite}`
                }

                cookieStore.set(name, cookie)
                return ctx
            },

            getCookie(name: string): string | undefined {
                return parsedCookies.get(name)
            },

            deleteCookie(name: string, options: Partial<types.CookieOptions> = {}): types.AppContext {
                return ctx.setCookie(name, '', {
                    ...options,
                    maxAge: 0,
                    path: options.path || '/'
                })
            },

            setHeader(key: string, value: string): types.AppContext {
                headers.set(key, value)
                return ctx
            },

            getHeader(key: string): string | undefined {
                return headers.get(key) || undefined
            },

            status(code: number): types.AppContext {
                statusCode = code
                return ctx
            },

            _setCookieHeaders(): Record<string, string | string[]> {
                const h: any = {}
                if (cookieStore.size > 0) {
                    h['Set-Cookie'] = Array.from(cookieStore.values())
                }
                return h
            }
        }

        return ctx
    }

    // Better IP extraction
    function getClientIp(request: Request): string {
        const forwarded = request.headers.get('x-forwarded-for')

        if (forwarded) {
            const ips = forwarded.split(',').map(ip => ip.trim())
            return ips[0] || 'unknown'
        }

        const realIp = request.headers.get('x-real-ip')
        if (realIp) return realIp
        return 'unknown'
    }

    // CORS helper with proper configuration
    function handleCors(request: Request, config: types.ServerConfig): Headers {
        const headers = new Headers()

        if (!config.security || typeof config.security !== 'object' || !config.security.cors) {
            return headers
        }

        const corsConfig = typeof config.security.cors === 'object' ? config.security.cors : {}
        const origin = request.headers.get('Origin')

        if (origin) {
            if (typeof corsConfig.origin === 'function') {
                if (corsConfig.origin(origin)) {
                    headers.set('Access-Control-Allow-Origin', origin)
                }
            } else if (Array.isArray(corsConfig.origin)) {
                if (corsConfig.origin.includes(origin)) {
                    headers.set('Access-Control-Allow-Origin', origin)
                }
            } else if (typeof corsConfig.origin === 'string') {
                headers.set('Access-Control-Allow-Origin', corsConfig.origin)
            } else {
                headers.set('Access-Control-Allow-Origin', origin)
            }

            const methods = corsConfig.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
            headers.set('Access-Control-Allow-Methods', methods.join(', '))

            const allowedHeaders = corsConfig.allowedHeaders || ['Content-Type', 'Authorization', 'X-Requested-With']
            headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '))

            if (corsConfig.credentials) {
                headers.set('Access-Control-Allow-Credentials', 'true')
            }

            if (corsConfig.maxAge) {
                headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString())
            }
        }

        return headers
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ ════ ════════════════════════════════════════╗

    // Export all types
    export * from './types.d';

    // Export Logger
    export { Logger };

    // Export SecurityManager for advanced use cases
    export { SecurityManager };

    // Export Router for advanced use cases
    export { Router };

    // Export DB and database helpers
    export {
        DB,
        table,
        column,
        integer,
        text,
        real,
        blob,
        numeric,
        primaryKey,
        notNull,
        unique,
        defaultValue,
        references
    } from './mod/db';

    // Export DB types
    export type {
        ColumnType,
        SqlValue,
        ColumnDefinition,
        TableSchema,
        WhereCondition,
        QueryBuilder
    } from './mod/db';

    // Default export
    export default server;

// ╚══════════════════════════════════════════════════════════════════════════════════════╝