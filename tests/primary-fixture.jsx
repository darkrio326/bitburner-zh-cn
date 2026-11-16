// Source-shaped React fixtures from v3.0.1 Faction/ui and Augmentation/ui.
// All actions below are local test state, never the game's Player or save.
import React,{useState} from 'react';
import{createRoot}from'react-dom/client';
import{createPortal}from'react-dom';
import corpus from './fixtures/augmentation-text-v3.0.1.json';
const info=name=>corpus.entries.find(e=>e.name===name&&e.field==='info').text;
const share='You can share free RAM of your home computer with your factions to get a bonus multiplier for reputation gain. Each time you share your free RAM, you get a boost for ';
const afterShare=' seconds. After that, you lose the boost and get back your shared RAM. You can share free RAM of other servers that you have admin rights on by using the ns.share() API.';
function App(){
 const[page,setPage]=useState('Factions'),[modal,setModal]=useState(''),[count,setCount]=useState(4),[amount,setAmount]=useState('$1.250m'),[rep,setRep]=useState('17.500k'),[bonus,setBonus]=useState('0.012345'),[filter,setFilter]=useState(''),[clock,setClock]=useState(10),[special,setSpecial]=useState(false);
 const faction='CyberSec',augmentation='BitWire';
 window.primary={setPage,setModal,setCount,setAmount,setRep,setBonus,setClock,setSpecial};
 const record=(action)=>{window.lastAction={action,faction,augmentation,amount,rep};setModal('');};
 return <>
 <aside className="MuiDrawer-root">{['Stats','Factions','Augmentations'].map(p=><button key={p} onClick={()=>setPage(p)}>{p}</button>)}</aside>
 <main>
 <h4>{page==='Shop'?<>Faction Augmentations - {faction}</>:page}</h4>
 {page==='Factions'&&<>
   <p id="remaining">{`${count||'No'} Augmentations left`}</p>
   <button id="details" onClick={()=>setPage(faction)}>Details</button>
   <p id="share">{share}{clock}{afterShare}<br/>Free RAM on home computer: <span id="ram">64.000GB</span>.<br/>Current bonus: <span id="current-bonus">1.000000</span>. Bonus with <span>4.000GB</span>: <span>1.250000</span></p>
   <button id="requirements-trigger" aria-describedby="requirements">Requirements</button>
   <div role="tooltip" id="requirements"><p>Backdoor access to CSEC server</p><p>Have $1.500m</p><p>All combat skills level 30</p><p>Located in Chongqing or New Tokyo or Ishima</p><p>Total Hacknet RAM of 8.00GB</p></div>
 </>}
 {page===faction&&<>
   <p id="donation-limit">Unlock donations at <span>150.000</span> favor with {faction}</p>
   <input aria-label="donation amount" value={filter} onChange={e=>setFilter(e.target.value)}/>
   <p id="donation-preview">This donation will result in <span id="reputation">{rep}</span> reputation gain</p>
   <button id="donate" onClick={()=>setModal('donation')}>donate</button>
   <button onClick={()=>setPage('Shop')}>Purchase Augmentations</button>
   <button id="favor" aria-describedby="favor-tip">Favor: <span>150</span></button>
   <div role="tooltip" id="favor-tip"><p>You will have <span>163.900</span> faction favor after installing an Augmentation.</p></div>
 </>}
 {page==='Shop'&&<>
   <p id="shop-intro">These are all of the Augmentations that are available to purchase from <b>{faction}</b>. Augmentations are powerful upgrades that will enhance your abilities.</p>
   <p id="price-warning">The price of every Augmentation increases for every queued Augmentation and it is reset when you install them.</p>
   <p id="prereqs">Missing {count} pre-requisite(s)</p>
   <input aria-label="augmentation filter" value={filter} onChange={e=>setFilter(e.target.value)}/>
   <button id="open-purchase" onClick={()=>setModal('purchase')}>Buy</button><p>{augmentation}</p><p id="rep-price">{`${rep} rep`}</p>
 </>}
 {page==='Augmentations'&&<>
   <p id="nfg-name">{`NeuroFlux Governor - Level ${count}`}</p>
   <p id="nfg">{`This special augmentation can be leveled up infinitely. Each level of this augmentation increases MOST multipliers by 1% (+${bonus}%), stacking multiplicatively.`}</p>
   <p id="description">{info(special?'ECorp HVMind Implant':'BLADE-51b Tesla Armor')}</p>
   <p id="effects">{`Effects:\n+${count}.50% hacking skill\n-10.0% hacknet RAM upgrade cost\nStart with FTPCrack.exe and relaySMTP.exe after installing Augmentations.`}</p>
   <button id="install" onClick={()=>setModal('install')}>Install Augmentations</button>
 </>}
 <button id="invite" onClick={()=>setModal('invitation')}>Open invitation fixture</button>
 <div className="monaco-editor"><span>12 Augmentations left</span></div>
 <pre>Effects:{'\n'}+5.0% hacking skill</pre>
 <div className="react-draggable"><p>Have $1.500m</p></div>
 <div id="terminal"><p>Backdoor access to CSEC server</p></div>
 </main>
 {modal&&createPortal(<div className="MuiModal-root" role="dialog" aria-label="test modal">
  {modal==='invitation'&&<><h4>You received a faction invitation.</h4><p>Would you like to join <b>{faction}</b>?</p><p>Joining this faction will prevent you from joining its enemies until your next augmentation.</p><button onClick={()=>record('join')}>Join</button><button onClick={()=>setModal('')}>Decide later</button></>}
  {modal==='purchase'&&<><h4>{augmentation}</h4><p id="purchase-prose">{info(augmentation)}<br/><br/>Would you like to purchase the {augmentation} Augmentation for&nbsp;<span id="purchase-price">{amount}</span>?<br/></p><button onClick={()=>record('purchase')}>Purchase</button></>}
  {modal==='donation'&&<><p id="receipt">You just donated <span>{amount}</span> to {faction} to gain <span>{rep}</span> reputation.</p><button onClick={()=>setModal('')}>Close fixture</button></>}
  {modal==='install'&&<><p>Installing will reset<br/><br/>- money<br/>- skill / experience<br/>- every server except home<br/>- factions and reputation<br/>- current work activity<br/><br/>You will keep:<br/>- All scripts on home<br/>- home ram and cores<br/><br/>It is recommended to install several Augmentations at once.</p><button onClick={()=>record('install')}>Confirm</button><button onClick={()=>setModal('')}>Cancel</button></>}
  <button id="close-modal" onClick={()=>setModal('')}>Close fixture modal</button>
 </div>,document.body)}
 </>;
}
createRoot(document.getElementById('root')).render(<App/>);
