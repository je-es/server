// src/mod/logger.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

	export class Logger {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

			private level	: number 	= 1
			private pretty	: boolean 	= false
			private levels				= { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 }

			// ANSI color codes
			private colors = {
				reset	: '\x1b[0m',
				gray	: '\x1b[90m',
				cyan	: '\x1b[36m',
				green	: '\x1b[32m',
				yellow	: '\x1b[33m',
				red		: '\x1b[31m',
				magenta	: '\x1b[35m',
				bold	: '\x1b[1m'
			}

			constructor(level: 'debug' | 'info' | 'warn' | 'error' = 'info', pretty = false) {
				this.level 	= this.levels[level] ?? 1
				this.pretty = pretty
			}


        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── MAIN ──────────────────────────────┐

			debug(data: any, msg?: string) {
				this.log('debug', this.levels.debug, data, msg)
			}

			info(data: any, msg?: string) {
				this.log('info', this.levels.info, data, msg)
			}

			warn(data: any, msg?: string) {
				this.log('warn', this.levels.warn, data, msg)
			}

			error(data: any, msg?: string) {
				this.log('error', this.levels.error, data, msg)
			}

			fatal(data: any, msg?: string) {
				this.log('fatal', this.levels.fatal, data, msg)
				if (process.env.NODE_ENV === 'production') {
					// Could send to external logging service here
				}
			}

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

            private log(level: string, levelNum: number, data: any, msg?: string) {
                if (levelNum < this.level) return

                // Handle when data is a string message
                let safeData: any
                let safeMsg: string | undefined

                if (typeof data === 'string') {
                    safeMsg = data
                    safeData = {}
                } else {
                    safeData = data ?? {}
                    safeMsg = msg
                }

                if (this.pretty) {
                    this.prettyLog(level, safeData, safeMsg)
                } else {
                    // JSON format (unchanged for compatibility)
                    const ts = new Date().toISOString()
                    const output = {
                        timestamp	: ts,
                        level		: level.toUpperCase(),
                        message		: safeMsg || 'No message',
                        ...safeData
                    }
                    const str = JSON.stringify(output)

                    if (level === 'error' || level === 'fatal') {
                        console.error(str)
                    } else if (level === 'warn') {
                        console.warn(str)
                    } else {
                        console.log(str)
                    }
                }
            }

			private prettyLog(level: string, data: any, msg?: string) {
				const c = this.colors
				const time = new Date().toLocaleTimeString('en-US', { hour12: false })

				// Special handling for request logs (Morgan-style)
				if (data.method && data.path && data.status !== undefined) {
					const method = this.colorizeMethod(data.method)
					const status = this.colorizeStatus(data.status)
					const duration = data.duration ? `${data.duration}ms` : ''
					const path = data.path

					console.log(
						`${c.gray}${time}${c.reset} ` +
						`${method} ` +
						`${c.bold}${path}${c.reset} ` +
						`${status} ` +
						`${c.gray}${duration}${c.reset}`
					)
					return
				}

				// Special handling for route registration
				if (msg === 'Route added' && data.method && data.path) {
					const methods = Array.isArray(data.method) ? data.method.join('|') : data.method
					console.log(
						`${c.gray}${time}${c.reset} ` +
						`${c.cyan}→${c.reset} ` +
						`${c.bold}${methods.padEnd(6)}${c.reset} ` +
						`${data.path}`
					)
					return
				}

				// Special handling for database connection
				if (msg === '✔ Database connected') {
					console.log(
						`${c.gray}${time}${c.reset} ` +
						`${c.green}✓${c.reset} ` +
						`Database connected ${c.gray}(${data.name})${c.reset}`
					)
					return
				}

				// Special handling for server start
				if (msg === 'Server started') {
					console.log(
						`${c.gray}${time}${c.reset} ` +
						`${c.green}✓${c.reset} ` +
						`Server started at ${c.cyan}${data.url}${c.reset}`
					)
					return
				}

				// Generic colored output
				const icon = this.getLevelIcon(level)
				const color = this.getLevelColor(level)

				let output = `${c.gray}${time}${c.reset} ${color}${icon}${c.reset} `

				if (msg) {
					output += `${msg} `
				}

				// Add key data points inline
				const keys = Object.keys(data).filter(k =>
					!['timestamp', 'level', 'message'].includes(k)
				)

				if (keys.length > 0) {
					const parts = keys.map(k => {
						const val = data[k]
						if (typeof val === 'string' || typeof val === 'number') {
							return `${c.gray}${k}:${c.reset}${val}`
						}
						return null
					}).filter(Boolean)

					if (parts.length > 0) {
						output += c.gray + parts.join(' ') + c.reset
					}
				}

				console.log(output)
			}

			private colorizeMethod(method: string): string {
				const c = this.colors
				const m = method.toUpperCase()

				switch (m) {
					case 'GET':		return `${c.green}${m}${c.reset}`
					case 'POST':	return `${c.cyan}${m}${c.reset}`
					case 'PUT':		return `${c.yellow}${m}${c.reset}`
					case 'DELETE':	return `${c.red}${m}${c.reset}`
					case 'PATCH':	return `${c.magenta}${m}${c.reset}`
					default:		return `${c.gray}${m}${c.reset}`
				}
			}

			private colorizeStatus(status: number | undefined): string {
				if (!status) return ''

				const c = this.colors
				const s = status.toString()

				if (status >= 200 && status < 300) {
					return `${c.green}${s}${c.reset}`
				} else if (status >= 300 && status < 400) {
					return `${c.cyan}${s}${c.reset}`
				} else if (status >= 400 && status < 500) {
					return `${c.yellow}${s}${c.reset}`
				} else if (status >= 500) {
					return `${c.red}${s}${c.reset}`
				}
				return `${c.gray}${s}${c.reset}`
			}

			private getLevelIcon(level: string): string {
				switch (level) {
					case 'debug':	return '-'
					case 'info':	return '-'
					case 'warn':	return '-'
					case 'error':	return '-'
					case 'fatal':	return '-'
					default:		return '-'
				}
			}

			private getLevelColor(level: string): string {
				const c = this.colors
				switch (level) {
					case 'debug':	return c.gray
					case 'info':	return c.cyan
					case 'warn':	return c.yellow
					case 'error':	return c.red
					case 'fatal':	return c.red + c.bold
					default:		return c.reset
				}
			}

        // └────────────────────────────────────────────────────────────────────┘

	}

// ╚══════════════════════════════════════════════════════════════════════════════════════╝