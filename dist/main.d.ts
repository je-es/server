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
        name?           : string
        connection      : string    // File path or ':memory:'
        schema?         : Record<string, any>
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

type ColumnType = 'INTEGER' | 'TEXT' | 'REAL' | 'BLOB' | 'NUMERIC';
type SqlValue = string | number | boolean | null | Uint8Array;
interface ColumnDefinition {
    name: string;
    type: ColumnType;
    primaryKey?: boolean;
    autoIncrement?: boolean;
    notNull?: boolean;
    unique?: boolean;
    default?: SqlValue;
    references?: {
        table: string;
        column: string;
    };
}
interface TableSchema {
    name: string;
    columns: ColumnDefinition[];
    indexes?: {
        name: string;
        columns: string[];
        unique?: boolean;
    }[];
}
interface WhereCondition {
    column: string;
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL';
    value?: SqlValue | SqlValue[];
}
interface QueryBuilder {
    select: (columns?: string[]) => QueryBuilder;
    from: (table: string) => QueryBuilder;
    where: (condition: WhereCondition | WhereCondition[]) => QueryBuilder;
    and: (condition: WhereCondition) => QueryBuilder;
    or: (condition: WhereCondition) => QueryBuilder;
    orderBy: (column: string, direction?: 'ASC' | 'DESC') => QueryBuilder;
    limit: (count: number) => QueryBuilder;
    offset: (count: number) => QueryBuilder;
    insert: (table: string, data: Record<string, SqlValue>) => QueryBuilder;
    update: (table: string, data: Record<string, SqlValue>) => QueryBuilder;
    delete: (table: string) => QueryBuilder;
    execute: () => any[];
    executeOne: () => any | null;
    executeRaw: (sql: string, params?: SqlValue[]) => any[];
    raw: (sql: string, params?: SqlValue[]) => QueryBuilder;
}
declare class DB {
    private db;
    private schemas;
    private currentQuery;
    private currentParams;
    constructor(path?: string);
    close(): void;
    defineSchema(schema: TableSchema): void;
    getSchema(tableName: string): TableSchema | undefined;
    listTables(): string[];
    dropTable(tableName: string): void;
    query(): QueryBuilder;
    find(table: string, conditions: Record<string, SqlValue>): any[];
    findOne(table: string, conditions: Record<string, SqlValue>): any | null;
    findById(table: string, id: number | string): any | null;
    all(table: string): any[];
    insert(table: string, data: Record<string, SqlValue>): any;
    update(table: string, id: number | string, data: Record<string, SqlValue>): any | null;
    delete(table: string, id: number | string): boolean;
    transaction(callback: (db: DB) => void): void;
    exec(sql: string): void;
    raw(sql: string, params?: SqlValue[]): any[];
    rawOne(sql: string, params?: SqlValue[]): any | null;
    private reset;
    private createQueryBuilder;
    private generateCreateTableSQL;
}
declare function table(name: string, columns: ColumnDefinition[]): TableSchema;
declare function column(name: string, type: ColumnType): ColumnDefinition;
declare function integer(name: string): ColumnDefinition;
declare function text(name: string): ColumnDefinition;
declare function real(name: string): ColumnDefinition;
declare function blob(name: string): ColumnDefinition;
declare function numeric(name: string): ColumnDefinition;
declare function primaryKey(col: ColumnDefinition, autoIncrement?: boolean): ColumnDefinition;
declare function notNull(col: ColumnDefinition): ColumnDefinition;
declare function unique(col: ColumnDefinition): ColumnDefinition;
declare function defaultValue(col: ColumnDefinition, value: SqlValue): ColumnDefinition;
declare function references(col: ColumnDefinition, table: string, column: string): ColumnDefinition;

declare function server(config?: ServerConfig): ServerInstance;

export { type AppContext, AppError, type AppMiddleware, type AuthConfig, type ColumnDefinition, type ColumnType, type CookieOptions, type CorsConfig, type CsrfConfig, DB, type DatabaseConfig, DatabaseError, type HelmetConfig, type HttpMethod, Logger$1 as Logger, type QueryBuilder, type RateLimitConfig, RateLimitError, type RouteDefinition, type RouteHandler, Router, type SecurityConfig, SecurityManager, type ServerConfig, type ServerInstance, type SqlValue, type TableSchema, TimeoutError, ValidationError, type WhereCondition, blob, column, server as default, defaultValue, integer, notNull, numeric, primaryKey, real, references, server, table, text, unique };
