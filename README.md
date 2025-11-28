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
    <a href="https://github.com/je-es/server"> <img src="https://img.shields.io/badge/🔥-@je--es/server-black"/> </a>
</div>

<div align="center">
    <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/>
    <br>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Quick Start 🔥

    - ### commands

        ```bash
        # install
        space i @je-es/server

        # manage
        space test              # run server tests
        space build             # build server files to ./dist
        space start             # start server
        ```

    - ### Basic Server

        ```typescript
        // import
        import { server } from '@je-es/server';
        ```

        ```typescript
        // create
        const app = server({
            port    : 3000,
            routes  : [
                {
                    method  : 'GET',
                    path    : '/',
                    handler : (c) => c.json({ message: 'Hello World!' })
                },
                {
                    method  : 'GET',
                    path    : '/users/:id',
                    handler : (c) => {
                        const userId = c.params.id;
                        return c.json({ userId, name: 'John Doe' });
                    }
                },
                {
                    method  : 'POST',
                    path    : '/users',
                    handler : (c) => {
                        const userData = c.body;
                        return c.json({ created: true, data: userData });
                    }
                }
            ]
        });
        ```

        ```typescript
        // start
        await app.start();
        ```

        > use `space start` to run your server.

        ```typescript
        > space start

        → URL:          http://localhost:3000
        → Environment:  test
        → Routes:       N
        ...
        ```

    - ### With Database

        ```typescript
        import { server, sqliteTable, integer, text } from '@je-es/server';

        // Define your schema - all Drizzle types exported from @je-es/server!
        const users = sqliteTable('users', {
            id      : integer('id').primaryKey(),
            name    : text('name').notNull(),
            email   : text('email').notNull()
        });

        const app = server({
            port    : 3000,
            database: {
                connection  : './my_app.db', // File-based SQLite database
                schema      : { users }
            },
            routes  : [
                {
                    method  : 'GET',
                    path    : '/users',
                    handler : async (c) => {
                        const allUsers = await c.db.select().from(users);
                        return c.json(allUsers);
                    }
                },
                {
                    method  : 'POST',
                    path    : '/users',
                    handler : async (c) => {
                        const newUser = await c.db
                            .insert(users)
                            .values(c.body)
                            .returning();
                        return c.json(newUser[0]);
                    }
                }
            ]
        });

        await app.start();
        // Data persists in ./my_app.db file!
        ```

    - ### With Security

        ```typescript
        import { server } from '@je-es/server';

        const app = server({
            port    : 3000,
            security: {
                // Rate limiting
                rateLimit: {
                    max             : 100,
                    windowMs        : 60000, // 1 minute
                    message         : 'Too many requests, please try again later'
                },
                // CORS configuration
                cors: {
                    origin          : ['http://localhost:3000', 'https://example.com'],
                    credentials     : true,
                    methods         : ['GET', 'POST', 'PUT', 'DELETE'],
                    allowedHeaders  : ['Content-Type', 'Authorization']
                }
            },
            routes  : [
                {
                    method  : 'GET',
                    path    : '/protected',
                    handler : (c) => c.json({ message: 'This route is protected!' })
                }
            ]
        });

        await app.start();
        ```

<div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## API Reference

    - ### Server Configuration

        ```typescript
        import { server, type ServerConfig } from '@je-es/server';

        const config: ServerConfig = {
            // Basic settings
            port        : 3000,
            hostname    : 'localhost',

            // Request handling
            requestTimeout              : 30000,        // 30 seconds
            maxRequestSize              : 10485760,     // 10MB
            gracefulShutdownTimeout     : 10000,        // 10 seconds

            // Logging
            logging: {
                level   : 'info',   // 'debug' | 'info' | 'warn' | 'error'
                pretty  : false     // Enable pretty printing
            },

            // Database
            database: {
                type        : 'bun-sql',
                connection  : ':memory:',
                schema      : {}
            },

            // Security
            security: {
                rateLimit   : true,
                cors        : true,
                csrf        : true
            },

            // Routes
            routes: [],

            // Lifecycle hooks
            onShutdown: async () => {
                console.log('Server shutting down...');
            }
        };

        const app = server(config);
        await app.start();
        ```

    - ### Route Definition

        ```typescript
        import { type RouteDefinition, type AppContext } from '@je-es/server';

        // Single HTTP method
        const route: RouteDefinition = {
            method  : 'GET',
            path    : '/users/:id',
            handler : (c: AppContext) => {
                return c.json({ id: c.params.id });
            }
        };

        // Multiple HTTP methods
        const multiMethodRoute: RouteDefinition = {
            method  : ['GET', 'POST'],
            path    : '/api/resource',
            handler : (c: AppContext) => {
                if (c.request.method === 'GET') {
                    return c.json({ method  : 'GET' });
                }
                return c.json({ method  : 'POST', body: c.body });
            }
        };

        // Dynamic routes with nested parameters
        const nestedRoute: RouteDefinition = {
            method  : 'GET',
            path    : '/posts/:postId/comments/:commentId',
            handler : (c: AppContext) => {
                return c.json({
                    postId: c.params.postId,
                    commentId: c.params.commentId
                });
            }
        };
        ```

    - ### Context API

        ```typescript
        import { type AppContext } from '@je-es/server';

        // Response methods
        handler : (c: AppContext) => {
            // JSON response
            c.json({ data: 'value' }, 200);

            // Text response
            c.text('Hello World', 200);

            // HTML response
            c.html('<h1>Hello</h1>', 200);

            // Redirect
            c.redirect('/new-location', 302);

            // File response
            c.file('./path/to/file.pdf', 'application/pdf');

            // Chain status
            c.status(201).json({ created: true });
        }

        // Request data
        handler : (c: AppContext) => {
            const params = c.params;      // URL parameters
            const query = c.query;        // Query string
            const body = c.body;          // Request body
            const headers = c.headers;    // Request headers
            const db = c.db;              // Database instance
            const logger = c.logger;      // Logger instance
            const requestId = c.requestId; // Unique request ID
        }

        // Headers
        handler : (c: AppContext) => {
            c.setHeader('X-Custom-Header', 'value');
            const auth = c.getHeader('Authorization');
        }

        // Cookies
        handler : (c: AppContext) => {
            c.setCookie('session', 'abc123', {
                maxAge: 3600,
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            });

            const session = c.getCookie('session');
            c.deleteCookie('session');
        }
        ```

<div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## Security Features

    - ### Rate Limiting

        ```typescript
        const app = server({
            security: {
                rateLimit: {
                    max: 100,              // Max requests per window
                    windowMs: 60000,       // Time window in milliseconds
                    keyGenerator: (c) => {
                        // Custom key generation (default: IP address)
                        return c.headers.get('x-api-key') || c.request.ip;
                    },
                    message: 'Rate limit exceeded'
                }
            }
        });
        ```

    - ### CORS Configuration

        ```typescript
        const app = server({
            security: {
                cors: {
                    // Allow specific origins
                    origin: ['http://localhost:3000', 'https://example.com'],

                    // Or use a function
                    origin: (origin) => {
                        return origin.endsWith('.example.com');
                    },

                    // Or allow all
                    origin: '*',

                    methods: ['GET', 'POST', 'PUT', 'DELETE'],
                    allowedHeaders: ['Content-Type', 'Authorization'],
                    credentials: true,
                    maxAge: 86400 // 24 hours
                }
            }
        });
        ```

    - ### CSRF Protection

        ```typescript
        import { SecurityManager } from '@je-es/server';

        const security = new SecurityManager();

        // Generate CSRF token
        const token = security.generateCsrfToken('session-id', 3600000); // 1 hour TTL

        // Validate CSRF token
        const isValid = security.validateCsrfToken(token, 'session-id');
        ```

    - ### Input Sanitization

        ```typescript
        import { SecurityManager } from '@je-es/server';

        const security = new SecurityManager();

        // Sanitize HTML
        const cleanHtml = security.sanitizeHtml('<script>alert("xss")</script>');
        // Output: &lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;

        // Sanitize SQL
        const cleanSql = security.sanitizeSql("'; DROP TABLE users--");
        // Output: ''; DROP TABLE users--
        ```

<div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## Database Support

    - ### Single Database

        ```typescript
        import { server } from '@je-es/server';

        const app = server({
            database: {
                connection: './my_app.db' // ✅ File-based SQLite - data persists!
                // or ':memory:' for in-memory database
            }
        });

        // Access in routes via c.db
        ```

    - ### Multiple Databases

        ```typescript
        import { server } from '@je-es/server';

        const app = server({
            database: [
                {
                    name: 'default',
                    connection: './main.db'      // Main database file
                },
                {
                    name: 'analytics',
                    connection: './analytics.db' // Analytics database file
                }
            ],
            routes  : [
                {
                    method  : 'GET',
                    path    : '/data',
                    handler : async (c) => {
                        // Access default database
                        const users = await c.db.select().from(usersTable);

                        // Access named databases
                        const mainDb = app.db.get('default');
                        const analyticsDb = app.db.get('analytics');

                        return c.json({ users });
                    }
                }
            ]
        });
        ```

    - ### Complete Database Example

        ```typescript
        import {
            server,
            sqliteTable,
            integer,
            text,
            real,
            eq,
            and,
            like
        } from '@je-es/server';

        // Define schema with all column types
        const products = sqliteTable('products', {
            id: integer('id').primaryKey(),
            name: text('name').notNull(),
            description: text('description'),
            price: real('price').notNull(),
            stock: integer('stock').default(0)
        });

        const app = server({
            database: {
                connection: './store.db',
                schema: { products }
            },
            routes  : [
                {
                    method  : 'GET',
                    path    : '/products',
                    handler : async (c) => {
                        // Query with filters
                        const allProducts = await c.db
                            .select()
                            .from(products)
                            .where(and(
                                eq(products.stock, 0),
                                like(products.name, '%laptop%')
                            ));

                        return c.json(allProducts);
                    }
                },
                {
                    method  : 'POST',
                    path    : '/products',
                    handler : async (c) => {
                        // Insert new product
                        const newProduct = await c.db
                            .insert(products)
                            .values(c.body)
                            .returning();

                        return c.json(newProduct[0]);
                    }
                },
                {
                    method  : 'PUT',
                    path    : '/products/:id',
                    handler : async (c) => {
                        // Update product
                        const updated = await c.db
                            .update(products)
                            .set(c.body)
                            .where(eq(products.id, parseInt(c.params.id)))
                            .returning();

                        return c.json(updated[0]);
                    }
                },
                {
                    method  : 'DELETE',
                    path    : '/products/:id',
                    handler : async (c) => {
                        // Delete product
                        await c.db
                            .delete(products)
                            .where(eq(products.id, parseInt(c.params.id)));

                        return c.json({ deleted: true });
                    }
                }
            ]
        });

        await app.start();
        // All data saved to ./store.db and persists across restarts!
        ```

<div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## Advanced Features

    - ### Logging

        ```typescript
        import { server, Logger } from '@je-es/server';

        // Enable logging
        const app = server({
            logging: {
                level: 'debug',  // 'debug' | 'info' | 'warn' | 'error' | 'fatal'
                pretty: true     // Pretty print for development
            }
        });

        // Use logger in routes
        const route = {
            method  : 'GET',
            path    : '/test',
            handler : (c) => {
                c.logger?.info({ userId: 123 }, 'User accessed endpoint');
                c.logger?.warn({ attempt: 3 }, 'Suspicious activity');
                c.logger?.error({ error: 'DB connection failed' }, 'Database error');
                return c.json({ ok: true });
            }
        };
        ```

    - ### Cookie Management

        ```typescript
        const app = server({
            routes  : [
                {
                    method  : 'POST',
                    path    : '/login',
                    handler : (c) => {
                        // Set cookie with options
                        c.setCookie('session', 'user-token-123', {
                            maxAge: 3600,           // 1 hour
                            expires: new Date('2025-12-31'),
                            path    : '/',
                            domain: 'example.com',
                            secure: true,           // HTTPS only
                            httpOnly: true,         // No JavaScript access
                            sameSite: 'Strict'      // CSRF protection
                        });

                        return c.json({ loggedIn: true });
                    }
                },
                {
                    method  : 'GET',
                    path    : '/profile',
                    handler : (c) => {
                        const session = c.getCookie('session');
                        if (!session) {
                            return c.status(401).json({ error: 'Unauthorized' });
                        }
                        return c.json({ session });
                    }
                },
                {
                    method  : 'POST',
                    path    : '/logout',
                    handler : (c) => {
                        c.deleteCookie('session');
                        return c.json({ loggedOut: true });
                    }
                }
            ]
        });
        ```

    - ### Dynamic Routing

        ```typescript
        const app = server({
            routes  : [
                // Simple parameter
                {
                    method  : 'GET',
                    path    : '/users/:id',
                    handler : (c) => c.json({ userId: c.params.id })
                },

                // Multiple parameters
                {
                    method  : 'GET',
                    path    : '/posts/:postId/comments/:commentId',
                    handler : (c) => c.json({
                        postId: c.params.postId,
                        commentId: c.params.commentId
                    })
                },

                // Complex patterns
                {
                    method  : 'GET',
                    path    : '/api/:version/:resource',
                    handler : (c) => c.json({
                        version: c.params.version,
                        resource: c.params.resource
                    })
                }
            ]
        });
        ```

    - ### Health Checks

        ```typescript
        // Built-in health endpoints are automatically available

        // GET /health
        // Response:
        {
            status: 'healthy',
            timestamp: '2025-11-28T10:00:00.000Z',
            uptime: 3600,
            activeRequests: 5
        }

        // GET /readiness
        // Response:
        {
            ready: true,
            checks: {
                database: 'connected',  // or 'not configured'
                activeRequests: 5
            },
            timestamp: '2025-11-28T10:00:00.000Z'
        }
        ```

    - ### Graceful Shutdown

        ```typescript
        const app = server({
            gracefulShutdownTimeout: 10000, // 10 seconds
            onShutdown: async () => {
                console.log('Cleaning up resources...');
                // Close external connections, flush logs, etc.
            }
        });

        await app.start();

        // Handle signals
        process.on('SIGTERM', async () => {
            await app.stop();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            await app.stop();
            process.exit(0);
        });
        ```

    - ### Dynamic Routes

        ```typescript
        const app = server({
            routes  : [
                {
                    method  : 'GET',
                    path    : '/initial',
                    handler : (c) => c.json({ route: 'initial' })
                }
            ]
        });

        await app.start();

        // Add routes after server starts
        app.addRoute({
            method  : 'POST',
            path    : '/dynamic',
            handler : (c) => c.json({ route: 'dynamic', body: c.body })
        });

        // Get all registered routes
        const routes = app.getRoutes();
        console.log(routes);
        ```

    - ### Request Timeout

        ```typescript
        const app = server({
            requestTimeout  : 5000, // 5 seconds
            routes          : [
                {
                    method  : 'GET',
                    path    : '/slow',
                    handler : async (c) => {
                        // If this takes more than 5 seconds, request will timeout
                        await someSlowOperation();
                        return c.json({ done: true });
                    }
                }
            ]
        });
        ```

    - ### Custom Error Handling

        ```typescript
        import { AppError, ValidationError } from '@je-es/server';

        const app = server({
            routes  : [
                {
                    method  : 'POST',
                    path    : '/validate',
                    handler : (c) => {
                        if (!c.body?.email) {
                            throw new ValidationError('Email is required');
                        }

                        if (!c.body.email.includes('@')) {
                            throw new AppError('Invalid email format', 400, 'INVALID_EMAIL');
                        }

                        return c.json({ valid: true });
                    }
                }
            ]
        });

        // Error responses are automatically formatted:
        {
            error       : 'Email is required',
            code        : 'VALIDATION_ERROR',
            requestId   : 'unique-request-id'
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