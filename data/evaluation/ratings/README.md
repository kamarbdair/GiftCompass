# Rater exports

Each rater pastes their CSV from the rating station into their own file here:
`r1.csv`, `r2.csv`, `r3.csv`.

Then, from the repo root:

```bash
node scripts/merge-ratings.ts   # fills rating-sheet.csv
npm run score                   # produces the evaluation table
```

The merge only writes cells a rater actually filled in. Anything missing or
malformed is reported and left blank — no value is inferred or averaged in.
