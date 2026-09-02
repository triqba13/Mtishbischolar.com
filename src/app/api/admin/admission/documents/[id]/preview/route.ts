import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: docId } = await context.params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Configuration missing" }, { status: 500 });
    }

    // 1. Authenticate user strictly from verified session
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
          console.warn("[DocPreview] Bearer auth error:", tokenErr);
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
      } catch {
        // Ignore cookie error
      }
    }

    const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 2. Fetch document record
    const { data: doc, error: docErr } = await adminClient
      .from("documents")
      .select("id, file_url, file_name, document_type, student_id")
      .eq("id", docId)
      .maybeSingle();

    if (docErr || !doc || !doc.file_url) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 3. If file_url is already a full remote HTTP URL
    if (doc.file_url.startsWith("http://") || doc.file_url.startsWith("https://")) {
      return NextResponse.redirect(doc.file_url);
    }

    // 4. Clean storage path
    let storagePath = doc.file_url.replace(/^student-documents\//, "").replace(/^\/+/, "");

    // Download binary from Supabase storage
    const { data: blob, error: downloadErr } = await adminClient.storage
      .from("student-documents")
      .download(storagePath);

    if (downloadErr || !blob) {
      console.error("[DocPreview] Storage download error:", downloadErr);
      
      // Fallback: Generate signed URL and redirect
      const { data: sData } = await adminClient.storage
        .from("student-documents")
        .createSignedUrl(storagePath, 3600);

      if (sData?.signedUrl) {
        const fullUrl = sData.signedUrl.startsWith("http")
          ? sData.signedUrl
          : `${supabaseUrl}/storage/v1${sData.signedUrl}`;
        return NextResponse.redirect(fullUrl);
      }

      return NextResponse.json({ error: "Unable to retrieve file from storage" }, { status: 404 });
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type
    let contentType = blob.type || "application/pdf";
    const lowerName = (doc.file_name || doc.file_url || "").toLowerCase();
    if (lowerName.endsWith(".pdf")) contentType = "application/pdf";
    else if (lowerName.endsWith(".png")) contentType = "image/png";
    else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (lowerName.endsWith(".webp")) contentType = "image/webp";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${doc.file_name || 'document.pdf'}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("[DocPreview] Uncaught error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
