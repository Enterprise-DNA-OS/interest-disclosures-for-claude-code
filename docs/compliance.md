# Record checks and their boundaries

Checked 30 October 2026. These checks support a governance operator. They do not decide whether an interest is legally prohibited, certify compliance, replace an authorised assessment or make a regulatory filing.

## NZ-COI-MODEL: disclose, assess, manage and monitor

The New Zealand Public Service Commission’s [conflicts-of-interest model standards](https://www.publicservice.govt.nz/guidance/model-standards-conflicts-of-interest/conflicts-of-interest-model-standards) call for central records, assessment and continued monitoring of management plans. The standards concern public organisations. Private businesses can adopt this operational pattern as their own policy; it is not presented here as a universal private-sector legal requirement.

The register flags missing assessments, changed disclosures whose reviews cover an older revision, missed declaration returns, overdue monitoring and overdue mitigation actions. A managed assessment requires a plan, monitoring owner and review date. Self-review is rejected as a local separation-of-duties rule. That identity comparison is not a complete conflict search: another reviewer can have an undeclared interest too.

Annual campaigns, the thirty-day forward monitoring window and every due date are configurable business choices. No statutory annual period or deadline is claimed. The operator supplies the declaration, nil response, reviewer decision and evidence. Entity overlap matches trimmed names without regard to case; it suggests records to inspect, not that either person has acted improperly.

## NZ-IPP9: purpose and retention

The Privacy Commissioner’s [Principle 9 guidance](https://www.privacy.org.nz/privacy-principles/9/) says personal information should be retained only for as long as its lawful purpose requires. The compliance report flags missing or overdue retention-review dates, including archived records. A reminder is not deletion or proof of compliance. The business must set the lawful purpose, retention schedule, access, secure disposal and backup retention process. This tool does not automatically delete private records.

## Evidence and access

Before/after records and actor labels document the operator’s work. They are not authenticated signatures or a tamper-proof ledger. Administrators can alter the database. A fresh source import does not authenticate an old approval. A current review is a new explicit action tied to the exact disclosure revision.

Local files are intended for an authorised operator. Generated reports, exports and drafts use private file permissions where the operating system supports them and are excluded from version control. PostgreSQL uses RLS with no public policies; a trusted operator database role is needed. There is no employee login or per-person access interface. Implement and test those controls before sharing real records beyond authorised operators.
