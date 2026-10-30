# Move a ConvergePoint disclosure report

The vendor confirms ad hoc Excel and PDF reports in its [COI product sheet](https://295094.fs1.hubspotusercontent-na2.net/hubfs/295094/ConvergePoint-Website/pdf/ConvergePoint_COI_Flyer_FINAL.pdf), checked 30 October 2026. It does not document universal column names. The included fixture is synthetic and illustrates a mapped report, not an export captured from a customer account.

1. Ask the authorised ConvergePoint administrator for an Excel report of the agreed disclosures, including stable disclosure identifiers and staff identifiers. Export all required dates and details. Keep the original file privately.
2. Save the relevant worksheet as UTF-8 CSV. Set dates to YYYY-MM-DD and retain staff identifiers as text. Do not use the PDF report as a data source. Inspect the first rows, quoting and row count.
3. Add the people with their stable codes using `add`. Edit a copy of fixtures/field-map.json so each internal key names the exact report heading. Custom category values must be mapped to financial, relationship, outside-role, gift or other before import. Do not guess date conventions or category meanings.
4. Run `npm run interests -- import convergepoint --file=imports/report.csv --map=imports/field-map.json --actor="Your name" --dry-run`. Inspect counts and resolve missing or ambiguous people. A bad row rolls back the whole file, including activity.
5. Run the same command without --dry-run. Compare counts and sample records. Run register, review-queue and export. Repeating an identical report does nothing. Changed report rows require --update and changed operational fields make old reviews stale.

| Internal field | Required | Meaning |
|---|---|---|
| source_id | Yes | Stable disclosure reference from the source |
| person | Yes | Existing person code, exact name or unique partial name |
| title | Yes | Short declaration subject |
| kind | Yes | financial, relationship, outside-role, gift or other |
| entity | No | Organisation involved, used for exact normalised overlap |
| details | Yes | Supplied disclosure detail |
| declared_on | Yes | Declaration date in YYYY-MM-DD |
| review_due_on | Yes | Agreed review due date in YYYY-MM-DD |
| retention_review_on | No | Agreed purpose review date, missing values are flagged |

No mapping file is needed if the report already uses the internal headings above. Every original column is kept in source_data. Internal codes use a stable hash of the source ID to avoid unsafe characters. The source identifier stays available in list, show and export. A source decision such as Approved is retained as text only. It never creates a fresh assessment or erases review history.

This import covers the disclosure register. People, historic questionnaires, campaign returns, management plans, past review decisions, attachments, SharePoint permissions, identity and notification settings require separate, reviewed migration work. Do not cancel the old system until these have been reconciled and the owner has checked the result. Export produces a full JSON snapshot or a selected entity as CSV. It is a portable backup format, not an automatic restore command.
