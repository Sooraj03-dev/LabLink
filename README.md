# LabLink

**Find campus equipment, request access, and turn an approval into a lab booking.**

LabLink is a campus lab resource-sharing app. Students can explore equipment and plan project lab time, while faculty and admins review requests assigned to them. The current app includes eight sample resources and one bookable oscilloscope pilot.

[Quick start](#quick-start) · [Try a booking](#try-a-booking) · [Configure Firebase and Gemini](#configure-firebase-and-gemini) · [Run the checks](#run-the-checks)

![LabLink catalogue illustration of a mixed-signal oscilloscope](public/instruments/mixed-signal-oscilloscope.svg)

## What you can do

| Feature                   | What it supports                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Catalogue**             | Search and filter eight sample instruments, kits, and workstations. Share filtered URLs and compare up to three sets of specifications side by side.                      |
| **Access requests**       | Submit a project request with the hours needed. Assigned faculty and admin reviewers can approve or reject it.                                                            |
| **Pilot booking**         | Choose a unit, date, start time, and duration from the next 14 days. Firestore transactions prevent overlapping reservations on the same unit and enforce approved hours. |
| **Equipment assistant**   | Find equipment in everyday language, estimate lab time for a project, or compare alternatives. Results can show the pilot instrument’s next open half hour.               |
| **Interactive lab bench** | Adjust the oscilloscope with drag or keyboard controls. The interface respects the system’s reduced-motion preference.                                                    |

## Quick start

Use Node.js **22.15 or newer** and **pnpm 11.25.0**.

```sh
git clone https://github.com/Sooraj03-dev/LabLink.git
cd LabLink
pnpm install --frozen-lockfile
pnpm dev
```

Open the [local app](http://localhost:3000). The catalogue and the three browser demos run without credentials.

## Try a booking

Use the same browser and local URL throughout so the demo roles share the same sample records.

1. Open [Try the demo](http://localhost:3000/login#demo-heading) and select **Faculty**.
2. Approve the preloaded request **Thursday scope crunch** in **Approvals**.
3. Choose **Sign out** in the top bar, then select **Student**.
4. In **My workspace**, select **Book lab time** on the approved request. Choose a date, duration, and start time, then confirm. The reservation appears on the request.

To repeat the flow, start as **Student** and submit a new request for the **Mixed-signal oscilloscope**. The **Admin** demo can also review assigned sample requests. Demo requests, approvals, and reservations stay in the browser.

For a Firebase-backed demo, run `pnpm dev:demo` with Java 21 or newer on your PATH. It starts local Auth and Firestore emulators, seeds the three roles and the pilot calendar, and launches Next.js. Stop the existing dev server first and open the loopback URL printed by the launcher. Emulator data resets when the emulators stop.

## Configure Firebase and Gemini

### Campus Firebase

1. Create a Firebase web app and a Firestore database. Enable Google sign-in and add the app’s hostname to Firebase Authentication’s authorised domains.
2. Copy [`.env.example`](.env.example) to `.env.local` and fill in the four `NEXT_PUBLIC_FIREBASE_*` values. Configure matching Firebase Admin credentials using the server-only variables in the template or Application Default Credentials.
3. Deploy the [Firestore rules](firestore.rules) and [indexes](firestore.indexes.json) to your project.

   ```sh
   pnpm exec firebase deploy --only firestore:rules,firestore:indexes --project YOUR_FIREBASE_PROJECT_ID
   ```

Serve the campus app over HTTPS. Set `CAMPUS_EMAIL_DOMAIN` to require verified accounts from a specific domain. If you deploy behind a reverse proxy, set `LABLINK_APP_ORIGIN` to the app’s public origin, such as `https://lablink.example.edu`.

### Pilot calendar and reviewer

The [pilot schedule](src/lib/booking/pilot.json) uses the **RIGOL MSO5204**, unit **scope-01**, in the Circuits & Instrumentation Lab. The sample hours are **Monday–Friday, 09:00–17:00 India Standard Time**, with 30-minute increments and a two-hour session limit. Confirm the unit and hours with the lab before using the calendar for physical access.

Use an existing, verified Google account with a Firebase `faculty` or `admin` role claim. Pass its Firebase UID to seed the pilot and assign the reviewer.

```sh
pnpm seed:pilot YOUR_FIREBASE_PROJECT_ID FACULTY_OR_ADMIN_UID
```

The seed preserves any existing schedule. New campus accounts start as students. A request without an assigned reviewer stays in draft and can be submitted with **Send for review** after the assignment.

### Gemini assistant

Open **Equipment assistant** from the catalogue. To enable Gemini, set `AI_ENABLED=true`, `GENAI_PROVIDER=gemini`, `GENAI_MODEL`, and `GEMINI_API_KEY` in the server environment. Keep the key and Firebase Admin credentials in `.env.local` or your deployment’s secret store.

Use `AI_ENABLED=true` and `GENAI_PROVIDER=mock` to exercise the assistant locally without an API key. When live AI is disabled or unavailable, the assistant shows labelled catalogue matches. Live requests send the entered description, optional deadline, and public equipment data to Gemini. Leave personal details out of descriptions.

## Run the checks

```sh
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:assistant
```

The browser suite covers the three demos, mobile sign-in and sign-out, catalogue comparison, keyboard controls, and reduced motion. The assistant check exercises validation and the catalogue fallback.

With Java 21 or newer, run `pnpm test:auth` and `pnpm test:booking` after the production build. Run them one at a time with the demo emulators stopped. The booking test verifies that two independently approved students competing for the same slot produce one reservation and one conflict.

Run `pnpm test:performance` for the homepage Lighthouse checks. Set `CHROME_PATH` if Lighthouse cannot find your local Chrome or Chromium installation.

## Project layout

- [`src/app`](src/app) contains the Next.js pages and API routes.
- [`src/lib`](src/lib) contains the sample catalogue, request schemas, and booking rules.
- [`src/server`](src/server) contains Firebase session, booking, and Gemini integrations.
- [`tests`](tests) contains the Vitest, Playwright, and Firebase emulator checks.

LabLink uses Next.js, React, TypeScript, Firebase Authentication, Firestore, and the Gemini API. It is released under the [MIT License](LICENSE).
