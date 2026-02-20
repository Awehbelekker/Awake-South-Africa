console.log('Test 1: Starting...');

try {
  console.log('Test 2: Requiring supabase-js...');
  const { createClient } = require('@supabase/supabase-js');
  console.log('Test 3: Supabase loaded successfully!');
  console.log('Test 4: createClient is:', typeof createClient);
} catch (error) {
  console.error('ERROR:', error.message);
}

console.log('Test 5: Script completed');
