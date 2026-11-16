import { createMatcher, normalize } from './matcher.js';
import { HOST_ID, EXCLUDED, CANDIDATE, excluded, dataNode, scopeResolver, createInlineTranslator } from './dom.js';
import { createCityMapLabels } from './map-labels.js';
export { HOST_ID } from './dom.js';
export function install(dictionary, env = {}) {
  const doc = env.document ?? document;
  const win = doc.defaultView;
  if (doc.getElementById(HOST_ID)) return null;
  const match = createMatcher(dictionary.entries, dictionary.slotValues);
  let scopes;
  const mapLabels = createCityMapLabels(doc, dictionary.mapLabels ?? []);
  const inline = createInlineTranslator(doc, match, () => scopes, mapLabels);
  scopes = scopeResolver(doc, dictionary, inline.readText);
  const host = doc.createElement('div');
  host.id = HOST_ID;
  // Inline host styles isolate the independent toolbar from global game CSS.
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = doc.createElement('style');
  style.textContent = `
    :host { color-scheme: dark; }
    * { box-sizing:border-box; }
    .bar { position:fixed;right:12px;bottom:12px;display:flex;gap:4px;pointer-events:auto; }
    button { font:12px/1.4 system-ui,sans-serif;cursor:pointer;border:1px solid #57756b;border-radius:5px;background:#14251f;color:#d7f5e6;padding:6px 9px; }
    button:focus-visible { outline:2px solid #9fffc5;outline-offset:2px; }
    section { position:fixed;width:max-content;max-width:min(560px,calc(100vw - 24px));max-height:65vh;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere;background:#101c18;color:#e4f4eb;border:1px solid #659c81;border-radius:8px;box-shadow:0 6px 28px #0008;padding:14px;font:15px/1.7 system-ui,"Microsoft YaHei",sans-serif;pointer-events:none; }
    section[data-pinned="true"] { pointer-events:auto;overflow:auto; }
    .source { display:block;font-size:11px;line-height:1.5;color:#9fb9ab;border-top:1px solid #355045;margin-top:10px;padding-top:7px; }
    [hidden] { display:none !important; }
  `;
  const bar = doc.createElement('div'); bar.className = 'bar';
  const toggle = doc.createElement('button'); toggle.type = 'button';
  const modeButton = doc.createElement('button'); modeButton.type = 'button';
  const reader = doc.createElement('button'); reader.type = 'button'; reader.textContent = '阅读';
  reader.title = '固定最近的译文，可滚动阅读；再次点击关闭';
  const panel = doc.createElement('section'); panel.hidden = true; panel.lang = 'zh-CN';
  panel.setAttribute('role', 'tooltip');
  const content = doc.createElement('div');
  const source = doc.createElement('small'); source.className = 'source';
  panel.append(content, source); bar.append(toggle, modeButton, reader); shadow.append(style, bar, panel);
  doc.body.append(host);

  let enabled = false, destroyed = false, active = null, timer = 0, controller = null;
  let lastResult = null, pinned = false, menuIds = [];
  let mode = env.getValue?.('mode', 'replace') === 'hover' ? 'hover' : 'replace';
  const updateModeLabel = () => { modeButton.textContent = mode === 'replace' ? '显示：直接' : '显示：悬停'; };
  updateModeLabel();
  const lifetime = new win.AbortController();
  const observer = new win.MutationObserver(records => {
    if (!active?.isConnected) { clearActive(); return; }
    // No document-wide scans. Inspect bounded mutation metadata only while hovering.
    const relevant = records.some(r => active.contains(r.target) ||
      (r.type === 'childList' && [...r.addedNodes].some(n => n.nodeType === 1 && n.matches('[role="tooltip"],.MuiTooltip-popper'))));
    if (relevant) schedule(120);
  });
  function clearActive() {
    win.clearTimeout(timer); timer = 0; observer.disconnect(); active = null;
    if (!pinned) panel.hidden = true;
  }
  function lookup(text, scope, element) {
    const item = match(text, scope) ?? (element.closest('button,[role="button"]') ? match(text, 'common') : null);
    return item && (!item.selector || element.closest(item.selector)) ? item : null;
  }
  function readElement(element, scope) {
    if (element.matches(EXCLUDED) || element.querySelector(EXCLUDED)) return null;
    // Bound reads to a small semantic element, never body/root/container text.
    const walker = doc.createTreeWalker(element, win.NodeFilter.SHOW_TEXT);
    const parts = [], blocks = [], data = []; let length = 0, n;
    while ((n = walker.nextNode())) {
      length += n.data.length;
      if (parts.length >= 96 || length > 8000) return null;
      parts.push(inline.original(n));
      data.push(dataNode(n, scope, inline.original));
      blocks.push(n.parentElement.closest('p,li,h1,h2,h3,h4,h5,h6'));
    }
    const whole = data.some(Boolean) ? null : lookup(parts.join(''), scope, element);
    if (whole) return { text: whole.zh, entries: whole.entries ?? [whole] };
    // Only approved DOM segments, never substring/regex replacement. Unknown segments remain verbatim.
    const entries = [];
    const translated = parts.map((text, i) => {
      if (data[i]) return text;
      const found = lookup(text, scope, element);
      if (!found || !found.segment) return text;
      entries.push(...(found.entries ?? [found]));
      return text.replace(/\S(?:[\s\S]*\S)?/u, () => found.zh);
    });
    return entries.length ? { text: translated.map((text, i) =>
      (i && blocks[i] !== blocks[i - 1] ? '\n' : '') + text).join(''), entries } : null;
  }
  function resolve(element) {
    if (!element.isConnected || excluded(element)) return null;
    const scope = scopes.scope(element);
    // MUI exposes string tooltips through aria-label; rich tooltips through aria-describedby.
    for (let node = element, depth = 0; node && depth < 5 && node !== doc.body; node = node.parentElement, depth++) {
      for (const attr of ['aria-label', 'title']) {
        const item = lookup(node.getAttribute(attr) ?? '', scope, node);
        if (item) return { text: item.zh, entries: item.entries ?? [item] };
      }
      const ids = (node.getAttribute('aria-describedby') ?? '').split(/\s+/).slice(0, 4);
      for (const id of ids) {
        const tooltip = doc.getElementById(id);
        if (tooltip?.matches('[role="tooltip"]')) {
          const result = readElement(tooltip, scope);
          if (result) return result;
        }
      }
      if (node.matches(CANDIDATE)) {
        const result = readElement(node, scope);
        if (result) return result;
      }
      if (node.matches('button,[role="button"],td,th,p,h1,h2,h3,h4,h5,h6')) break;
    }
    return null;
  }
  function place() {
    if (panel.hidden) return;
    const box = active?.getBoundingClientRect();
    const width = panel.getBoundingClientRect().width, height = panel.getBoundingClientRect().height;
    const x = pinned ? win.innerWidth - width - 12 : (box?.left ?? 12);
    let y = pinned ? 54 : (box?.bottom ?? 40) + 8;
    if (y + height > win.innerHeight - 12) y = Math.max(12, (box?.top ?? win.innerHeight) - height - 8);
    panel.style.left = `${Math.max(12, Math.min(x, win.innerWidth - width - 12))}px`;
    panel.style.top = `${Math.max(12, Math.min(y, win.innerHeight - height - 12))}px`;
  }
  function show(result) {
    lastResult = result;
    content.textContent = result.text;
    const ids = [...new Set(result.entries.map(e => e.id))];
    source.textContent = `简体中文 · ${result.entries.some(e => e.source.kind !== 'pr-diff') ? '含审校补译' : 'PR #3068 审校译文'} · ${ids.join(', ')}\n未收录片段保留英文；点击右下角“阅读”可固定。`;
    panel.hidden = false; place();
  }
  function schedule(delay = 180) {
    if (timer || pinned) return;
    timer = win.setTimeout(() => {
      timer = 0;
      if (!enabled || !active?.isConnected) { clearActive(); return; }
      const result = resolve(active);
      // Short translated labels need no duplicate popup; tooltips and long prose do.
      if (mode === 'replace' && result && result.text.length < 120 &&
          normalize(active.textContent) === normalize(result.text)) { panel.hidden = true; return; }
      if (result) show(result); else panel.hidden = true;
    }, delay);
  }
  function onOver(event) {
    const target = event.target;
    if (!(target instanceof win.Element) || target === host || excluded(target)) { clearActive(); return; }
    const element = target.closest(`${CANDIDATE},svg,[aria-label],[aria-describedby],[title]`);
    if (!element || element === doc.body || element === doc.documentElement) { clearActive(); return; }
    if (element === active) return;
    clearActive(); active = element;
    observer.observe(doc.body, { childList: true, subtree: true });
    observer.observe(element, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-describedby', 'aria-label', 'title'] });
    schedule();
  }
  function onOut(event) {
    if (active && (!event.relatedTarget || !active.contains(event.relatedTarget))) clearActive();
  }
  function setEnabled(value, persist = true) {
    if (destroyed) return;
    enabled = !!value; pinned = false; panel.dataset.pinned = 'false'; panel.setAttribute('role', 'tooltip');
    controller?.abort(); controller = null; clearActive();
    inline.stop();
    panel.hidden = true; lastResult = null; reader.textContent = '阅读'; reader.disabled = !enabled;
    toggle.textContent = enabled ? '中文：开' : '中文：关';
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.title = '启停中文翻译；关闭时恢复原文';
    if (persist) env.setValue?.('enabled', enabled);
    if (enabled) {
      if (mode === 'replace') inline.start();
      controller = new win.AbortController();
      const options = { passive: true, signal: controller.signal };
      doc.addEventListener('pointerover', onOver, options);
      doc.addEventListener('pointerout', onOut, options);
      doc.addEventListener('focusin', onOver, options);
      doc.addEventListener('focusout', () => clearActive(), options);
      doc.addEventListener('scroll', () => { if (!pinned) clearActive(); }, { ...options, capture: true });
      win.addEventListener('resize', place, options);
      win.addEventListener('blur', () => clearActive(), options);
      doc.addEventListener('keydown', event => {
        if (event.key === 'Escape' && (event.target === host || !excluded(event.target))) {
          pinned = false; panel.dataset.pinned = 'false'; reader.textContent = '阅读'; clearActive();
        }
      }, options);
    }
  }
  function destroy() {
    setEnabled(false, false); destroyed = true; lifetime.abort();
    for (const id of menuIds) env.unregisterMenu?.(id);
    menuIds = []; host.remove();
  }
  toggle.addEventListener('click', () => setEnabled(!enabled), { signal: lifetime.signal });
  modeButton.addEventListener('click', () => {
    mode = mode === 'replace' ? 'hover' : 'replace';
    env.setValue?.('mode', mode); updateModeLabel(); setEnabled(enabled, false);
  }, { signal: lifetime.signal });
  reader.addEventListener('click', () => {
    if (!lastResult) return;
    pinned = !pinned; panel.dataset.pinned = String(pinned);
    panel.setAttribute('role', pinned ? 'region' : 'tooltip');
    reader.textContent = pinned ? '收起' : '阅读';
    if (pinned) show(lastResult); else clearActive();
  }, { signal: lifetime.signal });
  if (env.registerMenu) {
    menuIds.push(env.registerMenu('切换中文汉化', () => setEnabled(!enabled)));
    menuIds.push(env.registerMenu('本页完全移除汉化（刷新恢复）', destroy));
  }
  win.addEventListener('pagehide', event => { if (!event.persisted) destroy(); }, { signal: lifetime.signal });
  setEnabled(env.getValue?.('enabled', true) !== false, false);
  return { setEnabled, destroy, host };
}
