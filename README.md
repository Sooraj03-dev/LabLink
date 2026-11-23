# LabLink

LabLink helps students discover equipment, development kits and workstations across campus laboratories. It includes a searchable sample catalogue, Firebase sign-in, role-specific workspaces and an assigned-request queue for faculty reviewers.

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

The provider receives the entered description, optional deadline and public equipment data. Only structured equipment selections pass through to the UI. Live calls share a 100-call daily cap with a 20-call allowance per verified account and a shared 20-call allowance for visitors and browser demos. These counters use Firestore. Identical successful queries are cached in process for ten minutes.
