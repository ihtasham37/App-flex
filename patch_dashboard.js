const fs = require('fs');
const file = 'src/pages/admin/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace getDocs and queries with getCountFromServer if possible, but actually we can just use useApps() context!
content = content.replace(
  `import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';`,
  `import { collection, getDocs, query, orderBy, limit, getCountFromServer } from 'firebase/firestore';`
);

content = content.replace(
  /const loadDashboardData = async \(\) => \{[\s\S]*?setLoading\(false\);\n    \}\n  \};/,
  `const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 0 READS from Firestore for Apps and Categories! (Uses context/memory)
      const appDocs = refreshApps ? useAppsContext.apps : []; // wait, we need to pass it
      // Let's restructure
`
)
fs.writeFileSync('test.js', content);
