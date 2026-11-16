import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import dictionary from '../translations/zh-CN.json';
const longText=dictionary.entries.find(e=>e.id==='39905c75dd16').en;
function App() {
  const [page,setPage]=useState('Stats');
  const [tick,setTick]=useState(0);
  const [tip,setTip]=useState(false);
  const [value,setValue]=useState('');
  const [show,setShow]=useState(true);
  window.fixture={setPage,setTick,setShow,setTip};
  return <><aside className="MuiDrawer-root">{['Stats','Factions','Augmentations','Hacknet'].map(p=><button key={p} onClick={()=>setPage(p)}>{p}</button>)}</aside>
    <main><h4>{page==='Hacknet'?'Hacknet Nodes':page}</h4>
    {show&&<p id="dynamic">{tick%2?'Skills':'General'}</p>}
    <p id="unmatched">n00dles home CyberSec NUKE.exe ns.hack() $1.500m</p>
    {page==='Hacknet'&&<><p id="long">{longText}</p><button id="purchase" onClick={()=>setTick(tick+1)}>Purchase Hacknet Node - <span>${tick}.000k</span></button></>}
    {page==='Augmentations'&&<><p>Purchased Augmentations</p><button>Install Augmentations</button><p id="aug-description">{dictionary.entries.find(e=>e.id==='5ff43eb651af').en}</p></>}
    {page==='CyberSec'&&<button>Hacking Contracts</button>}
    {page==='Factions'&&<><p>Your Factions</p><p>You have not yet joined any Factions.</p></>}
    {page==='Options'&&<><p>System</p><label>Autoexec Script + Args<input defaultValue="General"/></label><button>Export Game</button></>}
    <div className="react-draggable fixture-overviewContainer"><p>Overview</p><span>HP</span><span id="overview-hp">{tick}</span><span id="overview-extra-hook-0">General</span></div>
    <button id="tooltip-trigger" aria-describedby={tip?'rich-tooltip':undefined} onPointerOver={()=>setTimeout(()=>setTip(true),200)}>?</button>
    {tip&&<div role="tooltip" id="rich-tooltip"><p>Displays your current multipliers.</p><p>When there is a dim number next to a multiplier, that means that the multiplier in question is being affected by BitNode multipliers.</p></div>}
    <input aria-label="terminal input" value={value} onChange={e=>setValue(e.target.value)}/>
    <div className="monaco-editor"><span>General</span><textarea aria-label="code editor"/></div>
    <pre>General</pre><div contentEditable suppressContentEditableWarning>General</div>
    <ul id="terminal"><li>General</li></ul><code>General</code>
    <div className="react-draggable"><p>General</p></div>
    <button id="remove" onClick={()=>setShow(false)}>Remove fixture node</button>
    </main></>;
}
createRoot(document.getElementById('root')).render(<App/>);
