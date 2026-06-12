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
  'files',
  'general',
  'images',
  'layout',
  'links',
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
  [/^(mail|email|envelope|message|chat|phone|call|inbox|send|reply)/, 'communication'],
  [/^(file|folder|document|attachment|paperclip|copy|paste|clipboard)/, 'files'],
  [/^(app|window|gear|cog|preferences|sliders|tune|config|server|database)/, 'system'],
  [/^(grid|list|table|columns?|rows?|panel|layout)/, 'layout'],
  [/^(add|plus|minus|remove|delete|trash|edit|pencil|pen|save|download|upload|refresh|sync)/, 'actions'],
  [/^(user|person|avatar|profile|people|users|team|group)/, 'users'],
  [/^(calendar|date|time|clock|schedule|alarm|timer)/, 'time'],
  [/^(lock|unlock|key|shield|security|password|eye|visible|hidden)/, 'security'],
  [/^(cart|bag|payment|credit|money|dollar|price|tag)/, 'commerce'],
  [/^(search|filter|sort|zoom|find|magnif)/, 'search'],
  [/^(bell|notification|alert|warning|error|info|help|question)/, 'notifications'],
  [/^(check|close|x|cancel|done|success|tick)/, 'status'],
  [/^(link|external|share|export|import|connect|chain)/, 'links'],
  [/^(image|photo|picture|camera|gallery|thumbnail)/, 'images'],
  [/^(code|terminal|command|dev|brackets?|curly)/, 'development'],
  [/^(chart|graph|analytics|stats|bar|pie|line|trend)/, 'charts'],
  [/^(map|location|pin|marker|compass|globe|world|earth)/, 'location'],
  [/^(house|home|building|office|hospital|school|bank|factory|warehouse|apartment|hotel|church|castle|store|shop)/, 'buildings'],
  [/^(cloud|weather|sun|moon|rain|snow)/, 'weather'],
  [/^(wifi|bluetooth|signal|network|antenna)/, 'connectivity'],
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

