const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectStudentProfiles() {
  console.log("=== INSPECTING AUTH USERS ===");
  const { data: usersData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  if (userError) {
    console.error("Error listing users:", userError);
    return;
  }

  for (const u of usersData.users) {
    console.log(`\nUser ID: ${u.id}`);
    console.log(`Email: ${u.email}`);
    console.log(`Raw User Metadata:`, JSON.stringify(u.user_metadata));
  }

  console.log("\n=== INSPECTING PUBLIC.PROFILES ===");
  const { data: profiles, error: profError } = await supabaseAdmin
    .from('profiles')
    .select('*');

  if (profError) {
    console.error("Error fetching profiles:", profError);
    return;
  }

  for (const p of profiles) {
    console.log(`\nProfile ID: ${p.id}`);
    console.log(`Email: ${p.email}`);
    console.log(`First Name: ${p.first_name}`);
    console.log(`Last Name: ${p.last_name}`);
    console.log(`Role: ${p.role}`);
  }
}

inspectStudentProfiles();
