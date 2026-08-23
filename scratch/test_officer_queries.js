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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testOfficerQueries() {
  console.log("=== TESTING QUERIES WITH CORRECT COLUMNS ===");

  // 1. Query profiles with serviceKey vs anonKey
  const profQuery = `${url}/rest/v1/profiles?role=eq.student&select=id,first_name,last_name,email,phone,created_at`;
  const profRes = await fetch(profQuery, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
  });
  console.log("Profiles query status (serviceKey):", profRes.status, await profRes.json());

  // 2. Query payments WITHOUT non-existent payment_type column
  const payQuery = `${url}/rest/v1/payments?select=id,student_id,amount,currency,payment_method,transaction_ref,status,created_at`;
  const payRes = await fetch(payQuery, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
  });
  console.log("Payments query status (serviceKey):", payRes.status, await payRes.json());
}

testOfficerQueries();
