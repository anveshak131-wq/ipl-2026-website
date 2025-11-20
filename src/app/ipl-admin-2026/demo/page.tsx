"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Mark this page as dynamic to ensure client-side redirects work
// Note: Removed for static export compatibility

export default function AdminDemoLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "admin123" }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        // Store token in localStorage and redirect to dashboard
        localStorage.setItem("adminToken", data.token);
        router.push("/ipl-admin-2026/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error during demo login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try auto-login on mount for convenience
    performDemoLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ipl-dark to-black p-6">
      <div className="max-w-xl w-full text-center p-8 glass-effect rounded-xl">
        <h1 className="text-2xl font-bold text-white mb-4">Admin demo login</h1>
        <p className="text-gray-300 mb-6">This page will sign you in with demo credentials and redirect you to the admin dashboard.</p>

        {loading ? (
          <div className="text-gray-300">Signing in...</div>
        ) : (
          <>
            {error && <div className="text-red-400 mb-4">{error}</div>}
            <button
              onClick={performDemoLogin}
              className="ipl-button"
            >
              Sign in as demo admin
            </button>
            <div className="mt-4 text-sm text-gray-400">
              Demo credentials: <strong>admin / admin123</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
