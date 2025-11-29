// src/mod/db.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ PACK ════════════════════════════════════════╗

    import { Database } from 'bun:sqlite'

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ TYPE ════════════════════════════════════════╗

    export type ColumnType = 'INTEGER' | 'TEXT' | 'REAL' | 'BLOB' | 'NUMERIC'
    export type SqlValue = string | number | boolean | null | Uint8Array

    export interface ColumnDefinition {
        name            : string
        type            : ColumnType
        primaryKey?     : boolean
        autoIncrement?  : boolean
        notNull?        : boolean
        unique?         : boolean
        default?        : SqlValue
        references?     : { table: string; column: string }
    }

    export interface TableSchema {
        name            : string
        columns         : ColumnDefinition[]
        indexes?        : { name: string; columns: string[]; unique?: boolean }[]
    }

    export interface WhereCondition {
        column          : string
        operator        : '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS NULL' | 'IS NOT NULL'
        value?          : SqlValue | SqlValue[]
    }

    export interface QueryBuilder {
        select      : (columns?: string[]) => QueryBuilder
        from        : (table: string) => QueryBuilder
        where       : (condition: WhereCondition | WhereCondition[]) => QueryBuilder
        and         : (condition: WhereCondition) => QueryBuilder
        or          : (condition: WhereCondition) => QueryBuilder
        orderBy     : (column: string, direction?: 'ASC' | 'DESC') => QueryBuilder
        limit       : (count: number) => QueryBuilder
        offset      : (count: number) => QueryBuilder
        insert      : (table: string, data: Record<string, SqlValue>) => QueryBuilder
        update      : (table: string, data: Record<string, SqlValue>) => QueryBuilder
        delete      : (table: string) => QueryBuilder
        execute     : () => any[]
        executeOne  : () => any | null
        executeRaw  : (sql: string, params?: SqlValue[]) => any[]
        raw         : (sql: string, params?: SqlValue[]) => QueryBuilder
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

    export class DB {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

            private db              : Database
            private schemas         : Map<string, TableSchema> = new Map()
            private currentQuery    : string = ''
            private currentParams   : SqlValue[] = []

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── CORE ──────────────────────────────┐

            constructor(path: string = ':memory:') {
                this.db = new Database(path)
                this.db.exec('PRAGMA foreign_keys = ON')
            }

            close() {
                this.db.close()
            }

            // ════════ Schema Management ════════
            defineSchema(schema: TableSchema): void {
                this.schemas.set(schema.name, schema)
                const sql = this.generateCreateTableSQL(schema)
                this.db.exec(sql)

                // Create indexes
                if (schema.indexes) {
                    for (const index of schema.indexes) {
                        const uniqueStr = index.unique ? 'UNIQUE' : ''
                        const indexSql = `CREATE ${uniqueStr} INDEX IF NOT EXISTS ${index.name} ON ${schema.name} (${index.columns.join(', ')})`
                        this.db.exec(indexSql)
                    }
                }
            }

            getSchema(tableName: string): TableSchema | undefined {
                return this.schemas.get(tableName)
            }

            listTables(): string[] {
                const result = this.db.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()
                return result.map((r: any) => r.name)
            }

            dropTable(tableName: string): void {
                this.db.exec(`DROP TABLE IF EXISTS ${tableName}`)
                this.schemas.delete(tableName)
            }

            // ════════ Query Builder ════════
            query(): QueryBuilder {
                this.reset()
                return this.createQueryBuilder()
            }

            // ════════ Quick Operations ════════
            find(table: string, conditions: Record<string, SqlValue>): any[] {
                const whereConditions: WhereCondition[] = Object.entries(conditions).map(([column, value]) => ({
                    column,
                    operator: '=' as const,
                    value
                }))

                return this.query()
                    .select()
                    .from(table)
                    .where(whereConditions)
                    .execute()
            }

            findOne(table: string, conditions: Record<string, SqlValue>): any | null {
                return this.query()
                    .select()
                    .from(table)
                    .where(Object.entries(conditions).map(([column, value]) => ({
                        column,
                        operator: '=' as const,
                        value
                    })))
                    .limit(1)
                    .executeOne()
            }

            findById(table: string, id: number | string): any | null {
                return this.findOne(table, { id })
            }

            all(table: string): any[] {
                return this.query().select().from(table).execute()
            }

            insert(table: string, data: Record<string, SqlValue>): any {
                this.query().insert(table, data).execute()

                // Return inserted row
                const lastId = this.db.query('SELECT last_insert_rowid() as id').get() as any
                return this.findById(table, lastId.id)
            }

            update(table: string, id: number | string, data: Record<string, SqlValue>): any | null {
                this.query()
                    .update(table, data)
                    .where({ column: 'id', operator: '=', value: id })
                    .execute()

                return this.findById(table, id)
            }

            delete(table: string, id: number | string): boolean {
                const result = this.query()
                    .delete(table)
                    .where({ column: 'id', operator: '=', value: id })
                    .execute()

                return true
            }

            // ════════ Transactions ════════
            transaction(callback: (db: DB) => void): void {
                this.db.exec('BEGIN TRANSACTION')
                try {
                    callback(this)
                    this.db.exec('COMMIT')
                } catch (error) {
                    this.db.exec('ROLLBACK')
                    throw error
                }
            }

            // ════════ Raw SQL ════════
            exec(sql: string): void {
                this.db.exec(sql)
            }

            raw(sql: string, params: SqlValue[] = []): any[] {
                const stmt = this.db.query(sql)
                return stmt.all(...params) as any[]
            }

            rawOne(sql: string, params: SqlValue[] = []): any | null {
                const stmt = this.db.query(sql)
                return stmt.get(...params) as any | null
            }

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            private reset(): void {
                this.currentQuery = ''
                this.currentParams = []
            }

            private createQueryBuilder(): QueryBuilder {
                const builder: any = {
                    _select: ['*'],
                    _from: '',
                    _where: [] as string[],
                    _orderBy: '',
                    _limit: null as number | null,
                    _offset: null as number | null,
                    _isInsert: false,
                    _isUpdate: false,
                    _isDelete: false,
                    _insertData: null as Record<string, SqlValue> | null,
                    _updateData: null as Record<string, SqlValue> | null
                }

                const self = this

                builder.select = function(columns?: string[]) {
                    this._select = columns || ['*']
                    return this
                }

                builder.from = function(table: string) {
                    this._from = table
                    return this
                }

                builder.where = function(condition: WhereCondition | WhereCondition[]) {
                    const conditions = Array.isArray(condition) ? condition : [condition]

                    const whereClauses = conditions.map(cond => {
                        if (cond.operator === 'IS NULL' || cond.operator === 'IS NOT NULL') {
                            return `${cond.column} ${cond.operator}`
                        } else if (cond.operator === 'IN' && Array.isArray(cond.value)) {
                            const placeholders = cond.value.map(() => '?').join(', ')
                            // Spread array values into params
                            cond.value.forEach(val => {
                                self.currentParams.push(val as SqlValue)
                            })
                            return `${cond.column} IN (${placeholders})`
                        } else {
                            self.currentParams.push(cond.value as SqlValue)
                            return `${cond.column} ${cond.operator} ?`
                        }
                    })

                    this._where.push(...whereClauses)
                    return this
                }

                builder.and = function(condition: WhereCondition) {
                    return this.where(condition)
                }

                builder.or = function(condition: WhereCondition) {
                    if (condition.operator === 'IS NULL' || condition.operator === 'IS NOT NULL') {
                        this._where.push(`OR ${condition.column} ${condition.operator}`)
                    } else if (condition.operator === 'IN' && Array.isArray(condition.value)) {
                        const placeholders = condition.value.map(() => '?').join(', ')
                        // Spread array values into params
                        condition.value.forEach(val => {
                            self.currentParams.push(val as SqlValue)
                        })
                        this._where.push(`OR ${condition.column} IN (${placeholders})`)
                    } else {
                        self.currentParams.push(condition.value as SqlValue)
                        this._where.push(`OR ${condition.column} ${condition.operator} ?`)
                    }
                    return this
                }

                builder.orderBy = function(column: string, direction: 'ASC' | 'DESC' = 'ASC') {
                    this._orderBy = `ORDER BY ${column} ${direction}`
                    return this
                }

                builder.limit = function(count: number) {
                    this._limit = count
                    return this
                }

                builder.offset = function(count: number) {
                    this._offset = count
                    return this
                }

                builder.insert = function(table: string, data: Record<string, SqlValue>) {
                    this._isInsert = true
                    this._from = table
                    this._insertData = data
                    return this
                }

                builder.update = function(table: string, data: Record<string, SqlValue>) {
                    this._isUpdate = true
                    this._from = table
                    this._updateData = data
                    return this
                }

                builder.delete = function(table: string) {
                    this._isDelete = true
                    this._from = table
                    return this
                }

                builder.raw = function(sql: string, params: SqlValue[] = []) {
                    self.currentQuery = sql
                    self.currentParams = params
                    return this
                }

                builder.execute = function() {
                    let sql = ''

                    if (this._isInsert && this._insertData) {
                        const columns = Object.keys(this._insertData)
                        const placeholders = columns.map(() => '?').join(', ')
                        sql = `INSERT INTO ${this._from} (${columns.join(', ')}) VALUES (${placeholders})`
                        self.currentParams = Object.values(this._insertData)
                    } else if (this._isUpdate && this._updateData) {
                        const setClauses = Object.keys(this._updateData).map(col => `${col} = ?`)
                        const updateValues = Object.values(this._updateData)
                        self.currentParams = [...updateValues, ...self.currentParams] as SqlValue[]
                        sql = `UPDATE ${this._from} SET ${setClauses.join(', ')}`

                        if (this._where.length > 0) {
                            sql += ` WHERE ${this._where.join(' AND ')}`
                        }
                    } else if (this._isDelete) {
                        sql = `DELETE FROM ${this._from}`

                        if (this._where.length > 0) {
                            sql += ` WHERE ${this._where.join(' AND ')}`
                        }
                    } else {
                        // SELECT query
                        sql = `SELECT ${this._select.join(', ')} FROM ${this._from}`

                        if (this._where.length > 0) {
                            sql += ` WHERE ${this._where.join(' AND ')}`
                        }

                        if (this._orderBy) {
                            sql += ` ${this._orderBy}`
                        }

                        if (this._limit !== null) {
                            sql += ` LIMIT ${this._limit}`
                        }

                        if (this._offset !== null) {
                            sql += ` OFFSET ${this._offset}`
                        }
                    }

                    if (!sql && self.currentQuery) {
                        sql = self.currentQuery
                    }

                    const stmt = self.db.query(sql)
                    const result = stmt.all(...self.currentParams) as unknown[]
                    self.reset()
                    return result as any[]
                }

                builder.executeOne = function() {
                    const results = this.execute()
                    return results.length > 0 ? results[0] : null
                }

                builder.executeRaw = function(sql: string, params: SqlValue[] = []) {
                    const stmt = self.db.query(sql)
                    const result = stmt.all(...params) as unknown[]
                    return result as any[]
                }

                return builder as QueryBuilder
            }

            private generateCreateTableSQL(schema: TableSchema): string {
                const columnDefs = schema.columns.map(col => {
                    let def = `${col.name} ${col.type}`

                    if (col.primaryKey) {
                        def += ' PRIMARY KEY'
                        if (col.autoIncrement) {
                            def += ' AUTOINCREMENT'
                        }
                    }

                    if (col.notNull && !col.primaryKey) {
                        def += ' NOT NULL'
                    }

                    if (col.unique) {
                        def += ' UNIQUE'
                    }

                    if (col.default !== undefined) {
                        if (typeof col.default === 'string') {
                            def += ` DEFAULT '${col.default}'`
                        } else if (col.default === null) {
                            def += ' DEFAULT NULL'
                        } else {
                            def += ` DEFAULT ${col.default}`
                        }
                    }

                    if (col.references) {
                        def += ` REFERENCES ${col.references.table}(${col.references.column})`
                    }

                    return def
                })

                return `CREATE TABLE IF NOT EXISTS ${schema.name} (${columnDefs.join(', ')})`
            }

        // └────────────────────────────────────────────────────────────────────┘

    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝



// ╔════════════════════════════════════════ HELP ════════════════════════════════════════╗

    // ════════ Schema Builder Helpers ════════
    export function table(name: string, columns: ColumnDefinition[]): TableSchema {
        return { name, columns }
    }

    export function column(name: string, type: ColumnType): ColumnDefinition {
        return { name, type }
    }

    export function integer(name: string): ColumnDefinition {
        return { name, type: 'INTEGER' }
    }

    export function text(name: string): ColumnDefinition {
        return { name, type: 'TEXT' }
    }

    export function real(name: string): ColumnDefinition {
        return { name, type: 'REAL' }
    }

    export function blob(name: string): ColumnDefinition {
        return { name, type: 'BLOB' }
    }

    export function numeric(name: string): ColumnDefinition {
        return { name, type: 'NUMERIC' }
    }

    // ════════ Column Modifiers ════════
    export function primaryKey(col: ColumnDefinition, autoIncrement = false): ColumnDefinition {
        return { ...col, primaryKey: true, autoIncrement }
    }

    export function notNull(col: ColumnDefinition): ColumnDefinition {
        return { ...col, notNull: true }
    }

    export function unique(col: ColumnDefinition): ColumnDefinition {
        return { ...col, unique: true }
    }

    export function defaultValue(col: ColumnDefinition, value: SqlValue): ColumnDefinition {
        return { ...col, default: value }
    }

    export function references(col: ColumnDefinition, table: string, column: string): ColumnDefinition {
        return { ...col, references: { table, column } }
    }

// ╚══════════════════════════════════════════════════════════════════════════════════════╝