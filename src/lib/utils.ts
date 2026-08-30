import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isStandalone = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://') ||
    localStorage.getItem('pwa_installed') === 'true'
  );
};

export function isBundleItem(item: any): boolean {
  if (!item) return false;
  if (item.itemType === 'bundle') return true;
  if (item.itemType === 'app' || item.itemType === 'game' || item.itemType === 'pc') return false;

  const cat = (item.categoryName || item.category || '').toLowerCase().trim();
  const name = (item.name || '').toLowerCase().trim();

  // Exclude common general apps with category "video" or "video editor"
  if (
    cat === 'video' ||
    cat === 'video player' ||
    cat === 'video editing' ||
    cat === 'video editor' ||
    cat === 'tools' ||
    cat === 'photo' ||
    cat === 'photography' ||
    cat === 'entertainment' ||
    cat === 'social' ||
    cat === 'music'
  ) {
    return false;
  }

  return (
    cat.includes('bundle') ||
    cat.includes('preset') ||
    cat.includes('lut') ||
    cat.includes('pack') ||
    cat.includes('template') ||
    cat.includes('overlay') ||
    cat.includes('sound fx') ||
    cat.includes('reels') ||
    name.includes('bundle') ||
    name.includes('preset') ||
    name.includes('lut') ||
    name.includes('pack') ||
    name.includes('reels')
  );
}

export function isPCItem(item: any): boolean {
  if (!item) return false;
  if (item.itemType === 'pc') return true;
  if (item.itemType === 'app' || item.itemType === 'bundle') return false;

  const cat = (item.categoryName || item.category || '').toLowerCase().trim();
  return (
    cat.includes('pc') || 
    cat.includes('windows') || 
    cat.includes('desktop') || 
    cat.includes('adobe') || 
    cat.includes('office') || 
    cat.includes('system') || 
    cat.includes('recovery') ||
    cat.includes('graphic & 3d')
  );
}

export function isAppItem(item: any): boolean {
  if (!item) return false;
  if (item.itemType === 'app') return true;
  if (item.itemType === 'bundle' || item.itemType === 'pc') return false;

  return !isBundleItem(item) && !isPCItem(item);
}

