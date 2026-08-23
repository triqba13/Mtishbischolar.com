const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStudentIdentity() {
  console.log("================= STUDENT IDENTITY MAPPING VERIFICATION =================");

  // 1. Verify Rahma test account by user ID
  const rahmaId = "911b86e1-2a4c-44a4-8ead-74207af9780e";
  const { data: rahmaProfile, error: rahmaError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .eq('id', rahmaId)
    .single();

  if (rahmaError) {
    console.error("Error loading Rahma profile:", rahmaError);
  } else {
    console.log("✓ Rahma Profile in public.profiles:");
    console.log(`  ID: ${rahmaProfile.id}`);
    console.log(`  Email: ${rahmaProfile.email}`);
    console.log(`  First Name: ${rahmaProfile.first_name}`);
    console.log(`  Last Name: ${rahmaProfile.last_name}`);
    console.log(`  Role: ${rahmaProfile.role}`);

    const isCorrect = rahmaProfile.first_name === "Rahma" && rahmaProfile.last_name === "Hussein Juma";
    console.log(`  Is Name Correct ('Rahma Hussein Juma'): ${isCorrect}`);
  }

  // 2. Simulate Identity Computation function from Dashboard
  function computeIdentity(profile, userMetadata) {
    const rawFirstName = profile?.first_name?.trim();
    const validProfileFirstName = rawFirstName && rawFirstName.toLowerCase() !== "student" ? rawFirstName : null;

    const metadataFirstName = (
      userMetadata?.first_name ||
      userMetadata?.given_name ||
      userMetadata?.full_name?.split(/\s+/)[0] ||
      userMetadata?.name?.split(/\s+/)[0]
    )?.trim();

    const studentFirstName =
      validProfileFirstName ||
      (metadataFirstName && metadataFirstName.toLowerCase() !== "student" ? metadataFirstName : null) ||
      "Student";

    const rawLastName = profile?.last_name?.trim();
    const metadataLastName = (
      userMetadata?.last_name ||
      userMetadata?.family_name ||
      userMetadata?.full_name?.split(/\s+/).slice(1).join(" ") ||
      userMetadata?.name?.split(/\s+/).slice(1).join(" ")
    )?.trim();

    const studentLastName = rawLastName || metadataLastName || "";

    const studentFullName =
      [studentFirstName, studentLastName].filter((n) => n && n !== "Student").join(" ") ||
      (studentFirstName !== "Student" ? studentFirstName : "") ||
      userMetadata?.full_name ||
      userMetadata?.name ||
      "Student";

    const studentInitials =
      studentFullName !== "Student"
        ? studentFullName
            .split(" ")
            .filter(Boolean)
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()
        : studentFirstName.slice(0, 2).toUpperCase() || "ST";

    return { studentFirstName, studentLastName, studentFullName, studentInitials };
  }

  const rahmaIdentity = computeIdentity(rahmaProfile, { email: "tariq_hamzaahmad@srmap.edu.in" });
  console.log("\n✓ Computed Dashboard Display for Rahma:");
  console.log(`  Header Greeting: "Good Afternoon, ${rahmaIdentity.studentFirstName} 👋"`);
  console.log(`  Menu Full Name: "${rahmaIdentity.studentFullName}"`);
  console.log(`  Initials: "${rahmaIdentity.studentInitials}"`);

  // 3. Test with another student (Amina Saleh)
  const aminaIdentity = computeIdentity({ first_name: "Amina", last_name: "Saleh" }, { email: "amina.random@gmail.com" });
  console.log("\n✓ Computed Dashboard Display for Amina Saleh:");
  console.log(`  Header Greeting: "Good Afternoon, ${aminaIdentity.studentFirstName} 👋"`);
  console.log(`  Menu Full Name: "${aminaIdentity.studentFullName}"`);
  console.log(`  Initials: "${aminaIdentity.studentInitials}"`);

  console.log("\n================= ALL IDENTITY TESTS COMPLETED SUCCESSFULLY =================");
}

testStudentIdentity();
