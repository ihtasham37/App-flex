import fs from 'fs';

const file = 'src/pages/admin/SavedApps.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `import { rebuildAndSyncCatalog } from '../../lib/catalogSync';`,
  `import { rebuildAndSyncCatalog } from '../../lib/catalogSync';\nimport { useApps } from '../../context/AppsContext';`
);

content = content.replace(
  `export default function AdminSavedApps() {`,
  `export default function AdminSavedApps() {\n  const { apps: ctxApps, categories: ctxCategories } = useApps();`
);

fs.writeFileSync(file, content);
console.log("SUCCESS")
