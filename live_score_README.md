Live Score CSV Template

Purpose
- Simple ball-by-ball template for testing live score flows. Open in Excel, Google Sheets, or any spreadsheet app.

Columns
- Over: Over number (1-based integer)
- Ball: Ball number within the over (1-6; extras may still be recorded on the same ball index)
- Innings: Innings number (1 or 2)
- Striker: Batsman facing the delivery
- Non-Striker: Other batsman at the crease
- Bowler: Bowler for that delivery
- Runs: Runs scored off the bat on that delivery (0 if none)
- Extras: Extras off the delivery (wides, no-balls, byes, leg-byes) — record as numeric; use the `Wicket` column for wickets on extras if needed
- Wicket: Brief wicket note or type (e.g., "c Smith b Jones", "run out", leave blank if no wicket)
- Notes: Any additional context (e.g., "end of over", "powerplay start")

Usage
- Each row represents a single delivery. Group by `Over` to aggregate balls per over.
- Open `live_score_template.csv` in Excel: File → Open, choose CSV; Excel will parse columns automatically.
- To create an actual `.xlsx` workbook with separate sheets per over, I can provide a small script (Python/Node) to convert and split the CSV into multiple sheets.

Examples
- The CSV contains sample deliveries for two overs to illustrate how to fill striker/non-striker and bowler columns.

Next steps (optional)
- Convert to `.xlsx` and create one sheet per over.
- Add columns for ball timestamps, batter IDs, and bowler IDs for integration testing.

If you want, I can: convert this CSV to `.xlsx`, produce a per-over sheet generator script, or expand the template with more fields. Which would you prefer?