export const normalize = text => text.replace(/\s+/gu, ' ').trim();
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const literal = text => escape(text).replace(/\s+/gu, '\\s+');
const slotPattern = /\{([a-zA-Z][a-zA-Z0-9_]*)\}/g;
// Capture display values verbatim. No number parsing or locale reformatting.
const number = '[+−-]?\\d+(?:[.,\\u00a0\\u202f]\\d+)*(?:[eE][+−-]?\\d+|[a-zA-Z]{1,3})?';

function compile(entry, values) {
  const names = [...entry.en.matchAll(slotPattern)].map(m => m[1]);
  const outputNames = [...entry.zh.matchAll(slotPattern)].map(m => m[1]);
  if (!names.length || [...new Set(names)].sort().join() !== [...new Set(outputNames)].sort().join() ||
      names.some(n => !entry.slots?.[n])) throw new Error(`Invalid template slots: ${entry.id}`);
  function typePattern(type) {
    if (type === 'integer') return '\\d+';
    if (type === 'number') return number;
    if (type === 'money') return `(?:[$€£¥₩₹]\\s?${number}|${number}\\s?[$€£¥₩₹])`;
    if (type === 'ram') return `${number}\\s*(?:[KMGTPE]i?B)`;
    const list = type.endsWith('List');
    const items = values[list ? type.slice(0, -4) : type];
    if (!Array.isArray(items) || !items.length) throw new Error(`Unknown slot type: ${type}`);
    const single = `(?:${items.map(literal).sort((a,b) => b.length-a.length).join('|')})`;
    return list ? `${single}(?:(?:, |,? or | and )${single})*` : single;
  }
  let source = '', cursor = 0;
  for (const part of entry.en.matchAll(slotPattern)) {
    source += literal(entry.en.slice(cursor, part.index)) + `(${typePattern(entry.slots[part[1]])})`;
    cursor = part.index + part[0].length;
  }
  const regex = new RegExp(`^${source}${literal(entry.en.slice(cursor))}$`, 'u');
  return text => {
    const captures = regex.exec(text.trim());
    if (!captures) return null;
    const bindings = {};
    for (let i = 0; i < names.length; i++) {
      if (bindings[names[i]] !== undefined && bindings[names[i]] !== captures[i+1]) return null;
      bindings[names[i]] = captures[i+1];
    }
    return { ...entry, zh: entry.zh.replace(slotPattern, (_, name) => bindings[name]) };
  };
}

export function createMatcher(entries, values = {}) {
  const index = new Map(), templates = new Map();
  for (const entry of entries) {
    if (entry.review?.status !== 'approved') continue;
    const template = entry.match === 'template' ? compile(entry, values) : null;
    for (const scope of entry.scopes) {
      const key = `${scope}\0${normalize(entry.en)}`;
      if (index.has(key) && index.get(key).zh !== entry.zh) throw new Error(`Conflicting translation: ${entry.en}`);
      index.set(key, entry);
      if (template) {
        if (!templates.has(scope)) templates.set(scope, []);
        templates.get(scope).push(template);
      }
    }
  }
  function single(text, scope) {
    const found = index.get(`${scope}\0${normalize(text)}`);
    if (found && found.match !== 'template') return found;
    if (text.length > 8000) return null;
    for (const template of templates.get(scope) ?? []) {
      const result = template(text);
      if (result) return result;
    }
    return null;
  }
  return (text, scope) => {
    const whole = single(text, scope);
    if (whole) return whole;
    // Only a source-approved multiline block can use line matching. Unknown lines
    // leave the complete block in English instead of silently omitting an effect.
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2 || lines.length > 64) return null;
    const header = single(lines[0], scope);
    if (!header?.lineBlock) return null;
    const matches = lines.map(line => line.trim() ? single(line, scope) : null);
    if (lines.some((line,i) => line.trim() && !matches[i]?.line)) return null;
    return { ...header, zh: lines.map((line,i) => matches[i] ? line.replace(/\S(?:[\s\S]*\S)?/u, () => matches[i].zh) : line).join('\n'), entries: matches.filter(Boolean) };
  };
}
