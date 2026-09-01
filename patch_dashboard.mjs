import fs from 'fs';
const file = 'src/pages/admin/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /alert\([\s\S]*?1-Read Snapshot Built & Broadcasted! \$\{res\.count\}[\s\S]*?\);/;
content = content.replace(regex, 'alert("1-Read Snapshot Built & Broadcasted!");');

fs.writeFileSync(file, content);
console.log("SUCCESS");
