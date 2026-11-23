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
```

## Try sign-in locally

With Java 21 or newer on your PATH, stop the catalogue dev server and run `pnpm dev:demo`. This starts Firebase Authentication and Firestore on loopback, seeds three accounts and two review requests, and starts Next.js. Open the printed 127.0.0.1 URL and choose **My workspace**. Select **Faculty** to see the assigned requests, **Student** to browse the catalogue, or **Admin** to open the admin workspace. **Continue with Google** opens Firebase's simulated account chooser. The demo runs without credentials and resets when the emulators stop.

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

The catalogue still uses eight sample resources. The review queue displays assigned requests. Booking, approval decisions and Gemini are future milestones.
