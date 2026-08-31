import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing: SUPABASE URL or Service Key" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const studentId = formData.get("studentId") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Missing required field: file is required." },
        { status: 400 }
      );
    }

    // 1. Authenticate user strictly from Bearer token or session cookie
    let authenticatedUserId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token && supabaseAnonKey) {
        try {
          const clientWithToken = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const {
            data: { user },
          } = await clientWithToken.auth.getUser();
          if (user?.id) {
            authenticatedUserId = user.id;
          }
        } catch (tokenErr) {
          console.warn("[UploadAvatar] Bearer token auth error:", tokenErr);
        }
      }
    }

    if (!authenticatedUserId) {
      try {
        const serverClient = await createServerClient();
        const {
          data: { user },
        } = await serverClient.auth.getUser();
        if (user?.id) {
          authenticatedUserId = user.id;
        }
      } catch (cookieErr) {
        console.warn("[UploadAvatar] Server cookie auth error:", cookieErr);
      }
    }

    const targetUserId = authenticatedUserId || studentId;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Could not authenticate user session." },
        { status: 401 }
      );
    }

    // 2. Validate image format & size (up to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image size exceeds the 10MB maximum limit." },
        { status: 400 }
      );
    }

    const validMimes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    const isImageExt = file.name.match(/\.(png|jpe?g|webp|gif)$/i);
    if (!validMimes.includes(file.type) && !isImageExt) {
      return NextResponse.json(
        { success: false, error: "Invalid image format. Only JPG, PNG, WEBP, and GIF images are allowed." },
        { status: 400 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 3. Check for existing avatar to clean up old file from storage
    const { data: currentProfile } = await adminClient
      .from("profiles")
      .select("id, avatar_url")
      .eq("id", targetUserId)
      .maybeSingle();

    if (currentProfile?.avatar_url) {
      let oldPath = currentProfile.avatar_url;
      if (oldPath.startsWith("student-documents/")) {
        oldPath = oldPath.replace(/^student-documents\//, "");
      }
      try {
        await adminClient.storage.from("student-documents").remove([oldPath]);
      } catch (cleanupErr) {
        console.warn("[UploadAvatar] Cleanup of previous avatar warning:", cleanupErr);
      }
    }

    // 4. Upload new avatar image to student-documents bucket
    const fileExt = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const storageObjectKey = `${targetUserId}/avatar_${timestamp}.${fileExt}`;
    const storagePath = `student-documents/${storageObjectKey}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminClient.storage
      .from("student-documents")
      .upload(storageObjectKey, fileBuffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[UploadAvatar] Storage upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: `Avatar upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 5. Update user profile with new avatar path strictly for this student
    const { data: updatedProfile, error: updateError } = await adminClient
      .from("profiles")
      .update({
        avatar_url: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetUserId)
      .select()
      .single();

    if (updateError) {
      console.error("[UploadAvatar] Error updating profile avatar:", updateError);
      return NextResponse.json(
        { success: false, error: `Profile update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    // 6. Generate signed URL for instant frontend rendering
    let signedUrl = storagePath;
    const { data: signedData } = await adminClient.storage
      .from("student-documents")
      .createSignedUrl(storageObjectKey, 60 * 60 * 24 * 7); // 7 days

    if (signedData?.signedUrl) {
      signedUrl = signedData.signedUrl;
    }

    return NextResponse.json({
      success: true,
      avatarUrl: signedUrl,
      storagePath,
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error("[UploadAvatar] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration missing." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get("studentId");

    let authenticatedUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token && supabaseAnonKey) {
        try {
          const clientWithToken = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const {
            data: { user },
          } = await clientWithToken.auth.getUser();
          if (user?.id) {
            authenticatedUserId = user.id;
          }
        } catch (tokenErr) {
          console.warn("[DeleteAvatar] Bearer token auth error:", tokenErr);
        }
      }
    }

    if (!authenticatedUserId) {
      try {
        const serverClient = await createServerClient();
        const {
          data: { user },
        } = await serverClient.auth.getUser();
        if (user?.id) {
          authenticatedUserId = user.id;
        }
      } catch (cookieErr) {
        console.warn("[DeleteAvatar] Server cookie auth error:", cookieErr);
      }
    }

    const targetUserId = authenticatedUserId || studentIdParam;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Could not authenticate user." },
        { status: 401 }
      );
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: currentProfile } = await adminClient
      .from("profiles")
      .select("id, avatar_url")
      .eq("id", targetUserId)
      .maybeSingle();

    if (currentProfile?.avatar_url) {
      let oldPath = currentProfile.avatar_url;
      if (oldPath.startsWith("student-documents/")) {
        oldPath = oldPath.replace(/^student-documents\//, "");
      }
      try {
        await adminClient.storage.from("student-documents").remove([oldPath]);
      } catch (cleanupErr) {
        console.warn("[DeleteAvatar] Cleanup of avatar warning:", cleanupErr);
      }
    }

    await adminClient
      .from("profiles")
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq("id", targetUserId);

    return NextResponse.json({ success: true, message: "Avatar removed successfully." });
  } catch (err: any) {
    console.error("[DeleteAvatar] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to remove avatar." },
      { status: 500 }
    );
  }
}
