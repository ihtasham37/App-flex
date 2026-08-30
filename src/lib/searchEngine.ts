import { isBundleItem, isPCItem, isAppItem } from './utils';

export interface SearchableItem {
  id: string;
  name: string;
  category?: string;
  categoryName?: string;
  mainImage?: string;
  icon?: string;
  appNumber?: string | number;
  rating?: string | number;
  version?: string;
  size?: string;
  downloads?: string | number;
  shortDescription?: string;
  fullDescription?: string;
  developer?: string;
  itemType?: 'app' | 'bundle' | 'pc' | 'game';
  status?: string;
  downloadUrl?: string;
}

export interface SearchOptions {
  typeFilter?: 'all' | 'app' | 'pc' | 'bundle';
  categoryFilter?: string;
  limit?: number;
}

export interface SearchResult {
  item: SearchableItem;
  score: number;
  resolvedType: 'app' | 'pc' | 'bundle';
  resolvedCategory: string;
  matchHighlights: {
    field: 'name' | 'category' | 'appNumber' | 'description';
    matchedText: string;
  }[];
}

// Common aliases and synonyms to make search very forgiving and smart
const SYNONYMS: Record<string, string[]> = {
  'ps': ['photoshop', 'adobe photoshop'],
  'photoshop': ['ps', 'adobe photoshop', 'photo editing'],
  'pr': ['premiere', 'adobe premiere', 'video editing'],
  'premiere': ['pr', 'adobe premiere pro'],
  'ae': ['after effects', 'adobe after effects', 'vfx'],
  'after effects': ['ae', 'adobe after effects'],
  'lr': ['lightroom', 'adobe lightroom', 'presets'],
  'lightroom': ['lr', 'adobe lightroom', 'presets', 'luts'],
  'ai': ['illustrator', 'adobe illustrator', 'artificial intelligence'],
  'illustrator': ['ai', 'adobe illustrator'],
  'inpage': ['urdu inpage', 'inpage urdu', 'urdu typing', 'urdu'],
  'urdu': ['inpage', 'inpage urdu'],
  'office': ['wps office', 'ms office', 'word', 'excel', 'powerpoint'],
  'wps': ['wps office', 'office'],
  'typing': ['typing instructor', 'typing master', 'keyboard'],
  'screen recorder': ['hitpaw', 'bandicam', 'obs', 'recorder', 'recording'],
  'hitpaw': ['screen recorder', 'video recorder'],
  'topaz': ['topaz video ai', 'video enhancer', 'ai upscaler'],
  'reels': ['reel', 'reels bundle', 'viral reels', 'short video', 'pack'],
  'bundle': ['bundles', 'pack', 'collection', 'reels', 'presets'],
  'presets': ['preset', 'lightroom presets', 'luts', 'filters'],
  'cloner': ['apk cloner', 'shilter', 'clone app'],
  'video': ['video editing', 'video editor', 'player', 'reels'],
  'photo': ['photo editor', 'editing', 'photoshop', 'lightroom'],
  'bgmi': ['pubg', 'pubg reels', 'gaming'],
  'pubg': ['bgmi', 'pubg mobile', 'gaming reels'],
  'vpn': ['proxy', 'shield', 'secure vpn', 'unblock'],
  'pdf': ['reader', 'document', 'location']
};

/**
 * Normalizes text for comparison (lowercasing, trimming, removing noisy punctuation).
 */
export function normalizeText(text?: string | number | null): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves item type accurately
 */
export function resolveItemType(item: any): 'app' | 'pc' | 'bundle' {
  if (isBundleItem(item)) return 'bundle';
  if (isPCItem(item)) return 'pc';
  return 'app';
}

/**
 * Advanced Search Engine with tokenization, synonym expansion, and scoring
 */
export function searchItems(
  items: SearchableItem[],
  queryText: string,
  categoriesMap: Record<string, string> = {},
  options: SearchOptions = {}
): SearchResult[] {
  const rawQuery = (queryText || '').trim();
  const normalizedQuery = normalizeText(rawQuery);
  const { typeFilter = 'all', categoryFilter = 'All', limit = 100 } = options;

  if (!items || items.length === 0) return [];

  // If query is empty and filters are set or not
  if (!normalizedQuery) {
    let filtered = items.filter(item => !item.status || item.status === 'published');

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => resolveItemType(item) === typeFilter);
    }

    if (categoryFilter && categoryFilter !== 'All') {
      filtered = filtered.filter(item => {
        const catName = categoriesMap[item.category || ''] || item.category || '';
        return catName.toLowerCase() === categoryFilter.toLowerCase();
      });
    }

    return filtered.slice(0, limit).map(item => ({
      item,
      score: 1,
      resolvedType: resolveItemType(item),
      resolvedCategory: categoriesMap[item.category || ''] || item.category || 'General',
      matchHighlights: []
    }));
  }

  // Tokenize search query words
  const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
  
  // Expand synonyms
  const expandedTokens = new Set<string>(queryTokens);
  for (const token of queryTokens) {
    if (SYNONYMS[token]) {
      SYNONYMS[token].forEach(syn => syn.split(/\s+/).forEach(s => expandedTokens.add(s)));
    }
  }

  const results: SearchResult[] = [];

  for (const item of items) {
    if (item.status && item.status !== 'published') continue;

    const resolvedType = resolveItemType(item);

    // Apply Type Filter
    if (typeFilter !== 'all' && resolvedType !== typeFilter) {
      continue;
    }

    const resolvedCategory = categoriesMap[item.category || ''] || item.category || 'General';

    // Apply Category Filter
    if (categoryFilter && categoryFilter !== 'All') {
      if (resolvedCategory.toLowerCase() !== categoryFilter.toLowerCase()) {
        continue;
      }
    }

    const normName = normalizeText(item.name);
    const normCat = normalizeText(resolvedCategory);
    const normAppNum = normalizeText(item.appNumber);
    const normDesc = normalizeText(item.shortDescription || item.fullDescription || '');
    const normDev = normalizeText(item.developer);

    let score = 0;
    const matchHighlights: SearchResult['matchHighlights'] = [];

    // 1. App Number Direct Match (e.g., search "12" or "#12")
    const cleanAppNum = String(item.appNumber || '').replace(/[^0-9]/g, '');
    const queryNum = normalizedQuery.replace(/[^0-9]/g, '');
    if (cleanAppNum && queryNum && cleanAppNum === queryNum) {
      score += 150;
      matchHighlights.push({ field: 'appNumber', matchedText: `#${item.appNumber}` });
    }

    // 2. Exact Full Phrase Matches
    if (normName === normalizedQuery) {
      score += 200;
      matchHighlights.push({ field: 'name', matchedText: item.name });
    } else if (normName.startsWith(normalizedQuery)) {
      score += 120;
      matchHighlights.push({ field: 'name', matchedText: item.name });
    } else if (normName.includes(normalizedQuery)) {
      score += 90;
      matchHighlights.push({ field: 'name', matchedText: item.name });
    }

    // 3. Category Exact/Partial Matches
    if (normCat === normalizedQuery) {
      score += 70;
      matchHighlights.push({ field: 'category', matchedText: resolvedCategory });
    } else if (normCat.includes(normalizedQuery)) {
      score += 50;
      matchHighlights.push({ field: 'category', matchedText: resolvedCategory });
    }

    // 4. Token-by-Token scoring across all fields
    let tokensMatchedInName = 0;
    let allTokensPresent = true;

    for (const token of queryTokens) {
      let tokenMatched = false;

      // Name matches
      if (normName.includes(token)) {
        score += 35;
        tokenMatched = true;
        tokensMatchedInName++;
      }
      
      // Category matches
      if (normCat.includes(token)) {
        score += 20;
        tokenMatched = true;
      }

      // App Number matches
      if (normAppNum && normAppNum.includes(token)) {
        score += 25;
        tokenMatched = true;
      }

      // Developer matches
      if (normDev.includes(token)) {
        score += 15;
        tokenMatched = true;
      }

      // Description matches
      if (normDesc.includes(token)) {
        score += 10;
        tokenMatched = true;
      }

      if (!tokenMatched) {
        // Check expanded synonym tokens
        let synonymMatched = false;
        if (SYNONYMS[token]) {
          for (const syn of SYNONYMS[token]) {
            const normSyn = normalizeText(syn);
            if (normName.includes(normSyn) || normCat.includes(normSyn) || normDesc.includes(normSyn)) {
              score += 25;
              synonymMatched = true;
              break;
            }
          }
        }

        if (!synonymMatched) {
          allTokensPresent = false;
        }
      }
    }

    // Bonus for matching all search words in the name
    if (tokensMatchedInName === queryTokens.length) {
      score += 50;
    }

    // Bonus for having all query tokens present across item fields
    if (allTokensPresent && queryTokens.length > 1) {
      score += 40;
    }

    // Include item if score > 0
    if (score > 0) {
      // Slight rating boost
      const rating = parseFloat(String(item.rating || '4.5'));
      if (!isNaN(rating)) {
        score += rating * 2;
      }

      results.push({
        item,
        score,
        resolvedType,
        resolvedCategory,
        matchHighlights
      });
    }
  }

  // Sort descending by highest score
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit);
}

/**
 * Suggested popular keywords/tags for instant click-to-search
 */
export const POPULAR_SEARCH_TAGS = [
  { label: 'Adobe Photoshop', icon: '🎨', type: 'pc' },
  { label: 'CapCut Pro', icon: '🎬', type: 'app' },
  { label: 'Gym Reels Bundle', icon: '💪', type: 'bundle' },
  { label: 'InPage Urdu', icon: '✍️', type: 'pc' },
  { label: 'WPS Office PC', icon: '📄', type: 'pc' },
  { label: 'Topaz Video AI', icon: '🤖', type: 'pc' },
  { label: 'Lightroom Presets', icon: '✨', type: 'bundle' },
  { label: 'HitPaw Screen Recorder', icon: '📹', type: 'pc' },
  { label: 'AI Reels Bundle', icon: '⚡', type: 'bundle' },
  { label: 'Apk Cloner', icon: '📱', type: 'app' },
  { label: 'Typing Instructor', icon: '⌨️', type: 'pc' },
  { label: 'Art & Craft Reels', icon: '🎨', type: 'bundle' },
  { label: 'Motivational Reels', icon: '🔥', type: 'bundle' },
  { label: 'Adobe Illustrator', icon: '📐', type: 'pc' }
];
