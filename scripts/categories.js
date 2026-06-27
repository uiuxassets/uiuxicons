/** Must match `category.enum` in icons.meta.schema.json */
export const META_CATEGORIES = [
  'actions',
  'arrows',
  'buildings',
  'charts',
  'commerce',
  'communication',
  'connectivity',
  'development',
  'education',
  'files',
  'general',
  'images',
  'layout',
  'location',
  'media',
  'navigation',
  'notifications',
  'power',
  'search',
  'security',
  'settings',
  'shapes',
  'status',
  'system',
  'text',
  'time',
  'users',
  'weather',
];

const META_CATEGORY_SET = new Set(META_CATEGORIES);

export function isValidMetaCategory(c) {
  return typeof c === 'string' && META_CATEGORY_SET.has(c);
}

// Category inference patterns - single source of truth
export const CATEGORY_PATTERNS = [
  [/^arrow/, 'arrows'],
  [/^(archive|backup|storage)/, 'files'],
  [/^chevron/, 'arrows'],
  [/^(circle|square|triangle|rectangle|polygon|hexagon|octagon|star|heart)/, 'shapes'],
  [/^(menu|back|forward|sidebar|navbar|tabs?(-|$))/, 'navigation'],
  [/^(play|pause|stop|skip|rewind|forward|volume|mute|music|video|audio|media)/, 'media'],
  [/^(mail|email|envelope|message|chat|phone|call|inbox|send|reply|share|export|import)/, 'communication'],
  [/^(file|folder|document|attachment|paperclip)/, 'files'],
  [/^(book($|-)|graduation|library|notebook|journal|education|course|lesson|diploma|certificate)/, 'education'],
  [/^(app|window|gear|cog|preferences|sliders|tune|config|server|database)/, 'system'],
  [/^(grid|list|table|columns?|rows?|panel|layout)/, 'layout'],
  [/^(add|plus|minus|remove|delete|trash|edit|pencil|pen|save|download|upload|refresh|sync|copy|cut|paste|clipboard|duplicate|clone|bookmark)/, 'actions'],
  [/^(user|person|avatar|profile|people|users|team|group)/, 'users'],
  [/^(calendar|date|time|clock|schedule|alarm|timer)/, 'time'],
  [/^(lock|unlock|key|shield|security|password|eye|visible|hidden)/, 'security'],
  [/^(cart|bag|payment|credit|money|dollar|price|tag)/, 'commerce'],
  [/^(search|filter|sort|zoom|find|magnif)/, 'search'],
  [/^(bell|notification|alert|warning|error|info|help|question)/, 'notifications'],
  [/^(check|close|x|cancel|done|success|tick)/, 'status'],
  [/^(image|photo|picture|camera|gallery|thumbnail)/, 'images'],
  [/^(code|terminal|command|dev|brackets?|curly)/, 'development'],
  [/^(chart|graph|analytics|stats|bar|pie|line|trend)/, 'charts'],
  [/^(map|location|pin|marker|compass|globe|world|earth)/, 'location'],
  [/^(house|home|building|office|hospital|school|bank|factory|warehouse|apartment|hotel|church|castle|store|shop)/, 'buildings'],
  [/^(cloud|weather|sun|moon|rain|snow)/, 'weather'],
  [/^(wifi|bluetooth|signal|network|antenna|link|external|connect|chain)/, 'connectivity'],
  [/^(battery|power|bolt|lightning|energy|electric)/, 'power'],
  [/^(text|font|type|bold|italic|underline|align|paragraph)/, 'text'],
];

export function inferCategory(name) {
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(name)) return category;
  }
  return 'general';
}

export function generateTags(name) {
  return name.split('-').filter(p => !/^\d+$/.test(p));
}

// Synonyms keyed by a token that appears in the icon name (split on "-").
// Used to enrich search tags so icons surface for related terms.
export const TOKEN_SYNONYMS = {
  align: ['alignment'],
  bottom: ['down'],
  top: ['up'],
  center: ['middle'],
  angle: ['degree', 'geometry', 'corner', 'math'],
  app: ['application'],
  book: ['reading', 'read', 'literature', 'education', 'library', 'manual'],
  bookmark: ['save', 'favorite', 'ribbon', 'tag', 'saved'],
  window: ['browser', 'screen', 'app'],
  archive: ['box', 'storage', 'backup', 'save'],
  arrow: ['direction', 'navigate'],
  circle: ['round', 'ring'],
  square: ['box', 'rectangle'],
  triangle: ['shape'],
  down: ['downward'],
  up: ['upward'],
  calendar: ['date', 'schedule', 'event', 'month', 'day'],
  blank: ['empty'],
  check: ['tick', 'done', 'complete', 'success', 'ok', 'yes'],
  minus: ['remove', 'subtract', 'delete', 'less'],
  plus: ['add', 'new', 'create', 'more'],
  x: ['close', 'cancel', 'remove', 'delete', 'clear', 'no'],
  chevron: ['arrow', 'expand', 'collapse', 'caret'],
  dashed: ['dotted', 'outline', 'dash'],
  clock: ['time', 'watch', 'schedule'],
  am: ['morning', 'time'],
  pm: ['afternoon', 'evening', 'time'],
  ccw: ['counterclockwise', 'rotate', 'undo', 'anticlockwise'],
  cw: ['clockwise', 'rotate', 'redo'],
  ellipsis: ['more', 'dots', 'menu', 'options', 'overflow'],
  envelope: ['mail', 'email', 'message', 'letter', 'contact'],
  open: ['opened'],
  file: ['document', 'page', 'paper'],
  filter: ['funnel', 'sort', 'refine'],
  gear: ['settings', 'preferences', 'options', 'config', 'cog', 'setup'],
  graduation: ['education', 'school', 'learn', 'student', 'university', 'degree'],
  cap: ['hat'],
  house: ['home', 'building', 'residence'],
  inbox: ['mail', 'messages', 'tray', 'email'],
  list: ['menu', 'items', 'lines', 'bullets'],
  menu: ['hamburger', 'navigation', 'bars', 'list'],
  moon: ['night', 'dark', 'sleep', 'lunar'],
  search: ['find', 'magnify', 'magnifier', 'zoom', 'lookup', 'glass'],
  server: ['database', 'hosting', 'data', 'rack', 'storage'],
  stack: ['layers', 'group', 'pile'],
  sliders: ['settings', 'controls', 'adjust', 'options', 'equalizer', 'tune'],
  sun: ['day', 'light', 'weather', 'bright', 'sunny'],
  dim: ['brightness', 'low'],
  horizon: ['dawn', 'dusk'],
  sunrise: ['dawn', 'morning', 'sun'],
  sunset: ['dusk', 'evening', 'sun'],
  table: ['grid', 'data', 'spreadsheet', 'rows', 'columns'],
  target: ['goal', 'aim', 'bullseye', 'focus', 'objective'],
  text: ['type', 'font', 'typography', 'content'],
  justify: ['alignment'],
  select: ['selection', 'highlight', 'cursor'],
  trash: ['delete', 'remove', 'bin', 'garbage', 'discard'],
  ui: ['interface', 'design'],
  ux: ['experience', 'design'],
  reload: ['refresh', 'sync', 'repeat', 'rotate', 'update'],
  reset: ['refresh', 'undo', 'restore', 'revert'],
  copy: ['duplicate', 'clone'],
  paste: ['insert'],
  clipboard: ['board'],
  share: ['export', 'upload', 'send', 'social'],
};

// Extras keyed by full icon name, for meanings the tokens alone cannot capture.
export const NAME_EXTRAS = {
  'file-arrow-down': ['download', 'save'],
  'file-arrow-up': ['upload'],
  'inbox-arrow-down': ['receive', 'download'],
  'inbox-arrow-up': ['send', 'upload'],
  'clock-z': ['snooze', 'sleep', 'timezone'],
  'clock-cw': ['redo'],
  'clock-ccw': ['undo'],
  'sun-moon': ['theme', 'dark-mode', 'day', 'night'],
  'ui-ux': ['design', 'product'],
  'text-initial': ['letter', 'first', 'capital'],
  'app-window': ['application', 'browser', 'screen'],
};

/**
 * Enriched tags for an icon: the base kebab split first, then token synonyms,
 * then name-specific extras. Lowercased and de-duplicated with stable order.
 */
export function enrichTags(name) {
  const base = generateTags(name);
  const extra = [];
  for (const tok of name.split('-')) {
    if (TOKEN_SYNONYMS[tok]) extra.push(...TOKEN_SYNONYMS[tok]);
  }
  if (NAME_EXTRAS[name]) extra.push(...NAME_EXTRAS[name]);
  const seen = new Set();
  return [...base, ...extra]
    .map(t => t.toLowerCase().trim())
    .filter(t => t && !seen.has(t) && seen.add(t));
}

