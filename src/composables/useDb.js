import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

let dbPromise = null

export function useDb() {
    if (!dbPromise) {
        dbPromise = (async () => {
            const SQL = await initSqlJs({
                locateFile: () => wasmUrl
            })

            const db = new SQL.Database()

            const seedUrl = `${import.meta.env.BASE_URL}db/ghost-user-db.sql`
            const res = await fetch(seedUrl)
            if (!res.ok) {
                throw new Error(`Failed to load seed SQL: ${res.status}`)
            }

            const seedText = await res.text()
            db.run(seedText)

            return db
        })()
    }

    return {
        async exec(query) {
            const db = await dbPromise
            return db.exec(query)
        }
    }
}
``