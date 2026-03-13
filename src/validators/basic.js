// 5 puzzles — Basic track
// MySQL syntax: SHOW TABLES, DESCRIBE, standard SQL throughout

export const basicPuzzles = [
    {
        id: 1,
        story: `Intel intercept received at 02:09 on June 3rd. An unauthorised actor made contact with our internal network. Before we can trace the breach we need to understand what data assets were exposed. Your first task: map the database. Find out what tables exist, then inspect the columns of the users table.`,
        prompt: `List all tables in the database, then show the columns of the users table. How many columns does it have?`,
        expectedAnswer: '8',
        clue: 'RECON',
        hints: [
            'In MySQL, SHOW TABLES lists every table in the current database.',
            'To inspect a table\'s structure, use DESCRIBE users — it returns one row per column.',
            'SHOW TABLES;\nDESCRIBE users;',
        ],
        solution: 'SHOW TABLES;\nDESCRIBE users;',
        validate(res, userAnswer) {
            const n = parseInt(userAnswer?.trim(), 10)
            if (n === 8) return true
            return 'The users table has 8 columns. Run DESCRIBE users and count the Field rows.'
        },
    },

    {
        id: 2,
        story: `The attacker created ghost accounts — rows with missing identity fields that would slip past basic audits. We need to count how many users have NULL values in critical identity columns: username, email, or department.`,
        prompt: `How many users have a NULL value in username, email, OR department?`,
        expectedAnswer: '3',
        clue: 'PHANTOM',
        hints: [
            'Use WHERE with IS NULL conditions joined by OR.',
            'SELECT COUNT(*) FROM users WHERE username IS NULL OR email IS NULL OR department IS NULL',
            'SELECT COUNT(*) FROM users\nWHERE username IS NULL\n   OR email IS NULL\n   OR department IS NULL;',
        ],
        solution: `SELECT COUNT(*) AS ghost_count
                   FROM users
                   WHERE username IS NULL
                      OR email IS NULL
                      OR department IS NULL;`,
        validate(res, userAnswer) {
            const n = parseInt(userAnswer?.trim(), 10)
            if (n === 3) return true
            // also accept if they ran the query and it returned 3
            if (res?.[0]?.values?.[0]?.[0] === 3) return true
            return 'There are 3 ghost accounts. Check that you\'re using OR between each IS NULL condition.'
        },
    },

    {
        id: 3,
        story: `Data was being siphoned out through transactions flagged as "data_export". The amounts are negative — each one represents data leaving the system. We need the total volume of what was taken.`,
        prompt: `What is the total SUM of amount for all transactions where type = 'data_export'?`,
        expectedAnswer: '-436200',
        clue: 'EXODUS',
        hints: [
            'Use SUM() with a WHERE clause filtering on the type column.',
            'SELECT SUM(amount) FROM transactions WHERE type = \'data_export\'',
            'SELECT SUM(amount) AS total_exported\nFROM transactions\nWHERE type = \'data_export\';',
        ],
        solution: `SELECT SUM(amount) AS total_exported
FROM transactions
WHERE type = 'data_export';`,
        validate(res, userAnswer) {
            const clean = userAnswer?.trim().replace(/\s/g, '')
            if (clean === '-436200' || clean === '-436200.0' || clean === '-436200.00') return true
            const val = res?.[0]?.values?.[0]?.[0]
            if (val === -436200 || val === -436200.0) return true
            return 'The total is -436200. Make sure you\'re filtering WHERE type = \'data_export\'.'
        },
    },

    {
        id: 4,
        story: `Before the attacker gained access they hammered the login endpoint. We can see FAILED_LOGIN entries in the audit_logs table. Find which user_id had the most failed attempts and report the count.`,
        prompt: `Which user_id had the most FAILED_LOGIN entries in audit_logs? Enter your answer as user_id:count (e.g. 2:5)`,
        expectedAnswer: '4:3',
        clue: 'BREACH',
        hints: [
            'Filter WHERE action = \'FAILED_LOGIN\', then GROUP BY user_id and use COUNT(*).',
            'Add ORDER BY count DESC LIMIT 1 to surface the top offender.',
            'SELECT user_id, COUNT(*) AS attempts\nFROM audit_logs\nWHERE action = \'FAILED_LOGIN\'\nGROUP BY user_id\nORDER BY attempts DESC\nLIMIT 1;',
        ],
        solution: `SELECT user_id, COUNT(*) AS attempts
FROM audit_logs
WHERE action = 'FAILED_LOGIN'
GROUP BY user_id
ORDER BY attempts DESC
LIMIT 1;`,
        validate(res, userAnswer) {
            if (userAnswer?.trim() === '4:3') return true
            return 'The answer is 4:3 — user_id 4 had 3 failed login attempts. Format: user_id:count'
        },
    },

    {
        id: 5,
        story: `Every malicious action in the logs traces back to a single external IP address. Internal IPs follow the 10.x.x.x pattern. Find every distinct IP in the transactions table that doesn't match our internal range — that's the attacker's egress point.`,
        prompt: `What external (non-10.x.x.x) IP address appears in the transactions table?`,
        expectedAnswer: '185.220.101.34',
        clue: 'TRACED',
        hints: [
            'Use WHERE ip_address NOT LIKE \'10.%\' to exclude internal addresses.',
            'Wrap in SELECT DISTINCT so each IP appears only once.',
            'SELECT DISTINCT ip_address\nFROM transactions\nWHERE ip_address NOT LIKE \'10.%\';',
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