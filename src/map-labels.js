import { MAP_HOST_ID } from './dom.js';

// Paint only source-approved ASCII-map labels in their original text rectangles.
// The map's React nodes, whitespace, connectors and clickable letters never move.
export function createCityMapLabels(doc, entries) {
  const win = doc.defaultView;
  const labels = new Map(entries.filter(e => e.review?.status === 'approved').map(e => [e.en, e.zh]));
  const tracked = new Map();
  const host = doc.createElement('div');
  host.id = MAP_HOST_ID;
  host.setAttribute('aria-hidden', 'true');
  // Below game drawers, tooltips, overview and modals; independent of the reader toolbar.
  host.style.cssText = 'all:initial;position:fixed;inset:0;overflow:hidden;z-index:1;pointer-events:none;';
  const shadow = host.attachShadow({ mode: 'open' });
  let running = false, frame = 0, events = null;
  const resize = new win.ResizeObserver(() => schedule());
  function remove(node) {
    const record = tracked.get(node);
    record?.parts.forEach(p => p.box.remove());
    tracked.delete(node);
  }
  function prune() {
    for (const node of tracked.keys()) if (!node.isConnected) remove(node);
    if (!tracked.size) resize.disconnect();
    schedule();
  }
  function background(element) {
    for (let e = element; e; e = e.parentElement) {
      const color = win.getComputedStyle(e).backgroundColor;
      if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') return color;
    }
    return 'Canvas';
  }
  function clipBounds(element) {
    const bounds = {left:0,top:0,right:win.innerWidth,bottom:win.innerHeight};
    for (let e = element; e; e = e.parentElement) {
      const style = win.getComputedStyle(e), rect = e.getBoundingClientRect();
      if (/^(auto|scroll|hidden|clip)$/.test(style.overflowX)) {
        bounds.left = Math.max(bounds.left, rect.left + e.clientLeft);
        bounds.right = Math.min(bounds.right, rect.left + e.clientLeft + e.clientWidth);
      }
      if (/^(auto|scroll|hidden|clip)$/.test(style.overflowY)) {
        bounds.top = Math.max(bounds.top, rect.top + e.clientTop);
        bounds.bottom = Math.min(bounds.bottom, rect.top + e.clientTop + e.clientHeight);
      }
    }
    return bounds;
  }
  function render() {
    frame = 0;
    const clipping = new Map();
    for (const [node, record] of tracked) {
      if (!node.isConnected || node.data !== record.text) { remove(node); continue; }
      const style = win.getComputedStyle(record.parent);
      const visible = style.visibility === 'visible' && record.parent.getClientRects().length > 0;
      const color = background(record.parent);
      const container = record.parent.parentElement;
      if (!clipping.has(container)) clipping.set(container, clipBounds(container));
      const clip = clipping.get(container);
      for (const part of record.parts) {
        const range = doc.createRange();
        range.setStart(node, part.start); range.setEnd(node, part.end);
        const rect = range.getBoundingClientRect();
        const show = visible && rect.width > 0 && rect.bottom > clip.top && rect.top < clip.bottom && rect.right > clip.left && rect.left < clip.right;
        part.box.hidden = !show;
        if (!show) { part.box.style.display = 'none'; continue; }
        Object.assign(part.box.style, {position:'absolute',left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`,overflow:'hidden',backgroundColor:color,color:style.color,font:style.font,letterSpacing:style.letterSpacing,display:'flex',alignItems:'center',pointerEvents:'none',clipPath:`inset(${Math.max(0,clip.top-rect.top)}px ${Math.max(0,rect.right-clip.right)}px ${Math.max(0,rect.bottom-clip.bottom)}px ${Math.max(0,clip.left-rect.left)}px)`});
        Object.assign(part.text.style, {display:'block',width:'max-content',whiteSpace:'pre',flexShrink:'0',lineHeight:`${rect.height}px`,transform:'none',transformOrigin:'left center'});
        const naturalWidth = part.text.getBoundingClientRect().width;
        if (naturalWidth > rect.width) part.text.style.transform = `scaleX(${rect.width / naturalWidth})`;
      }
    }
  }
  function schedule() {
    if (running && tracked.size && !frame) frame = win.requestAnimationFrame(render);
  }
  function visit(node, scope) {
    if (!running) return;
    if (tracked.get(node)?.text === node.data && scope === 'locations') return;
    remove(node);
    if (scope !== 'locations' || !node.data.includes('[') || node.parentElement?.tagName !== 'P') return;
    const found = [...node.data.matchAll(/\[[^\]\r\n]+\]/g)].filter(m => labels.has(m[0]));
    if (!found.length || win.getComputedStyle(node.parentElement).whiteSpace !== 'pre') return;
    const parts = found.map(m => {
      const box = doc.createElement('div'), text = doc.createElement('span');
      box.dataset.source = m[0]; text.textContent = labels.get(m[0]); box.append(text); shadow.append(box);
      return {box,text,start:m.index,end:m.index+m[0].length};
    });
    tracked.set(node, {text:node.data,parent:node.parentElement,parts});
    resize.observe(node.parentElement);
    schedule();
  }
  function start() {
    if (running) return;
    running = true; doc.body.append(host);
    events = new win.AbortController();
    doc.addEventListener('scroll', schedule, {capture:true,passive:true,signal:events.signal});
    win.addEventListener('resize', schedule, {passive:true,signal:events.signal});
  }
  function stop() {
    running = false; events?.abort(); events = null; resize.disconnect();
    win.cancelAnimationFrame(frame); frame = 0;
    for (const node of tracked.keys()) remove(node);
    host.remove();
  }
  return {visit,prune,start,stop};
}
