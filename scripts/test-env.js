console.log('TEST: Script is running!');
console.log('Node version:', process.version);
console.log('CWD:', process.cwd());

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'Not found');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Not found');
