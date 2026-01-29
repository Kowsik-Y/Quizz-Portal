const bcrypt = require('bcryptjs');

const password = 'password123';

async function generateHash() {
  const hash = await bcrypt.hash(password, 10);
  console.log('\n==============================================');
  console.log('Bcrypt Hash for password: password123');
  console.log('==============================================');
  console.log(hash);
  console.log('==============================================\n');
  
  console.log('SQL Update Command:');
  console.log(`UPDATE users SET password = '${hash}';`);
  console.log('\n');
}

generateHash();
