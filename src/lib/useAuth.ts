import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  goal: string | null;
  onboardingComplete: boolean;
  cohortId: number | null;
}

export function useAuth({
  redirectTo = "",
  redirectIfFound = false
}: {
  redirectTo?: string;
  redirectIfFound?: boolean;
} = {}) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      // Check if demo sandbox mode is active
      const isDemo = typeof window !== "undefined" && localStorage.getItem("calmpulse_demo") === "true";
      if (isDemo) {
        if (active) {
          setUser({
            id: "demo-user-123",
            name: "Dr. Hackathon Judge",
            email: "judge@hackathon.com",
            goal: "Reduce Anxiety & Regulate Sleep",
            onboardingComplete: true,
            cohortId: 42,
          });
          setAuthenticated(true);
          setLoading(false);

          // Redirect if user found and we want to redirect on found (e.g. landing or login pages)
          if (redirectIfFound && redirectTo) {
            router.push(redirectTo);
          }
        }
        return;
      }

      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && active) {
            setUser(data.user);
            setAuthenticated(true);

            // Redirect if user found and we want to redirect on found (e.g. login/register pages)
            if (redirectIfFound && redirectTo) {
              if (data.user.onboardingComplete) {
                router.push(redirectTo);
              } else {
                router.push(`/onboarding?cohortId=${data.user.cohortId || 42}`);
              }
            }
          } else if (active) {
            // Unauthenticated: Redirect if we require authentication (e.g. dashboard)
            if (!redirectIfFound && redirectTo) {
              router.push(redirectTo);
            }
          }
        } else if (active) {
          // Response not OK (unauthenticated or error)
          if (!redirectIfFound && redirectTo) {
            router.push(redirectTo);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        if (active && !redirectIfFound && redirectTo) {
          router.push(redirectTo);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    checkAuth();

    return () => {
      active = false;
    };
  }, [router, redirectTo, redirectIfFound]);

  const logout = async () => {
    // Clear demo flag if logging out
    if (typeof window !== "undefined") {
      localStorage.removeItem("calmpulse_demo");
    }
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        setAuthenticated(false);
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return { user, loading, authenticated, logout };
}
