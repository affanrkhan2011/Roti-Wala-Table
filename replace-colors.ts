import fs from 'fs';

const files = ['src/pages/CustomerApp.tsx', 'src/pages/StaffDashboard.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/deep-green/g, 'brown-dark');
  content = content.replace(/saffron/g, 'brown-light');
  fs.writeFileSync(file, content);
}
console.log('Replaced colors');
