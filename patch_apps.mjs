import fs from 'fs';

const file = 'src/pages/admin/Apps.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /  useEffect\(\(\) => \{[\s\S]*?return \(\) => unsub\(\);\n  \}, \[\]\);/m;
const replacement = `  useEffect(() => {
    // 0 Reads! Uses unified context snapshot
    setItems(apps);
    // Categories are also provided by useApps context!
    // No getDocs or onSnapshot used here!
    setLoading(false);
  }, [apps]);`;

if (regex.test(content)) {
  fs.writeFileSync(file, content.replace(regex, replacement));
  console.log("SUCCESS");
} else {
  console.log("FAILED to find regex in Apps.tsx");
}
