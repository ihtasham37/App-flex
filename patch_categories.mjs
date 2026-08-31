import fs from 'fs';

const file = 'src/pages/admin/Categories.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /  useEffect\(\(\) => \{[\s\S]*?return \(\) => unsub\(\);\n  \}, \[\]\);/m;

const replacement = `  useEffect(() => {
    // 0 reads - using unified context snapshot
    setCategories(ctxCategories);
    setLoading(false);
  }, [ctxCategories]);`;

if (regex.test(content)) {
  fs.writeFileSync(file, content.replace(regex, replacement));
  console.log("SUCCESS VIA REGEX");
} else {
  console.log("FAILED to patch Categories.tsx");
}
