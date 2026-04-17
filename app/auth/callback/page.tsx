"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { isAdminEmail } from "@/lib/admin";

// Pagina di callback dopo Google OAuth e Magic Link.
// Admin → /admin | ha business → /dashboard | nessun business → /onboarding
export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/auth");
        return;
      }

      // Admin va direttamente al pannello admin
      if (isAdminEmail(data.user.email)) {
        router.replace("/admin");
        return;
      }

      const { data: biz } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      router.push(biz ? "/dashboard" : "/onboarding");
    });
  }, []);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0a0f0d", color: "#7a9b7e", fontFamily: "'DM Sans', sans-serif",
    }}>
      <p>Accesso in corso...</p>
    </div>
  );
}
