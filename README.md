<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="70" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.0.6-black"/>
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
        import { server, table, integer, text, primaryKey, notNull } from '@je-es/server';

        // Define your schema using the built-in schema builder
        const users = table('users', [
            primaryKey(integer('id'), true),    // auto-increment primary key
            notNull(text('name')),
            notNull(text('email'))
        ]);

        const app = server({
            port    : 3000,
            database: {
                connection  : './my_app.db',    // File-based SQLite database
                schema      : { users }
            },
            routes  : [
                {
                    method  : 'GET',
                    path    : '/users',
                    handler : (c) => {
                        const allUsers = c.db.all('users');
                        return c.json(allUsers);
                    }
                },
                {
                    method  : 'POST',
                    path    : '/users',
                    handler : (c) => {
                        const newUser = c.db.insert('users', c.body);
                        return c.json(newUser);
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
                connection  : ':memory:',   // or file path like './app.db'
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
                    handler : (c) => {
                        // Access default database
                        const users = c.db.all('users');

                        // Access named databases
                        const mainDb = app.db.get('default');
                        const analyticsDb = app.db.get('analytics');

                        const mainData = mainDb.all('some_table');
                        const analyticsData = analyticsDb.all('analytics_table');

                        return c.json({ users, mainData, analyticsData });
                    }
                }
            ]
        });
        ```

    - ### Schema Definition

        ```typescript
        import {
            server,
            table,
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
        } from '@je-es/server';

        // Define products table
        const products = table('products', [
            primaryKey(integer('id'), true),        // Auto-increment primary key
            notNull(text('name')),
            text('description'),
            notNull(real('price')),
            defaultValue(integer('stock'), 0)
        ]);

        // Define orders table with foreign key
        const orders = table('orders', [
            primaryKey(integer('id'), true),
            notNull(integer('product_id')),
            references(integer('product_id'), 'products', 'id'),
            notNull(integer('quantity')),
            defaultValue(text('status'), 'pending')
        ]);

        const app = server({
            database: {
                connection: './store.db',
                schema: { products, orders }
            }
        });
        ```

    - ### Database Operations

        ```typescript
        import { server, table, integer, text, primaryKey, notNull } from '@je-es/server';

        const users = table('users', [
            primaryKey(integer('id'), true),
            notNull(text('name')),
            notNull(text('email')),
            integer('age')
        ]);

        const app = server({
            database: {
                connection: './app.db',
                schema: { users }
            },
            routes  : [
                // Get all records
                {
                    method  : 'GET',
                    path    : '/users',
                    handler : (c) => {
                        const allUsers = c.db.all('users');
                        return c.json(allUsers);
                    }
                },

                // Find by ID
                {
                    method  : 'GET',
                    path    : '/users/:id',
                    handler : (c) => {
                        const user = c.db.findById('users', parseInt(c.params.id));
                        if (!user) return c.status(404).json({ error: 'Not found' });
                        return c.json(user);
                    }
                },

                // Find with conditions
                {
                    method  : 'GET',
                    path    : '/users/search',
                    handler : (c) => {
                        const users = c.db.find('users', {
                            name: c.query.name
                        });
                        return c.json(users);
                    }
                },

                // Insert
                {
                    method  : 'POST',
                    path    : '/users',
                    handler : (c) => {
                        const newUser = c.db.insert('users', c.body);
                        return c.json(newUser);
                    }
                },

                // Update
                {
                    method  : 'PUT',
                    path    : '/users/:id',
                    handler : (c) => {
                        const updated = c.db.update(
                            'users',
                            parseInt(c.params.id),
                            c.body
                        );
                        if (!updated) return c.status(404).json({ error: 'Not found' });
                        return c.json(updated);
                    }
                },

                // Delete
                {
                    method  : 'DELETE',
                    path    : '/users/:id',
                    handler : (c) => {
                        c.db.delete('users', parseInt(c.params.id));
                        return c.json({ deleted: true });
                    }
                }
            ]
        });
        ```

    - ### Query Builder

        ```typescript
        const app = server({
            database: {
                connection: './app.db',
                schema: { users }
            },
            routes  : [
                {
                    method  : 'GET',
                    path    : '/advanced-search',
                    handler : (c) => {
                        // Complex queries with query builder
                        const results = c.db.query()
                            .select(['name', 'email', 'age'])
                            .from('users')
                            .where({
                                column: 'age',
                                operator: '>=',
                                value: 18
                            })
                            .and({
                                column: 'name',
                                operator: 'LIKE',
                                value: '%John%'
                            })
                            .orderBy('age', 'DESC')
                            .limit(10)
                            .offset(0)
                            .execute();

                        return c.json(results);
                    }
                },

                // Multiple where conditions
                {
                    method  : 'GET',
                    path    : '/filter',
                    handler : (c) => {
                        const users = c.db.query()
                            .select()
                            .from('users')
                            .where([
                                { column: 'age', operator: '>', value: 25 },
                                { column: 'age', operator: '<', value: 50 }
                            ])
                            .execute();

                        return c.json(users);
                    }
                },

                // OR conditions
                {
                    method  : 'GET',
                    path    : '/or-search',
                    handler : (c) => {
                        const users = c.db.query()
                            .select()
                            .from('users')
                            .where({ column: 'name', operator: '=', value: 'John' })
                            .or({ column: 'name', operator: '=', value: 'Jane' })
                            .execute();

                        return c.json(users);
                    }
                },

                // Get single result
                {
                    method  : 'GET',
                    path    : '/first-user',
                    handler : (c) => {
                        const user = c.db.query()
                            .select()
                            .from('users')
                            .limit(1)
                            .executeOne();

                        return c.json(user);
                    }
                }
            ]
        });
        ```

    - ### Transactions

        ```typescript
        const app = server({
            database: {
                connection: './app.db',
                schema: { users, orders }
            },
            routes  : [
                {
                    method  : 'POST',
                    path    : '/place-order',
                    handler : (c) => {
                        try {
                            c.db.transaction((db) => {
                                // Insert order
                                const order = db.insert('orders', {
                                    product_id: c.body.productId,
                                    quantity: c.body.quantity
                                });

                                // Update product stock
                                const product = db.findById('products', c.body.productId);
                                db.update('products', c.body.productId, {
                                    stock: product.stock - c.body.quantity
                                });
                            });

                            return c.json({ success: true });
                        } catch (error) {
                            return c.status(500).json({
                                error: 'Transaction failed'
                            });
                        }
                    }
                }
            ]
        });
        ```

    - ### Raw SQL

        ```typescript
        const app = server({
            database: {
                connection: './app.db',
                schema: { users }
            },
            routes  : [
                {
                    method  : 'GET',
                    path    : '/custom-query',
                    handler : (c) => {
                        // Execute raw SQL
                        const results = c.db.raw(
                            'SELECT * FROM users WHERE age > ? AND name LIKE ?',
                            [25, '%John%']
                        );

                        return c.json(results);
                    }
                },

                {
                    method  : 'GET',
                    path    : '/single-result',
                    handler : (c) => {
                        // Get single row
                        const user = c.db.rawOne(
                            'SELECT * FROM users WHERE id = ?',
                            [1]
                        );

                        return c.json(user);
                    }
                },

                {
                    method  : 'POST',
                    path    : '/execute-sql',
                    handler : (c) => {
                        // Execute without return
                        c.db.exec('DELETE FROM users WHERE age < 18');

                        return c.json({ success: true });
                    }
                }
            ]
        });
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