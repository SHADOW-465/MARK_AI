const dotenv = require('dotenv');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
  console.log('Keys in .env.local:');
  for (const k in envConfig) {
    console.log(k);
  }
} else {
  console.log('.env.local not found');
}
