import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/student/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const meta = user.user_metadata || {};

      // 1. Extract First Name, Last Name, and Avatar from Google User Metadata
      const given = (meta.given_name || meta.first_name || "").trim();
      const family = (meta.family_name || meta.last_name || "").trim();
      const fullNameStr = (meta.full_name || meta.name || "").trim();

      let extractedFirstName = given;
      let extractedLastName = family;

      if (!extractedFirstName && fullNameStr) {
        const parts = fullNameStr.split(/\s+/);
        extractedFirstName = parts[0] || "";
        if (!extractedLastName && parts.length > 1) {
          extractedLastName = parts.slice(1).join(" ");
        }
      }

      if (!extractedFirstName && user.email) {
        const emailPrefix = user.email.split("@")[0] || "";
        if (emailPrefix) {
          extractedFirstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        }
      }

      const finalFirstName = extractedFirstName || "Student";
      const finalLastName = extractedLastName || "";
      const avatarUrl = meta.avatar_url || meta.picture || "";

      let userRole = "student";

      // 2. Synchronize profile in public.profiles without destroying existing profile data
      try {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, avatar_url, role")
          .eq("id", user.id)
          .maybeSingle();

        if (existingProfile) {
          userRole = existingProfile.role || "student";

          // Check if profile already has a custom name (not empty and not 'Student')
          const hasCustomFirstName =
            existingProfile.first_name &&
            existingProfile.first_name.trim() !== "" &&
            existingProfile.first_name.trim() !== "Student";

          const updatePayload: Record<string, any> = {
            email: user.email,
            updated_at: new Date().toISOString(),
          };

          // Only update first_name/last_name if no custom name exists or current is placeholder "Student"
          if (!hasCustomFirstName && finalFirstName !== "Student") {
            updatePayload.first_name = finalFirstName;
            if (finalLastName) {
              updatePayload.last_name = finalLastName;
            }
          }

          if (!existingProfile.avatar_url && avatarUrl) {
            updatePayload.avatar_url = avatarUrl;
          }

          await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("id", user.id);
        } else {
          // Insert new profile for first-time Google OAuth user
          await supabase.from("profiles").insert({
            id: user.id,
            email: user.email,
            first_name: finalFirstName,
            last_name: finalLastName,
            avatar_url: avatarUrl,
            role: "student",
            updated_at: new Date().toISOString(),
          });
        }
      } catch (profileErr) {
        console.error("Profile sync warning in OAuth callback:", profileErr);
      }

      if (userRole === "admission_officer") {
        return NextResponse.redirect(`${origin}/admin/admission/dashboard`);
      } else if (userRole === "finance_officer") {
        return NextResponse.redirect(`${origin}/admin/finance/dashboard`);
      } else if (userRole === "super_admin") {
        return NextResponse.redirect(`${origin}/admin/super/dashboard`);
      }

      return NextResponse.redirect(`${origin}${next}?welcome=true`);
    }
  }

  // Return the user to an error page if OAuth exchange fails
  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate with Google. Please try again.`);
}
