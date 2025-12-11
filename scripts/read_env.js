const fs = require('fs');
const path = require('path');

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
      if (line.trim().startsWith('SUPABASE_SERVICE_ROLE_KEY') || line.trim().startsWith('DATABASE_URL') || line.trim().startsWith('NEXT_PUBLIC_SUPABASE_URL')) {
        console.log(line.trim());
      }
    });
  } else {
    console.log('.env.local not found at ' + envPath);
  }
} catch (e) {
  console.error(e);
}
