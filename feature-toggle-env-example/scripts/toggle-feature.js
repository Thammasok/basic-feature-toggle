const fs = require('fs');
const path = require('path');

// Script to toggle features via command line
// Usage: node scripts/toggle-feature.js ENABLE_NEW_DASHBOARD true

const [, , envVar, value] = process.argv;

if (!envVar || !value) {
  console.log('Usage: node scripts/toggle-feature.js <ENV_VAR> <true|false>');
  process.exit(1);
}

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const updatedContent = envContent.replace(
  new RegExp(`^${envVar}=.*$`, 'm'),
  `${envVar}=${value}`
);

fs.writeFileSync(envPath, updatedContent);
console.log(`✅ Updated ${envVar} = ${value}`);