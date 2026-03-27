import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, supabaseConfigError } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    let isActive = true;

    const completeOAuth = async () => {
      try {
        if (!supabase) {
          throw new Error(supabaseConfigError);
        }

        // PKCE flow: extract the authorization code from the URL
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          // Exchange the code for a session (required for PKCE flow)
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }

          if (isActive) {
            navigate("/", { replace: true });
          }
          return;
        }

        // Fallback: for hash-based / implicit flows, poll for session
        const maxChecks = 8;
        const delayMs = 250;

        for (let i = 0; i < maxChecks; i += 1) {
          if (!isActive) {
            return;
          }

          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            throw error;
          }

          if (session && isActive) {
            navigate("/", { replace: true });
            return;
          }

          await new Promise((resolve) => {
            setTimeout(resolve, delayMs);
          });
        }

        throw new Error("No active session found after OAuth callback.");
      } catch (err) {
        if (!isActive) {
          return;
        }

        const messageText = err?.message || "OAuth sign in failed.";
        setMessage(messageText);
        navigate(`/login?error=${encodeURIComponent(messageText)}`, {
          replace: true,
        });
      }
    };

    completeOAuth();

    return () => {
      isActive = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
