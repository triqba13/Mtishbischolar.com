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

async function inspectRLS() {
  console.log("=== INSPECTING RLS ON PROFILES AND PAYMENTS ===");

  // 1. Get finance officer profile
  const profRes = await fetch(`${url}/rest/v1/profiles?role=eq.finance_officer&select=*`, {
    headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` }
  });
  const officers = await profRes.json();
  console.log("Finance officers:", officers);
  const officer = officers[0];

  // 2. Query profiles using anon key + auth impersonation / token if available, or inspect pg_policies
  // Let's test calling /rest/v1/rpc or query with anonKey vs serviceKey
  const anonProfiles = await fetch(`${url}/rest/v1/profiles?role=eq.student&select=id,first_name,last_name,email,phone,created_at`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
  });
  console.log("Anon query profiles status:", anonProfiles.status, await anonProfiles.json());

  // Let's inspect what policies exist in database if we have an rpc or if we query tables
  // Let's check payments query as well
  const anonPayments = await fetch(`${url}/rest/v1/payments?select=id,student_id,amount,currency,payment_method,transaction_ref,payment_type,status,created_at`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
  });
  console.log("Anon query payments status:", anonPayments.status, await anonPayments.json());
}

inspectRLS();
