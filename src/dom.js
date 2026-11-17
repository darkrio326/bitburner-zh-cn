import { normalize } from './matcher.js';

export const HOST_ID = 'bitburner-zh-cn-overlay';
export const MAP_HOST_ID = 'bitburner-zh-cn-map-labels';
export const OVERVIEW = '[class*="-overviewContainer"]';
const PROTECTED = `#${HOST_ID},#${MAP_HOST_ID},input,textarea,select,option,[contenteditable]:not([contenteditable="false"]),[role="textbox"],code,kbd,samp,span[class*="-code"],math,.katex,script,style,.monaco-editor,.monaco-hover,.CodeMirror,.cm-editor,.ace_editor,#terminal,#terminal-input,[id^="overview-"]`;
export const EXCLUDED = `${PROTECTED},pre`;
const DARKNET_LABEL = 'span[class*="-serverDetailsText"]';
export const CANDIDATE = 'button,[role="button"],a,label,p,h1,h2,h3,h4,h5,h6,td,th,li,span,[role="tooltip"],.MuiTypography-root';

export function excluded(element) {
  if (!element || element.closest(PROTECTED)) return true;
  // The game's password-hint <pre> contains explicit UI-label spans. Only
  // those spans may be translated; adjacent passwords, hints and data stay raw.
  if (element.closest('pre') && !element.matches(DARKNET_LABEL)) return true;
  return !!element.closest('.react-draggable') && !element.closest(OVERVIEW);
}

function traversalExcluded(element) {
  if (element.matches('pre') && element.querySelector(DARKNET_LABEL) && !element.closest(PROTECTED)) return false;
  return excluded(element);
}

export function scopeResolver(doc, dictionary, readText) {
  function headingScope(title) {
    if (title === 'You received a faction invitation.') return 'factions';
    if (title.startsWith('You have not joined ') && title.endsWith(' yet!') &&
        dictionary.factionNames.includes(title.slice(20, -5))) return 'factions';
    if (dictionary.augmentationNames?.includes(title)) return 'augmentations';
    return null;
  }
  function page() {
    const managementPages = { Gang: 'gang', Bladeburner: 'bladeburner', Corporation: 'corporation', Documentation: 'documentation' };
    for (const item of doc.querySelectorAll('.MuiDrawer-root [class*="-active"]')) {
      const selected = managementPages[normalize(readText(item))];
      if (selected) return selected;
    }
    for (const h of doc.querySelectorAll('h5,h6')) {
      if (h.closest('.MuiDrawer-root,.MuiModal-root,[role="dialog"]')) continue;
      if (['Dark Net', '[WEBSTORM WARNING]'].includes(normalize(readText(h)))) return 'darknet';
    }
    for (const h of doc.querySelectorAll('h4')) {
      if (h.closest('.MuiDrawer-root,.MuiModal-root,[role="dialog"]')) continue;
      const title = normalize(readText(h));
      if (title.startsWith('Infiltrating ') && dictionary.locationNames?.includes(title.slice(13))) return 'infiltration';
      // MegaCorp/ECorp and other employers are also faction names. The
      // location's own return button disambiguates these real UI routes.
      if (dictionary.locationNames?.includes(title) && [...doc.querySelectorAll('button')].some(b => normalize(readText(b)) === 'Return to World')) return 'locations';
      const special = headingScope(title);
      if (special) return special;
      if (title === 'Stats') return 'stats';
      if (title === 'Factions' || dictionary.factionNames.includes(title)) return 'factions';
      if (title === 'Augmentations' || title.startsWith('Faction Augmentations -')) return 'augmentations';
      if (title === 'Hacknet Nodes' || title === 'Hacknet Servers') return 'hacknet';
      if (title === 'Options') return 'options';
      if (title === 'Active Scripts' || title === 'Recently Killed Scripts' || title === 'Recent Errors') return 'scripts';
      if (title === 'Create Program' || title === 'Create program') return 'programs';
      if (title === 'Milestones') return 'milestones';
      if (title === 'Achievements') return 'achievements';
      if (title === 'Stock Market') return 'stocks';
      if (title === 'Grafting Laboratory') return 'grafting';
      if (title === 'Travel' || title === 'Travel Agency' || dictionary.locationNames?.includes(title)) return 'locations';
    }
    const pageNames = { 'Active Scripts': 'scripts', 'Recently Killed Scripts': 'scripts', 'Recent Errors': 'scripts',
      'Create Program': 'programs', 'Stock Market': 'stocks', 'City': 'locations', 'Job': 'locations', 'Work': 'work',
      'Dark Net': 'darknet', 'Grafting': 'grafting' };
    for (const item of doc.querySelectorAll('.MuiDrawer-root [class*="-active"]')) {
      if (pageNames[normalize(readText(item))]) return pageNames[normalize(readText(item))];
    }
    const tabs = [...doc.querySelectorAll('[role="tab"]')].map(t => normalize(readText(t)));
    if (tabs.includes('Active') && tabs.includes('Recently Killed')) return 'scripts';
    if ([...doc.querySelectorAll('button')].some(b => ['Do something else simultaneously','Stop grafting','Stop creating program','Stop working'].includes(normalize(readText(b))))) return 'work';
    return 'unknown';
  }
  function scope(element, current = page()) {
    if (element.closest('.MuiDrawer-root')) return 'sidebar';
    const surface = element.closest('.MuiModal-root,[role="dialog"],[role="tooltip"]');
    if (surface) {
      const docHeading = surface.querySelector('h2,h3');
      if (docHeading && dictionary.documentationHeadings?.includes(normalize(readText(docHeading)))) return 'documentation';
      const heading = surface.querySelector('h4,h5');
      const special = heading && headingScope(normalize(readText(heading)));
      if (special) return special;
      const firstParagraph = surface.querySelector('p');
      if (firstParagraph && /^(Would you like to start a corporation\?|Would you like to sell your position as CEO and start a new corporation\?)/.test(normalize(readText(firstParagraph)))) return 'corporation';
      if (firstParagraph && /^Offline for .+\. While you were offline:$/u.test(normalize(readText(firstParagraph)))) return 'offline';
      const alertText = firstParagraph ?? surface.querySelector('.MuiTypography-root');
      if (alertText && normalize(readText(alertText)).includes('you spent a total of') && normalize(readText(alertText)).includes('You earned a total of:')) return 'training-result';
    }
    const overview = element.closest(OVERVIEW);
    if (overview) return overview.querySelector('[id^="overview-"]') ? 'overview' : 'tutorial';
    return current;
  }
  return { page, scope };
}

// These data positions come from the pinned v3.0.1 components, not from a list
// of possible player names. A member/product named "Research" must stay raw.
export function dataNode(node, scope, original = n => n.data) {
  const element = node.parentElement;
  if (!element || !['gang','bladeburner','corporation','documentation'].includes(scope)) return false;
  if (element.closest('[role="combobox"],[role="option"],.MuiSelect-select,math,.katex')) return true;
  if (scope === 'documentation') return false;
  if (scope === 'bladeburner') return !!element.closest('.MuiList-root'); // Console.tsx logs
  if (scope === 'gang' && element.closest('.MuiListItemText-primary,h5')) return true;
  if (scope === 'corporation' && element.closest('[role="tab"]')) return true;
  const siblingText = n => n?.nodeType === 3 ? normalize(original(n)) : '';
  const next = siblingText(node.nextSibling), before = siblingText(node.previousSibling);
  if (scope === 'gang') return /^(ascended!|gained the following stat multipliers for ascending:|will gain the following permanent boost to stat multipliers:)$/.test(next);
  const cell = element.closest('td');
  // DivisionWarehouse's four-column storage table uses user product names as
  // row labels. The two-column overview/stat tables still translate normally.
  if (cell?.cellIndex === 0 && cell.parentElement.cells.length === 4) return true;
  if (element.matches('p.MuiTypography-root') && element.closest('button') && !node.previousSibling && !node.nextSibling) return true;
  if (/^(:|has|- lvl|\(req\. Operations\/Engineers in|you would like to sell per second)/.test(next) ||
      ['Designing','Division','Industry:','Enter the maximum amount of'].includes(before)) return true;
  const bold = element.closest('b');
  return !!bold && (/^(received|will receive|currently has|'s stock price)/.test(siblingText(bold.nextSibling)) ||
    ['Sold','shares of'].includes(siblingText(bold.previousSibling)));
}

// Mutate Text.data in place: never replace/remove React nodes or element children.
// React may overwrite a translated node at any point; restoration only owns the exact value we wrote.
export function createInlineTranslator(doc, match, getScope, mapLabels) {
  const win = doc.defaultView;
  const owned = new Map();
  const placeholders = new Map();
  const pending = new Set();
  const fitted = new Map();
  const headings = new Set();
  const fitStyle = doc.createElement('style');
  fitStyle.textContent = 'button[data-bitburner-zh-fit="join"]{min-width:max-content!important;width:auto!important;flex-shrink:0!important;white-space:nowrap!important;padding-inline:12px!important}button[data-bitburner-zh-fit="wrap"]{min-width:0!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;flex-wrap:wrap!important}h4[data-bitburner-zh-heading]{max-width:var(--bitburner-zh-heading-width)!important;overflow-wrap:anywhere!important}';
  let running = false, timer = 0, walker = null, page = '', prune = false, layoutFrame = 0;
  let documentPanel = null;
  fitStyle.textContent += '[data-bitburner-zh-document]{max-width:var(--bitburner-zh-document-width)!important;overflow-wrap:anywhere}';
  const layoutObserver = new win.ResizeObserver(scheduleLayout);
  function clearDocumentPanel() {
    if (!documentPanel) return;
    documentPanel.removeAttribute('data-bitburner-zh-document');
    documentPanel.style.removeProperty('--bitburner-zh-document-width');
    if (documentPanel.getAttribute('style') === '') documentPanel.removeAttribute('style');
    layoutObserver.unobserve(documentPanel); documentPanel = null;
  }
  function clearHeading(h) {
    h.removeAttribute('data-bitburner-zh-heading'); h.style.removeProperty('--bitburner-zh-heading-width');
    if (h.getAttribute('style') === '') h.removeAttribute('style');
    layoutObserver.unobserve(h); headings.delete(h);
  }
  function scheduleLayout() {
    if (!running || layoutFrame || (!headings.size && !documentPanel)) return;
    layoutFrame = win.requestAnimationFrame(() => {
      layoutFrame = 0;
      const overview = doc.querySelector(OVERVIEW), overlay = overview?.getBoundingClientRect();
      if (overview) layoutObserver.observe(overview);
      if (documentPanel?.isConnected) {
        const r = documentPanel.getBoundingClientRect(), parent = documentPanel.parentElement.getBoundingClientRect();
        let width = Math.min(parent.right, win.innerWidth) - r.left;
        if (overlay?.width && overlay.left > r.left && overlay.bottom > 0 && overlay.top < win.innerHeight) width = Math.min(width, overlay.left - r.left - 12);
        const value = `${Math.max(0, width)}px`;
        if (documentPanel.style.getPropertyValue('--bitburner-zh-document-width') !== value) documentPanel.style.setProperty('--bitburner-zh-document-width', value);
      }
      for (const h of headings) {
        if (!h.isConnected) { clearHeading(h); continue; }
        const r = h.getBoundingClientRect(), parent = h.parentElement.getBoundingClientRect();
        let width = Math.min(parent.right, win.innerWidth) - r.left;
        if (overlay?.width && overlay.top < r.bottom && overlay.bottom > r.top && overlay.left > r.left) width = Math.min(width, overlay.left - r.left - 12);
        const value = `${Math.max(0, width)}px`;
        if (h.style.getPropertyValue('--bitburner-zh-heading-width') !== value) h.style.setProperty('--bitburner-zh-heading-width', value);
      }
    });
  }
  const original = node => {
    const entry = owned.get(node);
    return entry && node.data === entry.translated ? entry.original : node.data;
  };
  function readText(element) {
    const walk = doc.createTreeWalker(element, win.NodeFilter.SHOW_TEXT);
    let text = '', n;
    while ((n = walk.nextNode())) text += original(n);
    return text;
  }
  function restore() {
    for (const [node, entry] of owned) {
      if (node.data === entry.translated) node.data = entry.original;
    }
    owned.clear();
    for (const [input, entry] of placeholders) {
      if (input.getAttribute('placeholder') === entry.translated) input.setAttribute('placeholder', entry.original);
    }
    placeholders.clear();
    for (const button of fitted.values()) button.removeAttribute('data-bitburner-zh-fit');
    fitted.clear();
    for (const h of headings) clearHeading(h);
    clearDocumentPanel();
  }
  function translatePlaceholder(input) {
    // Approved placeholder labels only; input values and editor/terminal fields stay untouched.
    if (!input.matches('input[placeholder]') || excluded(input.parentElement)) return;
    const prior = placeholders.get(input), current = input.getAttribute('placeholder');
    const text = prior && current === prior.translated ? prior.original : current;
    const item = match(text, getScope().scope(input, page));
    if (item?.attribute !== 'placeholder') {
      if (prior && current === prior.translated) input.setAttribute('placeholder', prior.original);
      placeholders.delete(input);
      return;
    }
    if (current !== item.zh) input.setAttribute('placeholder', item.zh);
    placeholders.set(input, { original: text, translated: item.zh });
  }
  function translate(node, currentPage = page) {
    if (!node.isConnected || excluded(node.parentElement)) return;
    const text = original(node);
    const scope = getScope().scope(node.parentElement, currentPage);
    // DocumentationRoot.tsx places the Markdown content immediately after its
    // search/navigation bar. Keep this one prose column clear of the overview.
    if (scope === 'documentation' && !documentPanel && !node.parentElement.closest('.MuiModal-root,[role="dialog"]')) {
      const box = node.parentElement.closest('.MuiBox-root');
      if (box?.previousElementSibling?.querySelector('input[placeholder="Search NS API"]')) {
        documentPanel = box; box.setAttribute('data-bitburner-zh-document', '');
        layoutObserver.observe(box); scheduleLayout();
      }
    }
    mapLabels?.visit(node, scope);
    const item = dataNode(node, scope, original) || (node.parentElement.closest('pre') && scope !== 'darknet') ? null :
      match(text, scope) ?? (node.parentElement.closest('button,[role="button"]') ? match(text, 'common') : null);
    const prior = owned.get(node);
    const oldButton = fitted.get(node);
    if (oldButton) { oldButton.removeAttribute('data-bitburner-zh-fit'); fitted.delete(node); }
    const heading = node.parentElement.closest('h4');
    if (heading && scope !== 'locations' && headings.has(heading)) clearHeading(heading);
    if (!item || item.inline === false || (item.selector && !node.parentElement.closest(item.selector)) || text.length > 8000) {
      if (prior && node.data === prior.translated) node.data = prior.original;
      owned.delete(node);
      if (heading && headings.has(heading)) { clearHeading(heading); scheduleLayout(); }
      return;
    }
    const translated = text.replace(/\S(?:[\s\S]*\S)?/u, () => item.zh);
    if (node.data !== translated) node.data = translated;
    // WorkInProgressRoot renders a duration Text followed by a static suffix.
    // Only these already-recognized work timers need repaint-free updates.
    const suffix = node.nextSibling;
    const workTimer = scope === 'work' && node.parentElement.matches('p') && suffix?.nodeType === 3 &&
      /^(elapsed|remaining)$/.test(normalize(original(suffix)));
    owned.set(node, { original: text, translated, workTimer });
    const button = node.parentElement.closest('button');
    if (scope === 'factions' && /^(Join|Join!)$/.test(normalize(text)) && button) {
      button.setAttribute('data-bitburner-zh-fit', 'join'); fitted.set(node, button);
    } else if (['locations','grafting','darknet','gang','bladeburner','corporation','documentation'].includes(scope) && button) {
      button.setAttribute('data-bitburner-zh-fit', 'wrap'); fitted.set(node, button);
    }
    if (heading && scope === 'locations') {
      heading.setAttribute('data-bitburner-zh-heading', ''); headings.add(heading); layoutObserver.observe(heading); scheduleLayout();
    }
  }
  function schedule() {
    if (!timer && running) timer = win.setTimeout(flush, 32);
  }
  function flush() {
    timer = 0;
    if (!running) return;
    const currentPage = getScope().page();
    if (currentPage !== page) {
      page = currentPage;
      if (page !== 'documentation') clearDocumentPanel();
      pending.clear(); walker = null; pending.add(doc.body);
    }
    if (prune) {
      if (documentPanel && !documentPanel.isConnected) clearDocumentPanel();
      mapLabels?.prune();
      for (const h of headings) if (!h.isConnected) clearHeading(h);
      for (const node of owned.keys()) if (!node.isConnected) owned.delete(node);
      for (const input of placeholders.keys()) if (!input.isConnected) placeholders.delete(input);
      for (const [node, button] of fitted) if (!node.isConnected) {
        button.removeAttribute('data-bitburner-zh-fit'); fitted.delete(node);
      }
      scheduleLayout();
      prune = false;
    }
    const start = win.performance.now();
    let count = 0;
    while (count < 400 && win.performance.now() - start < 6) {
      if (!walker) {
        const root = pending.values().next().value;
        if (!root) break;
        pending.delete(root);
        if (!root.isConnected) continue;
        if (root.nodeType === 3) { translate(root); count++; continue; }
        if (root.nodeType !== 1) continue;
        translatePlaceholder(root);
        if (traversalExcluded(root)) continue;
        walker = doc.createTreeWalker(root, win.NodeFilter.SHOW_ELEMENT | win.NodeFilter.SHOW_TEXT, {
          acceptNode: node => {
            if (node.nodeType === 1) {
              translatePlaceholder(node);
              if (traversalExcluded(node)) return win.NodeFilter.FILTER_REJECT;
            }
            return win.NodeFilter.FILTER_ACCEPT;
          },
        });
      }
      const node = walker.nextNode();
      if (!node) { walker = null; continue; }
      count++;
      if (node.nodeType === 3) translate(node);
    }
    if (walker || pending.size) schedule();
  }
  const observer = new win.MutationObserver(records => {
    let currentPage;
    for (const record of records) {
      if (record.type === 'attributes') {
        const item = placeholders.get(record.target);
        if (!item || record.target.getAttribute('placeholder') !== item.translated) pending.add(record.target);
      } else if (record.type === 'characterData') {
        const item = owned.get(record.target);
        if (item && record.target.data === item.translated) continue;
        if (excluded(record.target.parentElement)) continue;
        if (item?.workTimer) {
          // Keep the game's current value, but translate it before the next paint.
          // Resolve the route afresh so a reused node cannot retain the work scope.
          currentPage ??= getScope().page();
          if (currentPage === 'work') {
            translate(record.target, currentPage);
            pending.delete(record.target);
            continue;
          }
        }
        pending.add(record.target);
      } else if (!excluded(record.target.nodeType === 1 ? record.target : record.target.parentElement)) {
        for (const node of record.addedNodes) pending.add(node);
        if (record.removedNodes.length) prune = true;
      }
    }
    if (pending.size || prune) schedule();
  });
  function stop() {
    running = false; observer.disconnect(); win.clearTimeout(timer); timer = 0;
    pending.clear(); walker = null; prune = false; layoutObserver.disconnect(); win.cancelAnimationFrame(layoutFrame); layoutFrame = 0;
    win.removeEventListener('resize', scheduleLayout); restore(); fitStyle.remove(); mapLabels?.stop();
  }
  function start() {
    if (running) return;
    running = true; page = ''; pending.add(doc.body);
    doc.head.append(fitStyle);
    win.addEventListener('resize', scheduleLayout, { passive:true });
    mapLabels?.start();
    observer.observe(doc.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder'] });
    schedule();
  }
  return { start, stop, original, readText };
}
