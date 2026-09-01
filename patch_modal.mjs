import fs from 'fs';
const file = 'src/components/admin/QuickSyncModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="grid grid-cols-2 gap-3">[\s\S]*?<\/div>/m;
content = content.replace(regex, "");
content = content.replace(
  `<span>{isSyncing ? 'Broadcasting & Building Snapshot...' : '1-Click Full System Broadcast (Catalog + Code)'}</span>`,
  `<span>{isSyncing ? 'Updating App...' : 'Publish & Update App Now (1-Click)'}</span>`
);

fs.writeFileSync(file, content);
console.log("SUCCESS");
