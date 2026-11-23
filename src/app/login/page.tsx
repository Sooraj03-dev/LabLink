import Link from "next/link";
import { redirect } from "next/navigation";
import { SignIn } from "@/components/features/sign-in";
import { clientConfig, demoEnabled } from "@/server/firebase";
import { currentUser } from "@/server/session";
import { roleSchema } from "@/lib/auth";
import { enterSample } from "./actions";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";
const descriptions = {
  student: "Explore equipment and request lab time.",
  faculty: "Review student project requests.",
  admin: "Explore the sample lab and its requests.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ resource?: string }>;
}) {
  const { resource } = await searchParams;
  if (await currentUser())
    redirect(
      "/workspace" +
        (resource ? "?resource=" + encodeURIComponent(resource) : ""),
    );
  const config = clientConfig();
  const emulator = demoEnabled();
  return (
    <div className="frame inner-page login-grid">
      <section className="login-intro">
        <p className="section-label">Campus access</p>
        <h1>Sign in to LabLink</h1>
        <p className="intro">
          Use your campus account to open your project workspace.
        </p>
        {config ? (
          <SignIn config={config} demo={emulator} resource={resource} />
        ) : (
          <p>
            Campus sign-in is awaiting configuration. You can explore the sample
            workspaces below.
          </p>
        )}
        <Link className="text-link" href="/discover">
          Browse the public catalogue
        </Link>
      </section>
      {!emulator && (
        <section className="demo-panel" aria-labelledby="demo-heading">
          <h2 id="demo-heading">Try the demo</h2>
          <p>Choose a role. Sample activity stays in this browser.</p>
          <form action={enterSample} className="role-list">
            {resource && (
              <input type="hidden" name="resource" value={resource} />
            )}
            {roleSchema.options.map((role) => (
              <button
                name="role"
                value={role}
                key={role}
                aria-label={role[0]?.toUpperCase() + role.slice(1)}
              >
                <strong>{role}</strong>
                <span>{descriptions[role]}</span>
              </button>
            ))}
          </form>
        </section>
      )}
    </div>
  );
}
