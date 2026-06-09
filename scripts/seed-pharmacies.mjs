/**
 * Seed one verified pharmacy per Egyptian governorate
 * Usage: node scripts/seed-pharmacies.mjs
 */

const BASE = 'https://pharmcy.site/api';

const GOVERNORATES = [
  'Alexandria','Aswan','Assiut','Beheira','Beni Suef',
  'Cairo','Dakahlia','Damietta','Fayoum','Gharbia',
  'Giza','Ismailia','Kafr el-Sheikh','Luxor','Matrouh',
  'Menofia','Minya','New Valley','North Sinai','Port Said',
  'Qaliubiya','Qena','Red Sea','Sharqia','Sohag',
  'South Sinai','Suez',
];

// Approximate center coordinates for each governorate [lng, lat]
const COORDS = {
  'Alexandria':   [29.9187, 31.2001],
  'Aswan':        [32.8998, 24.0889],
  'Assiut':       [31.1837, 27.1809],
  'Beheira':      [30.3490, 30.8480],
  'Beni Suef':    [31.0980, 29.0661],
  'Cairo':        [31.2357, 30.0444],
  'Dakahlia':     [31.3667, 31.0333],
  'Damietta':     [31.8133, 31.4165],
  'Fayoum':       [30.8418, 29.3084],
  'Gharbia':      [31.0338, 30.8753],
  'Giza':         [31.2089, 30.0131],
  'Ismailia':     [32.2674, 30.5965],
  'Kafr el-Sheikh':[30.9388, 31.1107],
  'Luxor':        [32.6396, 25.6872],
  'Matrouh':      [27.2390, 31.3543],
  'Menofia':      [30.9876, 30.5965],
  'Minya':        [30.7503, 28.1099],
  'New Valley':   [28.1821, 25.4437],
  'North Sinai':  [33.7984, 30.2843],
  'Port Said':    [32.2654, 31.2565],
  'Qaliubiya':    [31.2086, 30.3292],
  'Qena':         [32.7160, 26.1551],
  'Red Sea':      [34.1531, 27.2579],
  'Sharqia':      [31.6608, 30.7226],
  'Sohag':        [31.6948, 26.5591],
  'South Sinai':  [33.6270, 28.5370],
  'Suez':         [32.5498, 29.9668],
};

const PASSWORD = 'Pharma@2026';

function slug(gov) {
  return gov.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
}

async function post(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
}

async function put(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, json };
}

// ── 1. Get admin token ──────────────────────────────────────
process.stdout.write('Logging in as admin... ');
const loginRes = await post('/auth/login', {
  email: 'admin@pharmalink.com',
  password: 'admin123456',
});

if (loginRes.status !== 200) {
  console.error('FAILED:', loginRes.json);
  process.exit(1);
}
const adminToken = loginRes.json.data.accessToken;
console.log('✓');

// ── 2. Register + verify each pharmacy ─────────────────────
const results = [];

for (const gov of GOVERNORATES) {
  const email    = `pharmacy.${slug(gov)}@pharmalink.com`;
  const [lng, lat] = COORDS[gov];

  process.stdout.write(`  Registering ${gov.padEnd(18)}... `);

  const regRes = await post('/auth/register', {
    name:         `${gov} Pharmacy`,
    email,
    password:     PASSWORD,
    role:         'pharmacy',
    pharmacyName: `${gov} Central Pharmacy`,
    address:      `${gov} City Center`,
    governorate:  gov,
    location:     { lat, lng },
    workingHours: { open: '09:00', close: '22:00' },
  });

  if (regRes.status !== 201) {
    const msg = regRes.json?.error?.message || JSON.stringify(regRes.json);
    console.log(`⚠ SKIP (${msg})`);
    results.push({ gov, email, password: PASSWORD, status: `skipped: ${msg}` });
    continue;
  }

  // Get pharmacy id from the user's pharmacy profile
  const userId = regRes.json.data.user._id;

  // Find pharmacy record via admin list
  const listRes = await fetch(
    `${BASE}/admin/pharmacies?limit=100`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  const listJson = await listRes.json();
  const pharmacy = listJson.data?.find(
    (p) => p.userId?._id === userId || p.userId === userId
  );

  if (!pharmacy) {
    console.log('⚠ registered but pharmacy record not found for auto-verify');
    results.push({ gov, email, password: PASSWORD, status: 'registered, manual verify needed' });
    continue;
  }

  // Verify pharmacy
  const verRes = await put(
    `/admin/pharmacies/${pharmacy._id}/verify`,
    { action: 'approve' },
    adminToken
  );

  if (verRes.status === 200) {
    console.log('✓ verified');
    results.push({ gov, email, password: PASSWORD, status: '✅ active' });
  } else {
    console.log(`⚠ registered but verify failed: ${verRes.json?.error?.message}`);
    results.push({ gov, email, password: PASSWORD, status: 'registered, verify failed' });
  }
}

// ── 3. Print results table ──────────────────────────────────
console.log('\n');
console.log('═'.repeat(80));
console.log(' PHARMACY ACCOUNTS — ALL GOVERNORATES');
console.log('═'.repeat(80));
console.log(
  ' #  │ Governorate        │ Email                                │ Password      │ Status'
);
console.log('────┼────────────────────┼──────────────────────────────────────┼───────────────┼──────────');
results.forEach((r, i) => {
  const num  = String(i + 1).padStart(2);
  const gov  = r.gov.padEnd(18);
  const mail = r.email.padEnd(36);
  const pass = r.password.padEnd(13);
  console.log(` ${num} │ ${gov} │ ${mail} │ ${pass} │ ${r.status}`);
});
console.log('═'.repeat(80));
console.log(`\n Total: ${results.length} pharmacies`);
console.log(` Password for all: ${PASSWORD}`);
console.log('');
