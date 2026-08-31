import fs from 'fs';

const file = 'src/pages/admin/EditApp.tsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `  useEffect(() => {
    // 1-time fetch for categories
    import('firebase/firestore').then(({ getDocs, collection }) => {
      getDocs(collection(db, 'categories')).then((snap) => {
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() as { name: string; mainType?: string } })));
      });
    });
  }, []);`;

const replacement1 = `  useEffect(() => {
    // 0 reads - using context categories
    setCategories(ctxCategories);
  }, [ctxCategories]);`;

content = content.replace(target1, replacement1);

const target2 = `  useEffect(() => {
    async function fetchData() {
      if (!appId) return;
      try {
        const appSnap = await getDoc(doc(db, 'apps', appId));
        if (appSnap.exists()) {
          const data = appSnap.data();`;

const replacement2 = `  useEffect(() => {
    async function fetchData() {
      if (!appId) return;
      try {
        // 0 reads - get from context instead of getDoc
        const contextApp = ctxApps.find(a => a.id === appId);
        
        if (contextApp) {
          const data = contextApp;`;

content = content.replace(target2, replacement2);

// Add useApps
if (!content.includes('useApps')) {
  content = content.replace(
    `import { cn } from '../../lib/utils';`,
    `import { cn } from '../../lib/utils';\nimport { useApps } from '../../context/AppsContext';`
  );
  content = content.replace(
    `export default function AdminEditApp() {`,
    `export default function AdminEditApp() {\n  const { apps: ctxApps, categories: ctxCategories } = useApps();`
  );
}

fs.writeFileSync(file, content);
console.log("SUCCESS");
