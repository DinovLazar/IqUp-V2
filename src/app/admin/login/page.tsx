import { LoginForm } from "./login-form";

// /admin/login (Phase 2.04). Public route (the ONE admin path reachable without a
// session — the middleware excludes it). Renders the client login state machine
// (password → TOTP enrol/challenge → aal2 → /admin). No chrome, no nav.
export default function AdminLoginPage() {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
}
