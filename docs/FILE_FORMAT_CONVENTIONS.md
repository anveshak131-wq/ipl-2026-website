# File Format Conventions

Use one canonical format per purpose:

- App source: TypeScript in `src/**/*.ts` and `src/**/*.tsx`.
- Local automation: ES modules with `.mjs`.
- Tool config: the format the tool loads most reliably in this repo.
  - Next: `next.config.mjs`
  - Tailwind: `tailwind.config.js`
  - PostCSS: `postcss.config.js`
  - Wrangler: `wrangler.toml`
- Static structured data: `.json`.
- Bulk import/export data: `.csv`.

Exceptions:

- Cloudflare Pages Functions keep the file layout required by Cloudflare routing under `functions/`.
- Browser-console helpers that import TypeScript app modules may remain `.ts` until they are made standalone.

Avoid keeping duplicate config files for the same tool, such as `*.js` and `*.ts` versions side by side.

Run `npm run check:file-formats` before committing convention changes.
