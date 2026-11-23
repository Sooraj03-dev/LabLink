export function SignOutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button className="button button-outline" type="submit">
        Sign out
      </button>
    </form>
  );
}

export function AccountControls({ demo }: { demo: boolean }) {
  return (
    <div className="account-controls">
      {demo && (
        <p className="specimen-tag">
          Demo session · Sample data may be reset at any time.
        </p>
      )}
      <SignOutButton />
    </div>
  );
}
