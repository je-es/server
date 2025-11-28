export { blob, check, foreignKey, index, integer, numeric, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
export { Many, One, and, asc, between, desc, eq, exists, gt, gte, ilike, inArray, isNotNull, isNull, like, lt, lte, ne, not, notBetween, notExists, notInArray, or, relations, sql } from 'drizzle-orm';

declare class Router {
    private routes;
    private regexRoutes;
    match(method: string, path: string): {
        handler: any;
        params: Record<string, string>;
    } | null;
    getAll(): {
        method: string;
        path: string;
        handler: any;
    }[];
    clear(): void;
    remove(method: string, path: string): boolean;
    register(method: string, path: string, handler: any, config?: any): void;
    private pathToRegex;
}

declare class SecurityManager {
    private rateLimitStore;
    private csrfTokens;
    private requestLog;
    private readonly MAX_REQUEST_LOG_SIZE;
    checkRateLimit(key: string, max: number, windowMs: number): boolean;
    cleanupRateLimit(): void;
    generateCsrfToken(sessionId: string, ttl?: number): string;
    validateCsrfToken(token: string, sessionId: string): boolean;
    cleanupCsrfTokens(): void;
    sanitizeHtml(html: string): string;
    sanitizeSql(input: string): string;
    logRequest(id: string, method: string, path: string, ip: string, status: number, duration: number): void;
    getRequestLog(id: string): any;
    getAllRequestLogs(): any[];
    clearAll(): void;
    getStats(): {
        rateLimitEntries: number;
        csrfTokens: number;
        requestLogs: number;
    };
}

declare class Logger$1 {
    private level;
    private pretty;
    private levels;
    constructor(level?: 'debug' | 'info' | 'warn' | 'error', pretty?: boolean);
    debug(data: any, msg?: string): void;
    info(data: any, msg?: string): void;
    warn(data: any, msg?: string): void;
    error(data: any, msg?: string): void;
    fatal(data: any, msg?: string): void;
    private log;
}

// src/types.d.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    type HttpMethod      = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'
    type RouteHandler    = (c: AppContext) => any | Promise<any>
    type AppMiddleware   = (c: AppContext, next: () => Promise<void>) => void | Promise<void>

    interface AppContext {
        request         : Request
        params          : Record<string, string>
        query           : Record<string, any>
        body            : any
        headers         : Headers
        db              : any
        logger          : Logger | null
        user?           : any
        requestId       : string

        // Response methods
        json        (data: any,     status?: number): Response
        text        (data: string,  status?: number): Response
        html        (data: string,  status?: number): Response
        redirect    (url: string,   status?: number): Response
        file        (path: string,  contentType?: string): Response

        // Cookie methods
        setCookie       (name: string, value: string, options?: CookieOptions): AppContext
        getCookie       (name: string): string | undefined
        deleteCookie    (name: string, options?: Partial<CookieOptions>): AppContext

        // Header methods
        setHeader(key: string, value: string): AppContext
        getHeader(key: string): string | undefined

        // Status code
        status(code: number): AppContext
        statusCode: number
    }

    interface CookieOptions {
        maxAge?         : number
        expires?        : Date
        path?           : string
        domain?         : string
        secure?         : boolean
        httpOnly?       : boolean
        sameSite?       : 'Strict' | 'Lax' | 'None'
    }

    interface RouteDefinition {
        method          : HttpMethod | HttpMethod[]
        path            : string
        handler         : RouteHandler
        validate?       : { body?: any, query?: any, params?: any }
        middlewares?    : AppMiddleware[]
        timeout?        : number
        rateLimit?      : { max: number; windowMs: number }
        cache?          : number
        tags?           : string[]
    }

    interface DatabaseConfig {
        type?           : 'bun-sql' // default
        name?           : string
        connection      : string | any
        schema?         : any
        poolSize?       : number
        timeout?        : number
    }

    interface SecurityConfig {
        cors?           : boolean | CorsConfig
        rateLimit?      : boolean | RateLimitConfig
        csrf?           : boolean | CsrfConfig
        helmet?         : boolean | HelmetConfig
        auth?           : boolean | AuthConfig
        validation?     : boolean
        sanitize?       : boolean
    }

    interface CorsConfig {
        origin?         : string | string[] | ((origin: string) => boolean)
        methods?        : HttpMethod[]
        allowedHeaders? : string[]
        credentials?    : boolean
        maxAge?         : number
    }

    interface RateLimitConfig {
        windowMs?       : number
        max?            : number
        keyGenerator?   : (c: AppContext) => string
        message?        : string
    }

    interface CsrfConfig {
        secret?         : string
        headerName?     : string
        tokenTTL?       : number
    }

    interface HelmetConfig {
        contentSecurityPolicy?  : Record<string, string[]> | boolean
        hsts?                   : boolean | { maxAge?: number; includeSubDomains?: boolean; preload?: boolean }
        frameguard?             : boolean | { action: 'deny' | 'sameorigin' }
        noSniff?                : boolean
        xssFilter?              : boolean
        referrerPolicy?         : string | boolean
    }

    interface AuthConfig {
        jwt?            : boolean | { secret: string; expiresIn?: string }
        apiKey?         : boolean | { header?: string }
        bearer?         : boolean
    }

    interface ServerConfig {
        port?           : number
        hostname?       : string
        requestTimeout? : number
        maxRequestSize? : number
        maxJsonSize?    : number

        database?       : DatabaseConfig | DatabaseConfig[]

        security?       : boolean | SecurityConfig

        compression?    : boolean | { threshold?: number }

        logging?        : boolean | { level?: 'debug' | 'info' | 'warn' | 'error'; pretty?: boolean }

        routes?         : RouteDefinition[]
        middlewares?    : AppMiddleware[]

        errorHandler?   : (error: Error, context: AppContext) => void | Promise<void>
        onShutdown?     : () => void | Promise<void>

        apiPrefix?      : string
        apiVersion?     : string

        gracefulShutdownTimeout?: number
    }

    interface ServerInstance {
        app             : any
        logger          : Logger | null
        db              : Map<string, any>
        bunServer       : any
        start           : () => Promise<void>
        stop            : () => Promise<void>
        addRoute        : (route: RouteDefinition) => void
        getRoutes       : () => RouteDefinition[]
    }

    interface Logger {
        debug   (data: any, msg?: string): void
        info    (data: any, msg?: string): void
        warn    (data: any, msg?: string): void
        error   (data: any, msg?: string): void
        fatal   (data: any, msg?: string): void
    }

    declare class AppError extends Error {
        constructor(public message: string, public statusCode: number = 500, public code?: string) {
            super(message)
            this.name = 'AppError'
        }
    }

    declare class ValidationError extends AppError {
        constructor(message: string, public issues?: any) {
            super(message, 400, 'VALIDATION_ERROR')
            this.name = 'ValidationError'
        }
    }

    declare class DatabaseError extends AppError {
        constructor(message: string) {
            super(message, 500, 'DATABASE_ERROR')
            this.name = 'DatabaseError'
        }
    }

    declare class TimeoutError extends AppError {
        constructor(message = 'Request timeout') {
            super(message, 408, 'TIMEOUT_ERROR')
            this.name = 'TimeoutError'
        }
    }

    declare class RateLimitError extends AppError {
        constructor(message = 'Too many requests') {
            super(message, 429, 'RATE_LIMIT_ERROR')
            this.name = 'RateLimitError'
        }
    }

declare function server(config?: ServerConfig): ServerInstance;

export { type AppContext, AppError, type AppMiddleware, type AuthConfig, type CookieOptions, type CorsConfig, type CsrfConfig, type DatabaseConfig, DatabaseError, type HelmetConfig, type HttpMethod, Logger$1 as Logger, type RateLimitConfig, RateLimitError, type RouteDefinition, type RouteHandler, Router, type SecurityConfig, SecurityManager, type ServerConfig, type ServerInstance, TimeoutError, ValidationError, server as default, server };
