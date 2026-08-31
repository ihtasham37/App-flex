import fs from 'fs';

const file = 'src/pages/admin/AddApp.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace getDocs for categories with context categories
const target = `  useEffect(() => {
    import('firebase/firestore').then(({ getDocs, collection }) => {
      getDocs(collection(db, 'categories')).then((snap) => {
        setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() as { name: string; mainType?: string } })));
      });
    });
  }, []);`;

const replacement = `  useEffect(() => {
    // 0 reads - using context categories
    setCategories(ctxCategories);
  }, [ctxCategories]);`;

content = content.replace(target, replacement);

// Also need to inject useApps
if (!content.includes('useApps')) {
  content = content.replace(
    `import { cn } from '../../lib/utils';`,
    `import { cn } from '../../lib/utils';\nimport { useApps } from '../../context/AppsContext';`
  );
  
  content = content.replace(
    `export default function AdminAddApp() {`,
    `export default function AdminAddApp() {\n  const { categories: ctxCategories } = useApps();`
  );
}

fs.writeFileSync(file, content);
console.log("SUCCESS");
