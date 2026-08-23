const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function checkRLSPolicies() {
  // Let's test sign in with finance officer password if we know it or generate a custom token / check
  // Elisha Rubiani: finance@mtishbischolar.com
  console.log("=== CHECKING AUTH LOGIN FOR FINANCE OFFICER ===");
  const loginRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'finance@mtishbischolar.com',
      password: 'password123' // default/test password
    })
  });
  const loginData = await loginRes.json();
  if (loginData.access_token) {
    console.log("✓ Logged in as Finance Officer successfully!");
    const token = loginData.access_token;

    // Test profiles query with Finance Officer token
    const profRes = await fetch(`${url}/rest/v1/profiles?role=eq.student&select=id,first_name,last_name,email,phone,created_at`, {
      headers: {
        'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("Finance Officer Profiles query status:", profRes.status, await profRes.json());

    // Test payments query with Finance Officer token
    const payRes = await fetch(`${url}/rest/v1/payments?select=id,student_id,amount,currency,payment_method,transaction_ref,status,created_at`, {
      headers: {
        'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`
      }
    });
    console.log("Finance Officer Payments query status:", payRes.status, await payRes.json());
  } else {
    console.log("Password login result:", loginData);
  }
}

checkRLSPolicies();
