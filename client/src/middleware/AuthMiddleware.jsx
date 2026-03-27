import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

function FullScreenMessage({ text }) {
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function AuthMiddleware({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(session));
      setIsLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(session));
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <FullScreenMessage text="Checking session..." />;
  }

  if (!isAuthenticated) {
    const redirectUrl = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    return (
      <Navigate
        to={`/login?redirect=${redirectUrl}&message=${encodeURIComponent("Please sign in to access this room.")}`}
        replace
      />
    );
  }

  return children;
}

export function GuestOnlyMiddleware({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(session));
      setIsLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(session));
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <FullScreenMessage text="Checking session..." />;
  }

  if (isAuthenticated) {
    const params = new URLSearchParams(window.location.search);
    const redirectUrl = params.get("redirect");

    if (redirectUrl === "create-room") {
      const newRoomId = Math.random().toString(36).substring(2, 8);
      return <Navigate to={`/room/${newRoomId}`} replace />;
    } else if (redirectUrl) {
      return <Navigate to={redirectUrl} replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}
