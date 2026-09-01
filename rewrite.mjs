import fs from 'fs';
const file = 'src/pages/admin/Settings.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">[\s\S]*?<GlassCard className="p-6 sm:p-8 space-y-6">/m;
const replacement = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 font-medium">Configure AppFlix branding, 1-read optimization, and system alerts.</p>
        </div>
</div>
<div className="space-y-8 mt-8">
<GlassCard className="p-6 sm:p-8 space-y-6">`;

content = content.replace(regex, replacement);

fs.writeFileSync(file, content);
console.log("SUCCESS");
