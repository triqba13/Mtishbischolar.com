const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateRahmaAccount() {
  const targetEmail = "tariq_hamzaahmad@srmap.edu.in";
  console.log(`=== REPAIRING TEST ACCOUNT FOR: ${targetEmail} ===`);

  // 1. Find user in auth.users
  const { data: usersData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
  if (userError) {
    console.error("Error listing users:", userError);
    return;
  }

  const user = usersData.users.find(u => u.email && u.email.toLowerCase() === targetEmail.toLowerCase());
  if (!user) {
    console.error(`User with email ${targetEmail} not found in auth.users!`);
    return;
  }

  console.log(`Found Auth User: ID=${user.id}, Email=${user.email}`);

  // 2. Update auth.users metadata
  const { data: updatedAuthUser, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    {
      user_metadata: {
        ...user.user_metadata,
        first_name: "Rahma",
        last_name: "Hussein Juma",
        full_name: "Rahma Hussein Juma",
      },
    }
  );

  if (updateAuthError) {
    console.error("Error updating auth user metadata:", updateAuthError);
  } else {
    console.log("✓ Successfully updated auth.users metadata to Rahma Hussein Juma");
  }

  // 3. Update public.profiles row
  const { data: profile, error: profError } = await supabaseAdmin
    .from('profiles')
    .update({
      first_name: "Rahma",
      last_name: "Hussein Juma",
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .eq('email', targetEmail)
    .select();

  if (profError) {
    console.error("Error updating public.profiles:", profError);
  } else {
    console.log("✓ Successfully updated public.profiles row:", profile);
  }

  // 4. Verify updated record
  const { data: verifyProf } = await supabaseAdmin
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .eq('id', user.id)
    .single();

  console.log("\n=== VERIFIED UPDATED PROFILE ===");
  console.log(JSON.stringify(verifyProf, null, 2));
}

updateRahmaAccount();
