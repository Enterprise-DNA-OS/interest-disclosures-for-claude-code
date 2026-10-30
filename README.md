# Interest Disclosures for Claude Code

Declarations, independent reviews, management plans and overdue actions in a database you own. See the interests that changed after review before the next committee meeting.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install the demo and keep your records. | Your declaration fields, review rules, exports and documents. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=convergepoint-coi&utm_source=github&utm_medium=readme) · [Instead of ConvergePoint](https://enterprisedna.co/omni/instead-of/convergepoint-coi?utm_source=github&utm_medium=readme&utm_campaign=convergepoint-coi)

## Quick start

Node 20 or later.

```bash
git clone https://github.com/Enterprise-DNA-OS/interest-disclosures-for-claude-code.git
cd interest-disclosures-for-claude-code
npm install
npm run demo
npm run interests -- weekly-review
npm run docs
npm run view
```

Open the folder with Claude Code, Codex, OpenCode or Cursor. AGENTS.md points every runtime to CLAUDE.md and the same command recipes. Local PGlite needs no database server. DATABASE_URL selects PostgreSQL. DATA_DIR changes the local database location. Never run the demo seed on business records.

ConvergePoint publishes no general price on the product page checked for this build. Its historical US federal schedule lists an annual COI licence of USD 22,972.29 for 1,000 disclosers, effective July 2023. That is evidence of a five-figure product, not a current price for an ANZ business. No ANZ customer invoice was verified. [Selection evidence](docs/research.md).

## The weekly rituals

Open the declaration round with /open-round. Record supplied declarations with /declare and explicit nil returns with /nil-return. /missing-returns identifies who still owes a response. /review-queue brings fresh and changed interests to an independent reviewer. /review records their decision and evidence. /mitigation-due and /monitoring-due keep the plan alive. /weekly-review puts the committee work in one report. /draft-reminders and /draft-committee prepare private drafts without sending.

30 CLI commands and 34 slash-command recipes. Every CLI command supports --json. Exact codes, partial UUIDs and case-insensitive name matching work. Ambiguous references list matches and fail. Use --key=value syntax.

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

## Decisions remain tied to the facts

A disclosure amendment increments its revision. Previous reviews retain the revision they assessed, and the register flags the mismatch. An independent reviewer cannot be the person declaring the interest. A managed outcome needs a written plan, a monitoring owner and a review date. An action needs evidence before completion. All writes record actor and before/after values in activity. Archive preserves the evidence and refuses while actions remain open.

The trusted operator records decisions supplied by people. Names and actor labels do not prove identity. The database administrator can change data; this is not a tamper-proof archive or electronic signature system. Sensitive records belong in a restricted deployment with backups, agreed access and retention handling. The free version is a local operator workbench, not a multi-user employee portal.

## Ten questions this build answers

These are executable capabilities, not unsupported claims that a vendor cannot answer them.

1. Which declaration rounds still have outstanding returns? Run disclosure-rounds.
2. Who has not responded, grouped by their department? Run missing-returns.
3. Which interests changed after their last assessment? Run changed-interests.
4. Which independent reviews are waiting or escalated? Run review-queue.
5. Which mitigation actions still need evidence of completion? Run mitigation-due.
6. Which management plans need monitoring in the next month? Run monitoring-due.
7. Which named organisation appears in more than one person’s disclosures? Run entity-overlap.
8. Who holds the most overdue monitoring reviews? Run reviewer-load.
9. Which personal records need a retention-purpose review? Run compliance.
10. Who changed the register, and what did the record say before? Run activity and show --ref=COI-101.

## Bring across your disclosure register

ConvergePoint documents Excel reports but does not publish fixed report headings. Export the agreed report, save its worksheet as UTF-8 CSV and map its headings. Add or import the people to the destination first. Then run:

```bash
npm run interests -- import convergepoint --file=imports/report.csv --map=imports/field-map.json --actor="Your name" --dry-run
npm run interests -- import convergepoint --file=imports/report.csv --map=imports/field-map.json --actor="Your name"
```

The importer keeps every original column, rolls back a bad batch and leaves repeated rows unchanged. A changed source row requires --update. Imported approvals remain source text until a human records a fresh review. Report mapping and reconciliation are part of the migration. [Export and mapping guide](docs/replace-convergepoint-coi.md).

## Documents and views

Change brand.json once. npm run docs produces declaration records, management plans and declaration-round committee summaries. npm run view renders the weekly queue, register and action follow-up. These are private read-only HTML snapshots; print them to PDF after checking. No server or front end is built. [What a screen adds](docs/why-no-front-end.md).

## Your first hour: ten things to ask for

1. Put our name and logo on the committee pack.
2. Add our staff codes and departments.
3. Open this year’s declaration round.
4. Map our report headings and do a dry run.
5. Bring across the reviewed register.
6. Record the people who returned explicit nil declarations.
7. Show interests that changed after review.
8. Add a business-unit field through a new migration.
9. Group overdue actions by monitoring owner.
10. Prepare the next committee’s draft pack.

/customise changes the fields or rules through a tested migration. /new-view adds a report. The default dates are business policy inputs, not statutory periods. [Compliance sources](docs/compliance.md).

## Verification

npm test creates a temporary database, applies migrations, seeds twice, exercises all 30 CLI commands and checks independent review, stale evidence, round returns, action closure, atomic imports, exports, drafts and escaped HTML. CI runs Node 20/22 on Windows and Linux plus PostgreSQL 17. Read the actual run result before claiming a platform passed.

## Built and run for you

Enterprise DNA maps your records, builds your declaration process and adds a web front end, identity connections or a different stack when agreed. Omni by Enterprise DNA installs and runs it for one setup fee, then a retainer. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=convergepoint-coi&utm_source=github&utm_medium=readme).

MIT. Not affiliated with ConvergePoint, Ideagen or Anthropic. Hosting and agent usage have their own costs.
