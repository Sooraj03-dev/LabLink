# LabLink

LabLink helps students discover equipment, development kits and workstations across campus laboratories. It includes a searchable sample catalogue, Firebase sign-in, role-specific workspaces and an assigned-request queue for faculty reviewers.

## Run locally

Use Node.js 22.15 or newer and pnpm 11.25.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). The catalogue lives at `/discover`. Filters are reflected in the URL, so searches can be bookmarked and shared.

## Key Interface Features

- **Laboratory Instrument Panel Aesthetic**: Precision 24px/120px graph-paper grid background, Fraunces serif display, Public Sans body, and JetBrains Mono monospace readouts.
- **Hero Lab Bench Interactivity (`/`)**: Interactive SVG oscilloscope with real-time waveform/amplitude knob controls, ESP32 prototyping kit hotspot with LED toggling and quick-spec popover, and reactive chemical beaker bubbles.
- **Living SVG Hardware Cards (`/discover`)**: Equipment cards with hardware-specific status LED pulses, sweep indicators, 1px registration marks, and subtle hover lifts.
- The catalogue shows a sample week of availability with hatched maintenance blocks and labels for screen readers. The pilot instrument page shows current booking availability.
- **Interactive Compare Tray**: Compare up to 3 instruments side-by-side with sticky drawer and full accessible specification comparison modal.
- **Workspace Readouts & Expandable Rows (`/workspace`)**: Count-up instrument readouts with filter capabilities, swinging specimen tags, and expandable request rows with inline specs and actions.
- The interface respects `prefers-reduced-motion`.

## Verify

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm build
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:assistant
pnpm test:performance
```

The performance check uses a locally installed Chrome or Chromium. Set `CHROME_PATH` to its executable if automatic detection is unavailable.

## Try the three demos

Open [the main login page](http://localhost:3000/login) and choose **Student**, **Faculty** or **Admin** under **Try the demo**. Requests and review decisions in these sample workspaces stay in this browser. For example, request a scope as a student, sign out, and open Faculty to review it. The Admin demo also has access to the sample review queue. Campus Google sign-in uses Firebase separately.

## Test Firebase sign-in locally

With Java 21 or newer on your PATH, stop the catalogue dev server and run `pnpm dev:demo`. This starts Firebase Authentication and Firestore on loopback, seeds three accounts and two review requests, and starts Next.js. Open the printed 127.0.0.1 URL and choose **My workspace**. Select **Faculty** to see the assigned requests, **Student** to request equipment, or **Admin** to open the admin workspace. **Continue with Google** opens Firebase's simulated account chooser. The demo runs without credentials and resets when the emulators stop.

On Windows, you can select Android Studio's bundled Java 21 runtime for the current PowerShell session before launching the demo.

```powershell
$env:Path = 'C:/Program Files/Android/Android Studio/jbr/bin;' + $env:Path
pnpm dev:demo
```

Run `pnpm build` and then `pnpm test:auth` to verify authentication and protected routes against a fresh emulator session. Stop any existing emulators first so the test can bind the same ports.

## Connect campus sign-in

Create a Firebase web app, enable Google under Authentication, authorize your app's hostname, and create a Firestore database. Configure the four Firebase web values from `.env.example` in `.env.local`, plus matching Admin SDK credentials or Application Default Credentials. Use HTTPS for the live app. Deploy the supplied Firestore rules and index to your chosen project before using the review queue. The server creates profiles after Google sign-in and uses verified role claims for access. New campus users receive student access by default.

Set `CAMPUS_EMAIL_DOMAIN` to limit sign-in to verified accounts on a campus domain. Behind a reverse proxy, set `LABLINK_APP_ORIGIN` to the external origin. Login limits use a shared bucket unless `TRUSTED_CLIENT_IP_HEADER` names a single-IP header that the ingress overwrites on every request.

For the live blocked-popup fallback, configure your deployment's Firebase auth helper domain so redirect sign-in works in browsers that restrict third-party storage. [Firebase redirect sign-in setup](https://firebase.google.com/docs/auth/web/redirect-best-practices)

The catalogue still uses eight sample resources. The review queue displays assigned requests. Campus request submissions use the `reviewerIds` array on the corresponding `resources/{resourceId}` document. With no assigned reviewer, the workspace saves the request as a draft. Faculty and admin accounts can approve or reject requests assigned to them.

## Equipment assistant

Open `/assistant` from the catalogue or choose **Plan equipment with AI** in a workspace. Search in everyday language, estimate equipment hours for a project, or compare an in-use instrument with available items of the same type in another department. Recommendations link to verified catalogue IDs. Students review and submit their own requests. Inventory counts describe the sample catalogue and carry no booking guarantee.

To enable the server-side Gemini provider, set `AI_ENABLED=true`, `GENAI_PROVIDER=gemini`, `GENAI_MODEL` and `GEMINI_API_KEY` in the server environment. Keep the key in the ignored local environment file or the deployment secret store. Set `GENAI_PROVIDER=mock` for deterministic previews. Disabled AI, quota exhaustion, provider errors and timeouts return labelled keyword matches.

The provider receives the entered description, optional deadline and public equipment data. When the pilot instrument is a candidate, Gemini also receives the next free half hour from its published calendar. Browser-demo bookings stay on the device. Live calls share a 100-call daily cap with a 20-call allowance per verified account and a shared 20-call allowance for visitors and browser demos. These counters use Firestore. Successful queries can be reused for ten minutes while their calendar input stays the same.

## Pilot instrument booking

The mixed-signal oscilloscope has a pilot schedule for a RIGOL MSO5204, unit `scope-01`, in the Circuits & Instrumentation Lab. The configured hours are Monday–Friday, 09:00–17:00 India Standard Time. The lab should confirm the physical unit and hours before using the pilot for campus access. [RIGOL model specifications](https://www.rigol.com/dam/global/downloads/brochures/en/user-manual/oscilloscope/MSO5000_UserGuide_EN.pdf)

Sign in as a student, request the mixed-signal oscilloscope and have an assigned faculty reviewer approve the request. In the student workspace, select **Book lab time** on the approved request. Choose a unit, day, time and duration, then confirm. The pilot offers 30-minute increments up to two hours per session across the next 14 calendar days. The workspace keeps the reservation and enforces the remaining approved hours. Overlapping sessions for the same unit compete for the same Firestore slot documents in one transaction. The resource page and equipment assistant read the next available half hour from this calendar.

Campus booking uses Firebase sessions. To initialise the schedule or assign an existing verified reviewer, run `pnpm seed:pilot YOUR_FIREBASE_PROJECT_ID [FACULTY_OR_ADMIN_UID]`. The command preserves existing hours and adds the supplied UID to the reviewer list after validating its account role. Requests without a configured reviewer remain drafts and can be sent for review after assignment. The browser demos use a separate local calendar. The emulator seed creates the same schedule and assigns the demo reviewers.

After a production build, run `pnpm test:booking` with Java 21 and a Playwright Chromium browser installed. When the project emulators are already running, run `node tests/integration/booking.mjs` to reuse them. This exercises genuine student sessions, faculty approvals, simultaneous reservations, and recovery after a conflict.
