<!-- ╔══════════════════════════════ BEG ══════════════════════════════╗ -->

<br>
<div align="center">
    <p>
        <img src="./assets/img/logo.png" alt="logo" style="" height="80" />
    </p>
</div>

<div align="center">
    <img src="https://img.shields.io/badge/v-0.1.6-black"/>
    <img src="https://img.shields.io/badge/🔥-@je--es-black"/>
    <br>
    <img src="https://github.com/je-es/server/actions/workflows/ci.yml/badge.svg" alt="CI" />
    <img src="https://img.shields.io/badge/coverage-100%25-brightgreen" alt="Test Coverage" />
    <img src="https://img.shields.io/github/issues/je-es/server?style=flat" alt="Github Repo Issues" />
    <img src="https://img.shields.io/github/stars/je-es/server?style=social" alt="GitHub Repo stars" />
</div>
<br>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->




<!-- ╔══════════════════════════════ DOC ══════════════════════════════╗ -->

- ## Quick Start 🔥

    > _**The simplest, fastest, and most organized way to build production-ready servers with Bun.**_

    > _We prefer to use [`space`](https://github.com//solution-lib/space) with [`@solution-dist/server`](https://github.com/solution-dist/server) for a better experience._

    - ### Setup

        > install [`space`](https://github.com/solution-lib/space) first.

        - #### Create

            ```bash
            > space init <name> -t server # This will clone a ready-to-use repo and make some changes to suit your server.
            > cd <name>                   # Go to the project directory
            > space install               # Install the dependencies
            ```

        - #### Manage

            ```bash
            > space lint
            > space build
            > space test
            > space start
            ```

        - #### Usage

            ```typescript
            import { server } from '@je-es/server';

            const app = server({
                port    : 3000,
                routes  : [
                    {
                        method  : 'GET',
                        path    : '/',
                        handler : (c) => c.json({ message: 'Hello World!' })
                    }
                ]
            });

            await app.start();
            ```

            ```bash
             > space start
             16:16:31 Server started at http://localhost:3000
             16:17:25 GET / 200 1ms
             ...
            ```

    <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

- ## Examples

    - ### Basic Server

        ```typescript
        import { server } from '@je-es/server';

        const app = server({
            port    : 3000,
            logging : { level: 'info', pretty: true },
            routes  : [
                {
                    method  : 'GET',
                    path    : '/users/:id',
                    handler : (c) => c.json({
                        userId      : c.params.id,
                        ip          : c.ip,
                        requestId   : c.requestId
                    })
                },
                {
                    method          : 'POST',
                    path            : '/users',
                    handler         : (c) => c.status(201).json({
                        created : true,
                        data    : c.body
                    })
                }
            ]
        });

        await app.start();
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### With Database

        ```typescript
        import { server, table, integer, text, primaryKey, notNull } from '@je-es/server';

        const users = table('users', [
            primaryKey(integer('id'), true),
            notNull(text('name')),
            notNull(text('email'))
        ]);

        const app = server({
            port        : 3000,
            database    : {
                connection  : './app.db',
                schema      : { users }
            },
            routes: [
                {
                    method  : 'GET',
                    path    : '/users',
                    handler : (c) => c.json(c.db!.all('users'))
                },
                {
                    method  : 'POST',
                    path    : '/users',
                    handler : (c) => c.json(c.db!.insert('users', c.body))
                },
                {
                    method  : 'GET',
                    path    : '/users/:id',
                    handler : (c) => {
                        const user = c.db!.findById('users', parseInt(c.params.id));
                        return user
                            ? c.json(user)
                            : c.status(404).json({ error: 'Not found' });
                    }
                }
            ]
        });

        await app.start();
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### With Security

        ```typescript
        const app = server({
            port        : 3000,
            security    : {
                rateLimit   : { max: 100, windowMs: 60000 },
                cors        : {
                    origin      : ['http://localhost:3000'],
                    credentials : true
                }
            },
            routes: [/* your routes */]
        });
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Static Files

        ```typescript
        const app = server({
            port    : 3000,
            static  : {
                path        : '/public',
                directory   : './public',
                maxAge      : 3600
            }
        });
        ```

    - ### Internationalization (i18n)

        ```typescript
        const app = server({
            port    : 3000,
            i18n    : {
                defaultLanguage     : 'en',
                supportedLanguages  : ['en', 'ar', 'fr'],
                staticPath          : 'static/i18n'
            },
            routes: [
                {
                    method  : 'GET',
                    path    : '/message',
                    handler : (c) => {
                        // Language auto-detected from ?lang=ar, Accept-Language header, or defaults to 'en'
                        const greeting = c.i18n?.t('message.greeting', { name: 'John' });
                        return c.json({ greeting });
                    }
                }
            ]
        });
        ```

        **Translation files** (`static/i18n/*.json`):
        ```json
        // en.json
        { "message.greeting": "Hello {name}" }

        // ar.json
        { "message.greeting": "مرحبا {name}" }
        ```

        **Key Features:**
        - Auto language detection from query params, headers, or defaults
        - Smart parameter replacement with nested translation key support
        - All supported languages loaded at server startup
        - Works with any number of languages dynamically

    <br>

- ## API

    - ### Server Configuration

        ```typescript
        import { server, type ServerConfig } from '@je-es/server';

        const config: ServerConfig = {
            port                    : 3000,
            hostname                : 'localhost',

            // Timeouts & Limits
            requestTimeout          : 30000,
            maxRequestSize          : 10485760,
            gracefulShutdownTimeout : 10000,

            // Logging (via @je-es/slog)
            logging: {
                level               : 'info',       // 'debug' | 'info' | 'warn' | 'error'
                pretty              : false
            },

            // Database (via @je-es/sdb)
            database: {
                connection          : './app.db',   // or ':memory:'
                schema              : {}
            },

            // Multiple databases
            database: [
                { name: 'default',  connection: './main.db' },
                { name: 'cache',    connection: ':memory:' }
            ],

            // Security
            security: {
                rateLimit           : { max: 100, windowMs: 60000 },
                cors                : { origin: '*', credentials: true }
            },

            // Static files
            static: {
                path                : '/public',
                directory           : './public',
                maxAge              : 3600
            },

            // Lifecycle
            onShutdown              : async () => { console.log('Shutting down...'); }
        };
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Context API

        ```typescript
        handler : (c: AppContext) => {
            // Request
            c.params        // URL parameters
            c.query         // Query string
            c.body          // Parsed body (JSON/form/multipart)
            c.headers       // Request headers
            c.ip            // Client IP
            c.requestId     // Unique request ID

            // Resources
            c.db            // Database instance
            c.logger        // Logger instance

            // Response
            c.json({ data })
            c.text('text')
            c.html('HTML')
            c.redirect('/path')
            c.file('./file.pdf', 'application/pdf')
            c.status(201).json({ created: true })

            // Headers
            c.setHeader('X-Custom', 'value')
            c.getHeader('Authorization')

            // Cookies
            c.setCookie('session', 'token', { httpOnly: true })
            c.getCookie('session')
            c.deleteCookie('session')
        }
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Routes

        ```typescript
        // Single method
        { method  : 'GET', path    : '/users', handler }

        // Multiple methods
        { method  : ['GET', 'POST'], path    : '/api', handler }

        // Dynamic parameters
        { method  : 'GET', path    : '/users/:id', handler }
        { method  : 'GET', path    : '/posts/:postId/comments/:commentId', handler }

        // Wildcards
        { method  : 'GET', path    : '/files/*', handler }
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Database Operations

        ```typescript
        // CRUD
        c.db!.all       ('users')
        c.db!.findById  ('users', 1)
        c.db!.find      ('users',    { role: 'admin' })
        c.db!.insert    ('users',    { name: 'John'  })
        c.db!.update    ('users', 1, { name: 'Jane'  })
        c.db!.delete    ('users', 1)

        // Multiple databases
        const mainDb = app.db.get('default');
        const cacheDb = app.db.get('cache');
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Dynamic Routes

        ```typescript
        await app.start();

        // Add single route
        app.addRoute({
            method  : 'POST',
            path    : '/dynamic',
            handler : (c) => c.json({ dynamic: true })
        });

        // Add multiple routes
        app.addRoutes([
            { method  : 'GET', path    : '/route1', handler },
            { method  : 'GET', path    : '/route2', handler }
        ]);

        // Get all routes
        const routes = app.getRoutes();
        ```

    <br>

- ## Security

    - ### Rate Limiting

        ```typescript
        security: {
            rateLimit: {
                max             : 100,
                windowMs        : 60000,
                keyGenerator    : (c) => c.ip,
                message         : 'Too many requests'
            }
        }
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### CORS

        ```typescript
        security: {
            cors: {
                origin          : ['http://localhost:3000'],
                // or: origin   : '*',
                // or: origin   : (origin) => origin.endsWith('.example.com'),
                methods         : ['GET', 'POST', 'PUT', 'DELETE'],
                credentials     : true
            }
        }
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Input Sanitization

        ```typescript
        import { SecurityManager } from '@je-es/server';

        const security = new SecurityManager();

        security.sanitizeHtml('xss');
        security.sanitizeSql("'; DROP TABLE users--");
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### CSRF Protection

        ```typescript
        const security  = new SecurityManager();
        const token     = security.generateCsrfToken('session-id');
        const valid     = security.validateCsrfToken(token, 'session-id');
        ```

    <br>

- ## Error Handling

    ```typescript
    import {
        AppError,           // Custom errors
        ValidationError,    // 400
        DatabaseError,      // 500
        TimeoutError,       // 408
        RateLimitError      // 429
    } from '@je-es/server';

    handler : (c) => {
        if (!c.body?.email) {
            throw new ValidationError('Email required');
        }

        if (invalid) {
            throw new AppError('Invalid data', 400, 'INVALID_DATA');
        }

        return c.json({ success: true });
    }
    ```

    <br>

- ## Built-in Endpoints

    ```typescript
    // Health check
    GET /health
    // Response: { status, timestamp, uptime, activeRequests }

    // Readiness check
    GET /readiness
    // Response: { ready, checks: { database, activeRequests }, timestamp }
    ```

    <br>

- ## Advanced

    - ### Cookie Management

        ```typescript
        c.setCookie('session', 'token', {
            maxAge      : 3600,
            httpOnly    : true,
            secure      : true,
            sameSite    : 'Strict',
            path        : '/',
            domain      : 'example.com'
        });
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Static File Options

        ```typescript
        static: {
            path            : '/public',
            directory       : './public',
            maxAge          : 3600,
            index           : ['index.html'],
            dotfiles        : 'deny', // 'allow' | 'deny' | 'ignore'
            etag            : true,
            lastModified    : true,
            immutable       : false,
            extensions      : ['html', 'htm'],
            setHeaders      : (ctx, path) => {
                ctx.setHeader('X-Custom', 'value');
            }
        }
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Graceful Shutdown

        ```typescript
        const app = server({
            gracefulShutdownTimeout: 10000,
            onShutdown: async () => {
                // Cleanup
            }
        });

        process.on('SIGTERM', async () => {
            await app.stop();
            process.exit(0);
        });
        ```

        <div align="center"> <img src="./assets/img/line.png" alt="line" style="display: block; margin-top:20px;margin-bottom:20px;width:500px;"/> <br> </div>

    - ### Logging

        ```typescript
        handler : (c) => {
            c.logger?.info( { userId: 123  }, 'User action');
            c.logger?.warn( { attempt: 3   }, 'Warning');
            c.logger?.error({ error: 'msg' }, 'Error');
        }
        ```

        <br>

- ## Complete Example

    ```typescript
    import { server, table, integer, text, primaryKey, notNull } from '@je-es/server';

    const users = table('users', [
        primaryKey(integer('id'), true),
        notNull(text('name')),
        notNull(text('email'))
    ]);

    const app = server({
        port        : 3000,
        logging     : { level: 'info', pretty: true },
        database    : { connection: './app.db', schema: { users } },
        security    : {
            rateLimit   : { max: 100, windowMs: 60000 },
            cors        : { origin: ['http://localhost:3000'] }
        },
        static      : { path: '/public', directory: './public' },
        routes      : [
            {
                method  : 'GET',
                path    : '/api/users',
                handler : (c) => c.json(c.db!.all('users'))
            },
            {
                method  : 'POST',
                path    : '/api/users',
                handler : (c) => {
                    if (!c.body?.name || !c.body?.email) {
                        throw new ValidationError('Name and email required');
                    }
                    const user = c.db!.insert('users', c.body);
                    return c.status(201).json(user);
                }
            },
            {
                method  : 'GET',
                path    : '/api/users/:id',
                handler : (c) => {
                    const user = c.db!.findById('users', parseInt(c.params.id));
                    return user ? c.json(user) : c.status(404).json({ error: 'Not found' });
                }
            }
        ]
    });

    await app.start();
    ```

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->



<!-- ╔══════════════════════════════ END ══════════════════════════════╗ -->

<br>

---

<div align="center">
    <a href="https://github.com/solution-lib/space"><img src="https://img.shields.io/badge/by-Space-black"/></a>
</div>

<!-- ╚═════════════════════════════════════════════════════════════════╝ -->
