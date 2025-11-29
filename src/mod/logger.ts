// src/mod/logger.ts
//
// Developed with ❤️ by Maysara.



// ╔════════════════════════════════════════ CORE ════════════════════════════════════════╗

	export class Logger {

        // ┌──────────────────────────────── INIT ──────────────────────────────┐

			private level	: number 	= 1
			private pretty	: boolean 	= false
			private levels				= { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 }

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
				// Fatal errors might need additional handling in production
				if (process.env.NODE_ENV === 'production') {
					// Could send to external logging service here
				}
			}

        // └────────────────────────────────────────────────────────────────────┘


        // ┌──────────────────────────────── HELP ──────────────────────────────┐

			private log(level: string, levelNum: number, data: any, msg?: string) {
				if (levelNum < this.level) return

				const ts = new Date().toISOString()

				// Handle null/undefined data gracefully
				const safeData = data ?? {}

				const output = {
					timestamp	: ts,
					level		: level.toUpperCase(),
					message		: msg || 'No message',
					...safeData
				}

				const str = this.pretty
				? `[${ts}] ${level.toUpperCase()} ${msg || 'No message'}\n${JSON.stringify(safeData, null, 2)}`
				: JSON.stringify(output)

				if (level === 'error' || level === 'fatal') {
					console.error(str)
				} else if (level === 'warn') {
					console.warn(str)
				} else {
					console.log(str)
				}
			}

        // └────────────────────────────────────────────────────────────────────┘

	}

// ╚══════════════════════════════════════════════════════════════════════════════════════╝
