// puzzles/advanced.js

function rows(res) {
    return res?.[0]?.values || []
}

function cols(res) {
    return res?.[0]?.columns || []
}

export const advancedPuzzles = [
    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 1,
        story: `
██████████████████████████████████████████████████
  OPERATION: GHOST UNMASK — ACTIVE
  CLEARANCE LEVEL: ELEVATED
  ANALYST STATUS: FIELD OPERATIVE
██████████████████████████████████████████████████

You completed the orientation. Now the real work begins.

The basic investigation confirmed the breach happened. What it didn't tell
you is HOW many distinct actors were involved, or whether the Ghost User 
operated alone or with infrastructure support.

We know the hostile external IP: 185.220.101.34.
We know sessions were opened from it.

Your first task in this investigation: establish the full scope of the 
compromise. Cross-reference the sessions table against users and audit_logs.

How many DISTINCT user accounts were accessed from the hostile IP during
the breach window (2024-06-03 00:00:00 to 2024-06-03 23:59:59)?
`,
        prompt: 'How many distinct user accounts were active from the hostile IP on 2024-06-03?',
        expectedAnswer: '4',
        clue: 'VECTOR',
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'Join sessions to users and filter by ip_address and date.'
            const n = parseInt(userAnswer.trim())
            return n === 4 || 'COUNT DISTINCT user_id from sessions — filter for the hostile IP and the breach date.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 2,
        story: `
██ VECTOR CONFIRMED ██

Four accounts. One IP. This wasn't opportunistic — it was orchestrated.

The sessions table holds something else of interest: user_agent strings.
Legitimate users connect via browsers. What the Ghost User used tells us
about the tools they brought to the breach.

Examine the user_agent strings associated with the hostile IP sessions.
Legitimate browser traffic has a signature. Automated tools have their own.

How many of the hostile sessions used non-browser tooling (i.e. NOT a 
Mozilla user agent)?
`,
        prompt: 'How many hostile sessions used non-browser tools (not Mozilla)? Enter a number.',
        expectedAnswer: '3',
        clue: 'TOOLKIT',
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'Filter sessions by IP and examine the user_agent values.'
            const n = parseInt(userAnswer.trim())
            return n === 3 || 'Filter for the hostile IP, then look at user_agent — count those that are not browser-based.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 3,
        story: `
██ TOOLKIT IDENTIFIED ██

curl and python-requests. The Ghost User was running scripts — automated
attacks, not manual keystrokes. This was planned.

Now examine the network_events table. It contains raw packet-level data
from the night of the breach. The attacker moved through our network
in a specific order — probing, connecting, then extracting.

Map the Ghost User's network traversal. List the distinct ports they 
connected to, in the order they first appeared, during the breach.

The network events table logs both inbound connections TO our systems 
and outbound DATA leaving our systems. Separate these two flows.

What port did the attacker use first when initially probing our network?
`,
        prompt: 'What was the first port number the attacker connected to on our network?',
        expectedAnswer: '443',
        clue: 'INGRESS',
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'ORDER BY created_at and filter for connections from the hostile IP TO internal addresses.'
            const n = parseInt(userAnswer.trim())
            return n === 443 || 'Look at network_events where src_ip is the hostile address — order by time and find the first port.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 4,
        story: `
██ INGRESS MAPPED ██

443, then 22, then 5432. HTTPS first — probing the web layer. 
Then SSH — attempting shell access. Then 5432 — a direct database 
connection. They didn't just steal data through the application — 
they went straight to the database port.

Now we need to quantify the damage precisely. The network_events table 
records bytes_sent for each event. The DATA_OUT events tell us exactly
how much left the network through the wire.

But we need to correlate this to the transactions table to understand
WHICH user_ids were responsible for each chunk of data that left.

The transactions table records amounts as negative values for outbound
exports. The network_events records bytes_sent as positive.

Which single user_id was responsible for the LARGEST individual 
data export transaction?
`,
        prompt: 'Which user_id had the single largest (most negative) data export transaction?',
        expectedAnswer: '11',
        clue: 'PRIMARY',
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'Query transactions where type is data_export and find the MIN(amount) — then get the user_id.'
            const n = parseInt(userAnswer.trim())
            return n === 11 || 'Find the most extreme negative amount in transactions and trace it back to a user_id.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 5,
        story: `
██ PRIMARY EXFIL ACTOR IDENTIFIED ██

User ID 11. Let's look at that account more carefully.

Retrieve the full profile of user_id 11 from the users table.
Something about this account won't look like any legitimate employee
in the system. Compare it mentally to the other accounts you've seen.

This account has a username that follows a non-human pattern, 
an email pointing to a null domain, and a department that doesn't 
exist in the real org chart.

Once you've pulled the record, note the username.
What is the exact username of user_id 11?
`,
        prompt: 'What is the username of user_id 11?',
        expectedAnswer: 'ghost_proc_44',
        clue: 'IDENTITY',
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'SELECT from users WHERE id = 11 and read the username column.'
            return userAnswer.trim().toLowerCase() === 'ghost_proc_44' ||
                'Query the users table directly for id 11 — the username is the answer.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 6,
        story: `
██ IDENTITY FRAGMENT RECOVERED: ghost_proc_44 ██

A process account. Automated. Zero human oversight built in.
This wasn't a user — it was a weapon. Planted in the user table to 
act with legitimate credentials while behaving like a script.

Now we need to reconstruct the privilege chain. The Ghost User didn't 
start with admin rights — they built up to them. Each escalation is 
recorded in audit_logs under a specific action type.

Using a window function, reconstruct the escalation sequence.
For each PRIV_ESCALATION event, show the action that PRECEDED it 
using LAG(), and the action that FOLLOWED it using LEAD().

How many total PRIV_ESCALATION events occurred during the breach?
`,
        prompt: 'How many PRIV_ESCALATION events are recorded in the audit_logs?',
        expectedAnswer: '3',
        clue: 'ESCALATE',
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'COUNT the rows in audit_logs where action = PRIV_ESCALATION.'
            const n = parseInt(userAnswer.trim())
            return n === 3 || 'Filter audit_logs by the escalation action and count the rows.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 7,
        story: `
██ ESCALATION CHAIN CONFIRMED ██

Three escalations. Three different accounts. The Ghost User built 
a web of elevated identities — each one capable of acting independently 
if another was caught.

Now the hardest forensic question: the audit_logs were tampered with.
We know ALTER_AUDIT_LOG events occurred. But ALTER events log themselves
before the deletion executes — so we can see the damage described in the 
detail column.

One of the ALTER_AUDIT_LOG entries describes exactly how many audit 
records were deleted. This number is critical for the legal case.

Find the ALTER_AUDIT_LOG event where the detail column mentions a 
specific count of deleted entries.

How many entries were deleted according to that log record?
`,
        prompt: 'How many audit log entries were deleted according to the detail field?',
        expectedAnswer: '44',
        clue: 'ERASURE',
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'SELECT detail FROM audit_logs WHERE action = "ALTER_AUDIT_LOG" and read carefully.'
            const n = parseInt(userAnswer.trim())
            return n === 44 || 'Look at the detail text in the ALTER_AUDIT_LOG entries — one contains a specific count.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 8,
        story: `
██ ERASURE SCOPE QUANTIFIED ██

44 records deleted. And notice the username in ghost_proc_44 — 
those digits: 44. A signature hidden in plain sight.

Now we build the complete timeline. This is your most complex query yet.

Using a JOIN across audit_logs and users, produce a chronological 
event log showing: the timestamp, the username (or the literal text 
"[UNKNOWN]" if username is NULL), the action, the detail, and the IP.

Filter this to ONLY events from the hostile IP: 185.220.101.34
Order by time ascending.

The second-to-last action recorded before the Ghost User disconnected —
what was it?
`,
        prompt: 'What action appears second-to-last in the hostile IP timeline?',
        expectedAnswer: 'DATA_EXFIL',
        clue: 'TIMELINE',
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'Build the full chronological event list filtered by the hostile IP.'
            return userAnswer.trim().toUpperCase() === 'DATA_EXFIL' ||
                'Order events from the hostile IP by created_at — what action is in the second-to-last row?'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 9,
        story: `
██ TIMELINE RECONSTRUCTED ██

Now we need to measure the full financial and operational impact.

Three tables hold the data: users, transactions, and audit_logs.
You need to produce an executive impact summary using aggregation.

Write a single query (using subqueries or CTEs) that returns:
  · The count of compromised user accounts (from hostile IP in sessions)
  · The total bytes exfiltrated (SUM of bytes_sent for DATA_OUT in network_events)
  · The total number of audit records tampered (COUNT of ALTER_AUDIT_LOG events)

This is a multi-source aggregation. You may use multiple SELECT 
statements or build a single query with subqueries.

What is the total number of bytes recorded as DATA_OUT 
in the network_events table?
`,
        prompt: 'What is the total bytes_sent across all DATA_OUT network events?',
        expectedAnswer: '436200000',
        clue: 'IMPACT',
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'SUM the bytes_sent column filtering for DATA_OUT event_type.'
            const n = parseInt(userAnswer.trim().replace(/,/g, ''))
            return n === 436200000 || 'Filter network_events where event_type = "DATA_OUT" and SUM the bytes_sent.'
        }
    },

    // ─────────────────────────────────────────────────────────────────────────
    {
        id: 10,
        story: `
██ IMPACT ASSESSMENT COMPLETE ██

436,200,000 bytes. 436 megabytes of corporate data — exfiltrated in 
under 33 seconds. 44 audit records deleted to cover the tracks.
Four accounts hijacked. Three privilege escalations. One ghost.

There is one final piece. The Ghost User left a signature — 
not by accident, but by design. It's in the data, stitched across 
multiple tables. The number 44 appears in the username: ghost_proc_44.
The same number of audit records was deleted. The ghost_proc_44 account
was created at 02:09 — five minutes before the breach completed.

Your final task: produce a single query that uses a WITH clause (CTE)
to first isolate all hostile user_ids from sessions, then joins that
result to users to retrieve their usernames, then ranks them by their
total transaction volume (SUM of ABS(amount) from transactions).

Who ranks #1 — the account responsible for the greatest total 
transaction volume during the breach?

This is the Ghost User's primary instrument. Name it.
`,
        prompt: 'What is the username of the account with the highest total transaction volume on the hostile IP?',
        expectedAnswer: 'ghost_proc_44',
        clue: 'UNMASKED',
        validate: (res, userAnswer) => {
            if (!userAnswer) return 'Build a CTE from sessions → users → transactions and rank by total ABS(amount).'
            return userAnswer.trim().toLowerCase() === 'ghost_proc_44' ||
                'Use a CTE to join sessions (hostile IP) → users → transactions. RANK or ORDER BY SUM(ABS(amount)) DESC.'
        }
    }
]