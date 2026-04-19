# Decap CMS Setup

The Decap CMS admin app is available at `/admin/`.

Files added for the integration:

- `admin/index.html`
- `admin/config.yml`
- `images/uploads/`

## Current backend

The CMS is configured for the GitHub repository:

- Repo: `Nesrin1295/-StartbusinessAI.com`
- Branch: `main`

## What works now

- The Decap admin UI loads at `/admin/`
- The CMS is configured to edit:
  - `index.html`
  - `guides/how-to-start-a-business-with-ai.html`
  - all files inside `guides/`
- Uploaded media is set to go into `images/uploads/`

## One required next step

For production login, Decap CMS still needs GitHub authentication.

Because this project appears to be hosted as a static site, you will need one of these:

1. A GitHub OAuth proxy for Decap CMS
2. Netlify Identity plus `git-gateway` if you move hosting to Netlify

## Local editing option

The config already has `local_backend: true`.

That means you can also use the local proxy workflow during development with:

```bash
npx decap-server
```

Then open:

```text
http://localhost:8080/admin/
```

## Notes

- The CMS is currently set to edit raw HTML files through the code editor.
- This is the safest fit for the current site because the project is plain static HTML, not markdown-driven or template-driven.
- If you want, the next upgrade would be converting guides into markdown or JSON-driven content so the CMS fields become much friendlier than editing full HTML.
