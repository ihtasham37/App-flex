import fs from 'fs';

const file = 'src/pages/admin/EditApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `const data = contextApp;`;
const replacement = `const data = contextApp as any;`;

if (content.includes(target)) {
  fs.writeFileSync(file, content.replace(target, replacement));
  console.log("SUCCESS");
} else {
  console.log("FAILED");
}
