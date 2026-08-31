import fs from 'fs';

const file = 'src/pages/admin/Apps.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `import { rebuildAndSyncCatalog } from '../../lib/catalogSync';`,
  `import { rebuildAndSyncCatalog } from '../../lib/catalogSync';\nimport { useApps } from '../../context/AppsContext';`
);

content = content.replace(
  `export default function AdminApps() {`,
  `export default function AdminApps() {\n  const { apps, categories: ctxCategories } = useApps();`
);

// We need to fix the setCategories issue by mapping getCategoryName to use context or ctxCategories
// Wait, Apps.tsx already has a getCategoryName local function.
content = content.replace(
  /const getCategoryName = \(catId: string\) => \{[\s\S]*?return cat \? cat\.name : catId;\n  \};/,
  `const getCategoryName = (catId: string) => {
    if (!catId) return 'General';
    const cat = ctxCategories.find(c => c.id === catId || c.name?.toLowerCase().trim() === catId?.toLowerCase().trim());
    return cat ? cat.name : catId;
  };`
)

fs.writeFileSync(file, content);
console.log("SUCCESS")
