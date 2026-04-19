# Decap CMS Setup

The Decap CMS admin app is available at `/admin/`.

Files added for the integration:

- `admin/index.html`
- `admin/config.yml`
- `images/uploads/`

## Current backend

The CMS is configured for Netlify's Git Gateway on:

- Branch: `main`

## What works now

- The Decap admin UI loads at `/admin/`
- The CMS is configured to edit:
  - `index.html`
  - `guides/how-to-start-a-business-with-ai.html`
  - all files inside `guides/`
- Uploaded media is set to go into `images/uploads/`

## One required next step

For production login, you still need to enable these in the Netlify dashboard:

1. Netlify Identity
2. Git Gateway

After that, the published CMS should be available at:

```text
https://www.startbusinessai.online/admin/
```

## Local editing option

The config already has `local_backend: true`.

That means you can also use the local proxy workflow during development with:

```bash
npx decap-server
```

Then open:

```text
http://localhost:8000/admin/
```

## Netlify dashboard checklist

In Netlify for this site:

1. Go to `Identity`
2. Click `Enable Identity`
3. Under registration preferences, choose the access model you want
4. Enable `Git Gateway`
5. Optionally invite your editing users

## Notes

- The CMS is currently set to edit raw HTML files through the code editor.
- This is the safest fit for the current site because the project is plain static HTML, not markdown-driven or template-driven.
- If you want, the next upgrade would be converting guides into markdown or JSON-driven content so the CMS fields become much friendlier than editing full HTML.
