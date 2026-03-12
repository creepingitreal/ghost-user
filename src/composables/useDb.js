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

export async function computeExpected(exec, answerSpec) {
    if (!answerSpec) return null

    const res = await exec(answerSpec.sql)
    const r0 = res?.[0]
    const rows = r0?.values ?? []
    if (rows.length === 0) return null

    // Column selector: name or index
    let idx = 0
    if (typeof answerSpec.column === 'number') {
        idx = answerSpec.column
    } else if (typeof answerSpec.column === 'string') {
        idx = r0.columns.indexOf(answerSpec.column)
        if (idx < 0) idx = 0
    }

    switch (answerSpec.mode) {
        case 'sql-single':
            return rows[0][idx]

        case 'sql-one-of':
            return rows.map(row => row[idx]).filter(v => v !== null && v !== undefined)

        case 'sql-count':
            return rows.length

        default:
            return rows[0][idx]
    }
}