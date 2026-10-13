// Run locally after registration: node scripts/promote-admin.js user@example.com
// Only an operator with database access can grant the administrator role.
require('../app_server/models/db');
const mongoose = require('mongoose');
(async () => {
  const email = process.argv[2];
  if (!email || !/^[^@]+@[^@]+$/.test(email)) throw new Error('Provide a valid registered email');
  await mongoose.connection.asPromise();
  const result = await mongoose.model('User').updateOne({ email: email.toLowerCase() }, { $set: { role: 'admin' } });
  if (result.matchedCount !== 1) throw new Error('User not found');
  console.log('Administrator role granted to registered user.');
})().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
