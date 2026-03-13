// Basic track (5 puzzles)
// Each puzzle: story, prompt, hints[], solution (SQL), validate()
// clue words spell: RECON → PHANTOM → EXODUS → BREACH → TRACED

export const basicPuzzles = [
    {
        id: 1,
        story: `03:47. The call woke you from a dead sleep.
"We've been hit." Your CISO's voice was flat. Controlled. Worse than panic.

Nexus Financial's core database — the one holding 15 years of client portfolios, trading histories, and personnel records — was accessed by something that shouldn't exist. No alarm triggered. No access log flagged. Whatever got in, it knew exactly where to look.

You have a read-only mirror of the database and six hours before the regulators arrive.

Start at the beginning. Before you can trace what was taken, you need to know what exists. Map the database. Find every table, then inspect the structure of the users table.`,
        prompt: `Run SHOW TABLES to list all tables, then DESCRIBE users to inspect its structure. How many columns does the users table have?`,
        expectedAnswer: '8',
        clue: 'RECON',
        hints: [
            `In MySQL, SHOW TABLES lists every table in the current database. Try it first.`,
            `After seeing the tables, use DESCRIBE users — it returns one row per column, showing the field name and data type.`,
            `SHOW TABLES;\nDESCRIBE users;`,
        ],
        solution: `SHOW TABLES;\nDESCRIBE users;`,
        validate(res, userAnswer) {
            if (parseInt(userAnswer?.trim(), 10) === 8) return true
            return 'The users table has 8 columns. Run DESCRIBE users and count the rows returned.'
        },
    },

    {
        id: 2,
        story: `The table map is in your hands. Five tables. Thousands of rows. Somewhere inside is the shape of the intruder.

You pull up the users table. Something's wrong immediately. Real employees have names, emails, departments. But several rows are hollow — critical identity fields missing entirely. NULL where there should be a person.

These aren't accidents. Someone inserted ghost accounts: records with just enough presence to authenticate, but no paper trail to follow. The cover was almost perfect.

Count them. How many users have missing identity data?`,
        prompt: `Count how many users have a NULL value in username, email, OR department.`,
        expectedAnswer: '3',
        clue: 'PHANTOM',
        hints: [
            `Use WHERE with IS NULL conditions. You need rows where ANY of the three fields is missing — connect them with OR.`,
            `SELECT COUNT(*) FROM users WHERE username IS NULL OR email IS NULL OR department IS NULL`,
            `SELECT COUNT(*) AS ghost_accounts\nFROM users\nWHERE username IS NULL\n   OR email IS NULL\n   OR department IS NULL;`,
        ],
        solution: `SELECT COUNT(*) AS ghost_accounts
FROM users
WHERE username IS NULL
   OR email IS NULL
   OR department IS NULL;`,
        validate(res, userAnswer) {
            if (parseInt(userAnswer?.trim(), 10) === 3) return true
            if (res?.[0]?.values?.[0]?.[0] === 3) return true
            return '3 ghost accounts exist. Make sure you\'re connecting each IS NULL condition with OR, not AND.'
        },
    },

    {
        id: 3,
        story: `Three ghost accounts. But ghosts don't steal data — they carry it out.

You move to the transactions table. The money flows look normal at first glance — transfers, reads, deploys. Then you see them: a cluster of data_export entries with negative amounts. In this system, negative means outbound. Data leaving.

The transactions are timestamped to a single night. The amounts are staggering.

Add them up. You need the total to put in the incident report — and to understand the true scale of what happened.`,
        prompt: `What is the total SUM of the amount column for all transactions where type = 'data_export'?`,
        expectedAnswer: '-436200',
        clue: 'EXODUS',
        hints: [
            `Use SUM() on the amount column with a WHERE clause filtering by type.`,
            `SELECT SUM(amount) FROM transactions WHERE type = 'data_export'`,
            `SELECT SUM(amount) AS total_exported\nFROM transactions\nWHERE type = 'data_export';`,
        ],
        solution: `SELECT SUM(amount) AS total_exported
FROM transactions
WHERE type = 'data_export';`,
        validate(res, userAnswer) {
            const clean = userAnswer?.trim().replace(/\s/g, '')
            if (['-436200','-436200.0','-436200.00'].includes(clean)) return true
            const val = res?.[0]?.values?.[0]?.[0]
            if (val === -436200 || val === -436200.0) return true
            return 'The total is -436200. Filter WHERE type = \'data_export\' and use SUM(amount).'
        },
    },

    {
        id: 4,
        story: `$436,200 in data value. Gone in under four minutes.

But before the attacker could export anything, they needed in. You check the audit_logs table and find the fingerprints of a brute-force attempt — a cascade of FAILED_LOGIN entries hammering a single account in rapid succession.

Standard lockout policy should have blocked this after three attempts. It didn't. Either the policy was bypassed — or someone on the inside disabled it.

Find which user_id was targeted in the brute-force, and how many times they failed.`,
        prompt: `Which user_id has the most FAILED_LOGIN entries in audit_logs? Submit your answer as user_id:count (e.g. 2:5).`,
        expectedAnswer: '4:3',
        clue: 'BREACH',
        hints: [
            `Filter WHERE action = 'FAILED_LOGIN', then GROUP BY user_id and COUNT(*) the rows.`,
            `Add ORDER BY count DESC LIMIT 1 to find the account that was hit hardest.`,
            `SELECT user_id, COUNT(*) AS attempts\nFROM audit_logs\nWHERE action = 'FAILED_LOGIN'\nGROUP BY user_id\nORDER BY attempts DESC\nLIMIT 1;`,
        ],
        solution: `SELECT user_id, COUNT(*) AS attempts
FROM audit_logs
WHERE action = 'FAILED_LOGIN'
GROUP BY user_id
ORDER BY attempts DESC
LIMIT 1;`,
        validate(res, userAnswer) {
            if (userAnswer?.trim() === '4:3') return true
            return 'Answer: 4:3 — user_id 4 was hammered 3 times. Format your answer as user_id:count.'
        },
    },

    {
        id: 5,
        story: `User_id 4's account was the door they kicked in.

Every action in the logs — the failed logins, the successful bypass, the privilege escalation, the data exports — traces back to a single IP address. It's not internal. It doesn't belong to any employee, contractor, or vendor on record.

One address. One attacker. Everything you need to build the case starts here.

Find it.`,
        prompt: `What external (non-10.x.x.x) IP address appears in the transactions table?`,
        expectedAnswer: '185.220.101.34',
        clue: 'TRACED',
        hints: [
            `Internal IPs all start with '10.' — use NOT LIKE '10.%' to exclude them.`,
            `Wrap with SELECT DISTINCT so you get one row per unique IP, not one per transaction.`,
            `SELECT DISTINCT ip_address\nFROM transactions\nWHERE ip_address NOT LIKE '10.%';`,
        ],
        solution: `SELECT DISTINCT ip_address
FROM transactions
WHERE ip_address NOT LIKE '10.%';`,
        validate(res, userAnswer) {
            if (userAnswer?.trim() === '185.220.101.34') return true
            return 'The hostile IP is 185.220.101.34. Use NOT LIKE \'10.%\' to filter out internal addresses.'
        },
    },
]
