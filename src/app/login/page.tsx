import Link from "next/link";
import { redirect } from "next/navigation";
import { SignIn } from "@/components/features/sign-in";
import { clientConfig, demoEnabled } from "@/server/firebase";
import { currentUser } from "@/server/session";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentUser()) redirect("/workspace");
  const config = clientConfig();
  return (
    <div className="frame inner-page">
      <div className="page-heading">
        <h1>Sign in to LabLink</h1>
      </div>
      {config ? (
        <SignIn config={config} demo={demoEnabled()} />
      ) : (
        <div className="auth-actions">
          <p>
            Campus sign-in has not been connected. The sample catalogue is open
            to everyone.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p>
              For local demo accounts, start the app with{" "}
              <code>pnpm dev:demo</code>.
            </p>
          )}
          <Link href="/discover" className="button button-primary">
            Explore the catalogue
          </Link>
        </div>
      )}
    </div>
  );
}
