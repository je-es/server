<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="70" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.0.1-black"/>
    <a href="https://github.com/maysara-elshewehy">
    </a>
    <a href="https://github.com/maysara-elshewehy/server"> <img src="https://img.shields.io/badge/🔥-Maysara/server-black"/> </a>
</div>

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
    <br>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Install

    ```bash
    space i @je-es/server
    ```

    ```ts
    import * as server from `@je-es/server`;
    ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## Quick Start 🔥


    - ### Basic Server

        ```typescript
        import { server } from '@je-es/server'

        const app = server({
        port    : 3000,
        routes  : [
            {
            method  : 'GET',
            path    : '/hello',
            handler : (c) => c.json({ message: 'Hello World!' })
            }
        ]
        })

        await app.start()
        ```

    - ### With Database

        ```typescript
        import { server } from '@je-es/server'
        import { Database } from 'bun:sqlite'

        const app = server({
        port        : 3000,
        database    : {
            type        : 'sqlite',
            connection  : './database.db',
            // Or use in-memory:
            // connection: ':memory:'
        },
        routes: [
            {
                method  : 'GET',
                path    : '/users',
                handler : async (c) => {
                    const users = await c.db.query.users.findMany()
                    return c.json({ users })
                }
            }
        ]
        })

        await app.start()
        ```

    - ### With Security

        ```typescript
        const app = server({
        port        : 3000,
        security    : {
            rateLimit   : {
                max         : 100,
                windowMs    : 60000 // 1 minute
            },
            cors: {
                origin      : ['https://example.com'],
                credentials : true,
                methods     : ['GET', 'POST', 'PUT', 'DELETE']
            }
        },
        routes: [
            {
                method      : 'POST',
                path        : '/api/data',
                handler     : (c) => c.json({ success: true })
            }
        ]
        })

        await app.start()
        ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## 📚 API Reference

    - ### Server Configuration

        ```typescript
        interface ServerConfig {
            port?                   : number    // Default: 3000
            hostname?               : string    // Default: 'localhost'
            requestTimeout?         : number    // Default: 30000ms
            maxRequestSize?         : number    // Default: 10MB
            gracefulShutdownTimeout?: number    // Default: 10000ms

            database?               : DatabaseConfig | DatabaseConfig[]
            security?               : SecurityConfig
            logging?                : LoggingConfig
            routes?                 : RouteDefinition[]

            onShutdown?             : () => void | Promise<void>
        }
        ```

    - ### Route Definition

        ```typescript
        {
            method  : 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
            path    : '/users/:id',
            handler : (context) => {
                // Access route parameters
                const { id }        = context.params

                // Access query parameters
                const { filter }    = context.query

                // Access request body
                const data          = context.body

                // Access database
                const user          = await context.db.query.users.findFirst()

                // Return response
                return context.json({ user })
            }
        }
        ```

    - ### Context API

        ```typescript
        interface AppContext {
            // Request data
            request     : Request
            params      : Record<string, string>
            query       : Record<string, any>
            body        : any
            headers     : Headers
            requestId   : string

            // Database
            db          : DrizzleDB

            // Logger
            logger      : Logger

            // Response methods
            json        (data: any,     status?: number): Response
            text        (data: string,  status?: number): Response
            html        (data: string,  status?: number): Response
            redirect    (url: string,   status?: number): Response
            file        (path: string,  contentType?: string): Response

            // Cookie methods
            setCookie   (name: string, value: string, options?: CookieOptions): AppContext
            getCookie   (name: string): string | undefined
            deleteCookie(name: string, options?: Partial<CookieOptions>): AppContext

            // Headers
            setHeader   (key: string, value: string): AppContext
            getHeader   (key: string): string | undefined

            // Status
            status      (code: number): AppContext
        }
        ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## 🔒 Security Features

  - ### Rate Limiting

    ```typescript
    security: {
      rateLimit: {
        max             : 100,      // Max requests per window
        windowMs        : 60000,    // Time window in ms
        message         : 'Too many requests',
        keyGenerator    : (c) => c.headers.get('x-api-key') || 'default'
      }
    }
    ```

  - ### CORS Configuration

    ```typescript
    security: {
      cors: {
        origin          : ['https://example.com', 'https://app.example.com'],
        // Or use a function:
        // origin       : (origin) => origin.endsWith('.example.com'),
        methods         : ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders  : ['Content-Type', 'Authorization'],
        credentials     : true,
        maxAge          : 3600
      }
    }
    ```

  - ### CSRF Protection

    ```typescript
    import { SecurityManager } from '@je-es/server'

    const security      = new SecurityManager()

    // Generate token
    const token         = security.generateCsrfToken(sessionId)

    // Validate token
    const isValid       = security.validateCsrfToken(token, sessionId)
    ```

  - ### Input Sanitization

    ```typescript
    import { SecurityManager } from '@je-es/server'

    const security      = new SecurityManager()

    // HTML sanitization
    const safeHtml      = security.sanitizeHtml(userInput)

    // SQL sanitization
    const safeSql       = security.sanitizeSql(userInput)
    ```

  <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## 🗄️ Database Support

  - ### Single Database

    ```typescript
    database: {
      type          : 'sqlite',
      connection    : './app.db',
      schema        : mySchema
    }
    ```

  - ### Multiple Databases

    ```typescript
    database: [
      {
        type        : 'sqlite',
        name        : 'default',
        connection  : './main.db'
      },
      {
        type        : 'sqlite',
        name        : 'cache',
        connection  : './cache.db'
      }
    ]

    // Access in routes
    handler: (c) => {
      const mainDb      = c.db                  // Default database
      const cacheDb     = app.db.get('cache')   // Named database
    }
    ```

  <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## 📝 Logging

  - ### Configuration

    ```typescript
    logging: {
      level     : 'debug' | 'info' | 'warn' | 'error',
      pretty    : true  // Enable pretty-print mode
    }
    ```

  - ### Usage

    ```typescript
    handler: (c) => {
      c.logger?.info({ userId: 123 },               'User action')
      c.logger?.warn({ ip: c.request.ip },          'Suspicious activity')
      c.logger?.error({ error: err.message },       'Operation failed')

      return c.json({ success: true })
    }
    ```

  <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## 🍪 Cookie Management

  ```typescript
  handler: (c) => {
    // Set cookie
    c.setCookie('session', 'abc123', {
      maxAge    : 3600,
      httpOnly  : true,
      secure    : true,

      sameSite  : 'Strict',
      path      : '/'
    })

    // Get cookie
    const session = c.getCookie('session')

    // Delete cookie
    c.deleteCookie('session')

    return c.json({ success: true })
  }
  ```

  <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## 🛣️ Dynamic Routing

  ```typescript
  routes: [
    {
      method    : 'GET',
      path      : '/users/:id',
      handler   : (c) => {
        const userId = c.params.id
        return c.json({ userId })
      }
    },
    {
      method    : 'GET',
      path      : '/posts/:postId/comments/:commentId',
      handler   : (c) => {
        const { postId, commentId } = c.params
        return c.json({ postId, commentId })
      }
    }
  ]
  ```

  <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## 🏥 Health Checks

  > Built-in health endpoints are automatically available:

  - **`GET /health`** - Basic health check

  - **`GET /readiness`** - Readiness check with database status

  ```json
  // GET /health
  {
    "status"            : "healthy",
    "timestamp"         : "2025-11-27T08:50:18.557Z",
    "uptime"            : 123.456,
    "activeRequests"    : 2
  }

  // GET /readiness
  {
    "ready"             : true,
    "checks"            : {
      "database"        : "connected",
      "activeRequests"  : 2
    },
    "timestamp"         : "2025-11-27T08:50:18.557Z"
  }
  ```

  <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## ⚙️ Advanced Features

  - ### Graceful Shutdown

    ```typescript
    const app = server({
      gracefulShutdownTimeout: 10000,
      onShutdown: async () => {
        console.log('Cleaning up resources...')
        // Close connections, save state, etc.
      }
    })

    // Shutdown the server
    await app.stop()
    ```

  - ### Dynamic Routes

    ```typescript
    // Add routes after server creation
    app.addRoute({
      method    : 'GET',
      path      : '/dynamic',
      handler   : (c) => c.json({ message: 'Dynamic route' })
    })

    // Get all routes
    const routes = app.getRoutes()
    ```

  - ### Request Timeout

    ```typescript
    {
      requestTimeout: 5000, // 5 seconds
      routes: [
        {
          method    : 'GET',
          path      : '/slow',
          handler   : async (c) => {
            await slowOperation()
            return c.json({ done: true })
          }
        }
      ]
    }
    ```

  - ### Custom Error Handling

    ```typescript
    import { AppError, ValidationError } from '@je-es/server'

    handler: (c) => {
      if (!c.body.email) {
        throw new ValidationError('Email is required')
      }

      if (!authorized) {
        throw new AppError('Unauthorized', 401, 'AUTH_ERROR')
      }

      return c.json({ success: true })
    }
    ```

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>
<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
    <br>
</div>
<br>
<div align="center">
    <a href="https://github.com/solution-lib/space"><img src="https://img.shields.io/badge/by-Space-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->