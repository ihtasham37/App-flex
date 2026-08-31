import fs from 'fs';

const file = 'src/pages/admin/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch apps & cats in parallel
      const [appsSnap, catsSnap, usersSnap, dlSnap] = await Promise.all([
        getDocs(collection(db, 'apps')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'downloads'), orderBy('downloadedAt', 'desc'), limit(15)))
      ]);
      const appDocs = appsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const published = appDocs.filter((d: any) => !d.status || d.status === 'published').length;
      const banners = appDocs.filter((d: any) => d.isBanner === true).length;
      const sorted = [...appDocs].sort((a: any, b: any) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 5);
      setTopItems(sorted);
      const dlDocs = dlSnap.docs.map(d => ({ id: d.id, ...d.data() } as RecentDownload));
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayCount = dlDocs.filter(d => {
        if (!d.downloadedAt) return false;
        const date = d.downloadedAt.toDate ? d.downloadedAt.toDate() : new Date(d.downloadedAt);
        return date >= startOfToday;
      }).length;
      setRecentDownloads(dlDocs.slice(0, 6));
      setStats({
        totalApps: appsSnap.size,
        totalCategories: catsSnap.size,
        totalUsers: usersSnap.size,
        totalDownloads: dlDocs.length,
        todayDownloads: todayCount,
        publishedItems: published,
        bannerItems: banners
      });`;

const replacement = `  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 0 READS from Firestore for Apps and Categories! (Uses context/memory)
      const [usersCountSnap, dlCountSnap, dlSnap] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'downloads')),
        getDocs(query(collection(db, 'downloads'), orderBy('downloadedAt', 'desc'), limit(15)))
      ]);
      const published = apps.length;
      const banners = apps.filter((d: any) => d.isBanner === true).length;
      const sorted = [...apps].sort((a: any, b: any) => (Number(b.downloads) || 0) - (Number(a.downloads) || 0)).slice(0, 5);
      setTopItems(sorted);
      const dlDocs = dlSnap.docs.map(d => ({ id: d.id, ...d.data() } as RecentDownload));
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayCount = dlDocs.filter(d => {
        if (!d.downloadedAt) return false;
        const date = d.downloadedAt.toDate ? d.downloadedAt.toDate() : new Date(d.downloadedAt);
        return date >= startOfToday;
      }).length;
      setRecentDownloads(dlDocs.slice(0, 6));
      setStats({
        totalApps: apps.length,
        totalCategories: categories.length,
        totalUsers: usersCountSnap.data().count,
        totalDownloads: dlCountSnap.data().count,
        todayDownloads: todayCount,
        publishedItems: published,
        bannerItems: banners
      });`;

if (content.includes(target)) {
  fs.writeFileSync(file, content.replace(target, replacement));
  console.log("SUCCESS");
} else {
  console.log("NOT FOUND, let's try regex");
  const regex = /const loadDashboardData = async \(\) => \{[\s\S]*?bannerItems: banners\s*\}\);/m;
  if(regex.test(content)) {
    fs.writeFileSync(file, content.replace(regex, replacement));
    console.log("SUCCESS VIA REGEX");
  } else {
    console.log("FAILED VIA REGEX");
  }
}
