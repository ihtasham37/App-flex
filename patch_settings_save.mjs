import fs from 'fs';
const file = 'src/pages/admin/Settings.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `        </GlassCard>
      </div>
    </div>
  );
}`;

const replacement = `        </GlassCard>
        <div className="flex justify-end mt-8">
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center gap-2">
            <Save size={18} className={isSaving ? 'animate-spin' : ''} />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log("SUCCESS");
