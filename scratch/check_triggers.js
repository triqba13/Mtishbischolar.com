const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectTriggers() {
  console.log("=== INSPECTING DATABASE TRIGGERS & FUNCTIONS ===");
  // Check if there is an RPC or query we can run
  const { data: profiles, error } = await supabaseAdmin.from('profiles').select('*');
  console.log("Profiles count:", profiles ? profiles.length : 0);
  console.log("Profiles:", JSON.stringify(profiles, null, 2));
}

inspectTriggers();
