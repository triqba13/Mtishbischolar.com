const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthInvestigation() {
  console.log("=== SUPABASE AUTH INVESTIGATION ===");
  console.log("Supabase URL:", supabaseUrl);

  // 1. Check existing users in auth.users for tariq133002@icloud.com
  try {
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.log("Admin listUsers error:", listError.message);
    } else {
      console.log(`Total registered auth users: ${users.users.length}`);
      const icloudUser = users.users.find(u => u.email && u.email.toLowerCase().includes('icloud'));
      const allEmails = users.users.map(u => ({
        email: u.email,
        confirmed_at: u.email_confirmed_at,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at
      }));
      console.log("Registered users list:", JSON.stringify(allEmails, null, 2));
    }
  } catch (e) {
    console.log("List users exception:", e.message);
  }

  // 2. Check if Supabase returns errors when calling signUp or resend with iCloud email
  console.log("\n=== TESTING RESEND / SIGNUP RESPONSE FOR ICLOUD ===");
  try {
    const { data: resendData, error: resendError } = await supabaseAnon.auth.resend({
      type: 'signup',
      email: 'tariq133002@icloud.com',
    });
    console.log("Resend to iCloud result:", {
      success: !resendError,
      errorMessage: resendError ? resendError.message : null,
      errorStatus: resendError ? resendError.status : null,
    });
  } catch (e) {
    console.log("Resend exception:", e.message);
  }
}

testAuthInvestigation();
