// src/validators/basic.js
//
// CIPHER DESIGN:
//   Clue first letters spell G · H · O · S · T
//   B1: GHOST_PROTOCOL → G
//   B2: HOLLOW         → H
//   B3: OUTFLOW        → O
//   B4: SIEGE          → S
//   B5: TERMINUS       → T
//
//   Combined with Advanced track these letters contribute to the full
//   investigation narrative — but the FinalView answer is the username
//   observed directly in Advanced Task 5, not a letter cipher.

export const basicTasks = [
    {
        id: 1,
        story: `03:47. The call drags you out of a dead sleep.\n\n"We've been hit."\n\nYour CISO's voice is flat. Controlled. That's worse than panic.\n\nNexus Financial's production database — fifteen years of client portfolios, trading histories, and personnel records — was accessed by something that has no right to exist in your systems. No alarm fired. No access log flagged it. Whatever got in knew exactly where to look.\n\nYou have a read-only forensic mirror of the database and six hours before the regulators arrive. The lawyers are already on standby.\n\nBefore you can find what was taken, you need to know what's there. You have credentials but no documentation. Map the terrain.`,
        prompt: `You have database access but no schema. What tables exist in this database, and what does the structure of the users table actually look like? How many columns are in the users table?`,
        expectedAnswer: '8',
        clue: 'GHOST_PROTOCOL',
        hints: [
            `MySQL has a command that lists every table in the current database — two words, no table name needed.`,
            `There's a separate command that shows the column structure of a specific table — what each field is called and what type it stores.`,
            `You'll need both. Run the first to see all available tables, then use the second to examine the users table specifically.`,
        ],
        solution: `SHOW TABLES;\nDESCRIBE users;`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 8) return true
            return `Count the rows returned by the structure command — each row represents one column in the table.`
        },
    },

    {
        id: 2,
        story: `The schema is in front of you. Five tables. Thousands of rows.\n\nYou pull up the users table and start scanning. Most records look legitimate — names, corporate email addresses, departments, roles. Standard employee data.\n\nThen you notice it. Several rows are hollow. Where username should be, there's nothing. Where email should be, nothing. Where department should be, nothing. Not blank strings — actual NULL values. Missing data where an identity should exist.\n\nThis isn't sloppy data entry. The pattern is too deliberate. These records have just enough presence to function as accounts — they can authenticate — but there's no real person attached to them. No trail to follow.\n\nSomeone planted them. The question is how many.`,
        prompt: `Some user records appear to be shells — real accounts with no identity data behind them. How many users are missing at least one critical identity field?`,
        expectedAnswer: '3',
        clue: 'HOLLOW',
        hints: [
            `In SQL, a missing value isn't an empty string — it has a specific representation you can test for with a special condition.`,
            `You're looking for rows where ANY of the identity fields is absent, not rows where ALL of them are — the logical operator you choose here matters.`,
            `COUNT(*) with the right WHERE clause will give you a single number. Think about what "at least one missing field" means in SQL terms.`,
        ],
        solution: `SELECT COUNT(*) AS shell_accounts
                   FROM users
                   WHERE username IS NULL
                      OR email IS NULL
                      OR department IS NULL;`,
        validate(res, answer) {
            if (parseInt(answer?.trim(), 10) === 3) return true
            return `Re-examine your WHERE clause — you want rows where any one of the identity fields is absent, not all of them.`
        },
    },

    {
        id: 3,
        story: `Three shell accounts. Created to be used and forgotten.\n\nYou move to the transactions table. Most entries are routine — service deployments, internal transfers, data reads. The kind of activity you'd expect on any given workday.\n\nThen you spot the anomaly. A cluster of transactions, all of the same type, all carrying negative amounts. In this system's ledger, negative means outbound. Data leaving the building. Not money — records. Client portfolios. Trading histories. Whatever this system holds.\n\nEvery one of them hit on the same night.\n\nThe total figure you calculate here will appear verbatim in the regulatory filing. It needs to be exact.`,
        prompt: `Something was flowing out of the system — transactions with a specific type and negative amounts. What was the total value of everything that left?`,
        expectedAnswer: '-436200',
        clue: 'OUTFLOW',
        hints: [
            `There's an aggregate function in SQL that totals up a numeric column across all matching rows.`,
            `You're only interested in one particular transaction type — look at what values exist in the type column before you filter.`,
            `Combine the aggregate function with a WHERE clause to scope it to the right subset of transactions.`,
        ],
        solution: `SELECT SUM(amount) AS total_exported
                   FROM transactions
                   WHERE type = 'data_export';`,
        validate(res, answer) {
            const clean = answer?.trim().replace(/\s/g, '')
            if (['-436200', '-436200.0', '-436200.00'].includes(clean)) return true
            const val = res?.[0]?.values?.[0]?.[0]
            if (val === -436200 || val === -436200.0) return true
            return `Check that you're filtering to the right transaction type and using an aggregate function to total the amount column.`
        },
    },

    {
        id: 4,
        story: `$436,200 in data value. Extracted in under four minutes.\n\nBut before any of that could happen, the attacker needed a way in. You check the audit_logs table — and there it is. The forensic fingerprint of a forced entry.\n\nA tight sequence of failed login attempts, all targeting the same account, all arriving within seconds of each other. Not someone mistyping their password. A machine trying combinations at speed.\n\nStandard lockout policy should have triggered after the third attempt. It didn't. Either the policy was bypassed or someone with the right access quietly turned it off.\n\nOne account bore the brunt of it. You need to know which one — and how hard they hit it.`,
        prompt: `The audit logs recorded the forced entry attempt. Which account was targeted, and how many failed attempts were made against it? Give your answer as user_id:count.`,
        expectedAnswer: '4:3',
        clue: 'SIEGE',
        hints: [
            `The audit_logs table has an action column — there's a specific value for authentication failures. A quick SELECT DISTINCT on that column will show you what values exist.`,
            `Once you've filtered to the right action type, GROUP BY lets you count how many times each user_id appears.`,
            `Sorting by the count and limiting to one row will surface the most-targeted account directly.`,
        ],
        solution: `SELECT user_id, COUNT(*) AS attempts
                   FROM audit_logs
                   WHERE action = 'FAILED_LOGIN'
                   GROUP BY user_id
                   ORDER BY attempts DESC
                       LIMIT 1;`,
        validate(res, answer) {
            if (answer?.trim() === '4:3') return true
            return `Format your answer as user_id:count — for example, 2:5 would mean user_id 2 with 5 attempts.`
        },
    },

    {
        id: 5,
        story: `The brute-force targeted one account and got in.\n\nNow you need the origin point — where the attack actually came from. Every transaction in this database carries a record of the IP address that triggered it. Your internal infrastructure operates on a known, predictable IP range. Everything else is external.\n\nMost of the activity in this table traces back to internal addresses — employees going about their day. But mixed in with the legitimate traffic, something stands out. An address that has no business being here.\n\nFind it. That's the attacker's machine. Every other thread of the investigation leads back to it.`,
        prompt: `Internal systems operate on a predictable IP range. The transactions table records the source IP for every action. Is there anything in there that doesn't belong?`,
        expectedAnswer: '185.220.101.34',
        clue: 'TERMINUS',
        hints: [
            `All internal addresses follow a consistent pattern you can filter against using a string-matching condition.`,
            `The inverse of a LIKE filter — NOT LIKE — will exclude addresses that match the internal pattern, leaving only external ones.`,
            `DISTINCT ensures each unique address appears only once in your results, regardless of how many transactions it appears in.`,
        ],
        solution: `SELECT DISTINCT ip_address
                   FROM transactions
                   WHERE ip_address NOT LIKE '10.%';`,
        validate(res, answer) {
            if (answer?.trim() === '185.220.101.34') return true
            return `Use the pattern-matching tools available in SQL to exclude the known internal address range and see what's left.`
        },
    },
]