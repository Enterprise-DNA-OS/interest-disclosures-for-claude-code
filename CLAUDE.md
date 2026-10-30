# Interest Disclosures for Claude Code

For the governance operator who records interests, runs declaration rounds and prepares committee reviews. Start with the business name, authorised operator and policy review dates. All demo people and organisations are fictional.

## Work from evidence

Run npm run interests -- help. Read before changing records. Every mutation requires --actor. Declarations, nil returns, assessments, plans and completion evidence must come from a person. Never infer consent or an outcome. Independent review is enforced against the declared person’s identity. The actor field records attribution, not authentication. This is a trusted-operator tool, not an employee self-service portal.

Never send, publish or delete. Drafts stay private under drafts/. Use archive with a supplied reason for closure after open actions are complete. Old reviews and original import columns remain available. A changed disclosure makes the prior review stale. A nil return cannot overwrite a linked declaration.

## One workflow library

| Job | Recipe |
|---|---|
| help | /help |
| list | /list |
| show | /show |
| weekly-review | /weekly-review |
| add | /add |
| open-round | /open-round |
| declare | /declare |
| amend | /amend |
| nil-return | /nil-return |
| review | /review |
| add-action | /add-action |
| complete-action | /complete-action |
| log | /log |
| archive | /archive |
| import | /import |
| export | /export |
| draft-reminders | /draft-reminders |
| draft-committee | /draft-committee |
| register | /register |
| disclosure-rounds | /disclosure-rounds |
| missing-returns | /missing-returns |
| review-queue | /review-queue |
| mitigation-due | /mitigation-due |
| monitoring-due | /monitoring-due |
| changed-interests | /changed-interests |
| entity-overlap | /entity-overlap |
| reviewer-load | /reviewer-load |
| attention | /attention |
| compliance | /compliance |
| activity | /activity |
| docs | /docs |
| view | /view |
| customise | /customise |
| new-view | /new-view |

Monday’s weekly-review combines rounds, review queue, mitigation actions and attention. Assessments tied to an older revision need fresh human review. Return reports in chat with their evidence and gaps. No report certifies legal compliance.

## Files and execution

One CLI: scripts/interests.mjs. One adapter: scripts/lib/db.mjs. Migrations live in supabase/migrations, commands in .claude/commands. brand.json controls the read-only reports and documents. DATABASE_URL selects PostgreSQL; otherwise local PGlite is used. Never seed a shared database. TEST_DATABASE_URL must be empty and disposable. RLS has no public access policies; shared use requires a configured trusted operator role. No employee access or identity integration is included. Administrators can change records; history is not tamper-proof or an electronic signature.

/customise writes and tests a new migration. /new-view adds a branded read-only report. Run npm test after changes. Sources and policy boundaries live in docs/compliance.md.

Omni by Enterprise DNA installs, customises and runs this system. https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=convergepoint-coi
