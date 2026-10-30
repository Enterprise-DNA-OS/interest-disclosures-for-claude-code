# /import

Read CLAUDE.md. Run `npm run interests -- import convergepoint --file=imports/report.csv --map=imports/field-map.json --dry-run --actor="Operator"`. All CLI commands support `--json`.

Read the affected records first. Replace every example value with information supplied by the operator. Record the operator as actor. Never invent evidence, a declaration or an assessment. Show the saved record and any changed review position. Ambiguous references must be resolved from the listed matches.

Read docs/replace-convergepoint-coi.md. Inspect the report headings and mapping before the dry run. Compare counts, dates and people. After the operator requests the import, run the same command without --dry-run. --update is required for changed source rows. Source approval text is retained but never becomes a current assessment.
