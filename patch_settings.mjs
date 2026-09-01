import fs from 'fs';
const file = 'src/pages/admin/Settings.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<Button[\s\S]*?onClick=\{handleFullSync\}[\s\S]*?<\/Button>/m;
content = content.replace(regex, "");
content = content.replace(/const handleFullSync = async \(\) => \{[\s\S]*?\};/m, "");

fs.writeFileSync(file, content);
console.log("SUCCESS");
