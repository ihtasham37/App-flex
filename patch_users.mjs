import fs from 'fs';

const file = 'src/pages/admin/Users.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /  useEffect\(\(\) => \{[\s\S]*?return \(\) => unsub\(\);\n  \}, \[\]\);/m;

const replacement = `  useEffect(() => {
    // Load max 100 users once to prevent massive read costs
    import('firebase/firestore').then(({ getDocs, limit, query, collection, orderBy }) => {
      const q = query(collection(db, 'users'), limit(100)); // optionally orderBy('createdAt', 'desc') if index exists
      getDocs(q).then((snap) => {
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }).catch((error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      });
    });
  }, []);`;

if (regex.test(content)) {
  fs.writeFileSync(file, content.replace(regex, replacement));
  console.log("SUCCESS");
} else {
  console.log("FAILED regex in Users.tsx");
}
