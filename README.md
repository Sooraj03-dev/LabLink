# LabLink

LabLink helps students discover equipment, development kits and workstations across campus laboratories. The first milestone includes a public landing page, a filterable sample catalogue, and resource detail pages with specifications, example lab locations and approval policies.

## Run locally

Use Node.js 22.15 or newer and pnpm 11.25.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). The catalogue lives at `/discover`. Filters are reflected in the URL, so searches can be bookmarked and shared.

## Verify

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
```

## Integrations

The current catalogue uses eight sample resources and needs no credentials. Firebase Authentication, Firestore, booking, approvals and Gemini integration are future milestones. For live Firebase, keep the Firebase web app configuration and server credentials in a local `.env.local` using `.env.example` as a reference. Use the Firebase Emulator Suite for local integration work. A Gemini key will be needed to send requests to the live model.
