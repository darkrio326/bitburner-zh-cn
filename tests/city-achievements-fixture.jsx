// v3.0.1 component shapes; all interactions affect only this local React fixture.
import React,{useState} from 'react';
import{createRoot}from'react-dom/client';
import{createPortal}from'react-dom';
import achievements from './fixtures/achievements-v3.0.1.json';
function App(){
 const[page,setPage]=useState('City'),[place,setPlace]=useState(''),[modal,setModal]=useState(''),[elapsed,setElapsed]=useState('1 day 2 hours 3 minutes 4 seconds'),[money,setMoney]=useState('$12.500m'),[joined,setJoined]=useState(false),[expanded,setExpanded]=useState(false);
 window.secondary={setPage,setModal,setElapsed,setMoney};
 return <>
 <aside className="MuiDrawer-root">{['City','Achievements','Factions','Stats'].map(p=><button className={page===p?'fixture-active':''} key={p} onClick={()=>{setPage(p);setPlace('')}}>{p}</button>)}</aside>
 <main>
 {page==='City'&&(place?<><h4>{place}</h4><button onClick={()=>setPlace('')}>Return to World</button><button onClick={()=>window.cityAction=place}>Study Computer Science (free)</button></>:<><p>Sector-12</p>{['Rothman University','Iron Gym','Hospital','The Slums','Sector-12 City Hall'].map(n=><button key={n} onClick={()=>{window.selectedLocation=n;setPlace(n)}}>{n}</button>)}<p id="map"><span aria-label="Rothman University" onClick={()=>setPlace('Rothman University')}><b>U</b></span> -- H -- G</p></>)}
 {page==='Achievements'&&<><h4>Achievements</h4><p>Achievements are persistent rewards for various actions and challenges. A limited number of Bitburner achievements have corresponding achievements in Steam.</p><button id="expand" onClick={()=>setExpanded(!expanded)}><h5>Locked ({108} remaining, {92} for Steam)</h5></button>{expanded&&<section id="achievement-list">{achievements.entries.map(a=><article key={a.ID} data-achievement-id={a.ID}><h6>{a.Name}</h6><p>{a.Description}</p></article>)}</section>}<p id="hidden-count">{`${12} additional achievements`} hidden behind content you don't have access to.</p><p id="acquired">Acquired on {'2026/11/16 11:02:03'}</p><span id="secret-id">UNACHIEVABLE</span><p>No equivalent Steam achievement</p></>}
 {page==='Factions'&&<><h4>Factions</h4><div id="invitation-row" style={{display:'flex',width:180}}><button id="join-list" style={{width:30,minWidth:0,height:48,padding:0}} onClick={()=>{window.factionAction='CyberSec';setJoined(true)}}>{joined?'Details':'Join!'}</button><span style={{overflow:'hidden',whiteSpace:'nowrap'}}>CyberSec and a long faction label</span></div></>}
 {page==='Stats'&&<h4>Stats</h4>}
 </main>
 {modal&&createPortal(<div className="MuiModal-root" role="dialog"><button aria-label="Close" onClick={()=>setModal('')}>×</button>{modal==='offline'?<><p>Offline for {elapsed}. While you were offline:</p><ul><li><p>Your scripts generated <span id="money">{money}</span></p></li><li><p>Your Hacknet Nodes generated <span>1.250k</span> hashes</p></li><li><p>You gained <span>123.456</span> reputation divided amongst your factions</p></li></ul></>:<><h4>You received a faction invitation.</h4><p>Would you like to join <b>CyberSec</b>?</p><button id="join-modal" style={{width:30,minWidth:0,padding:0}} onClick={()=>{window.factionAction='CyberSec';setModal('')}}>Join</button><button onClick={()=>setModal('')}>Decide later</button></>}</div>,document.body)}
 <div id="terminal">Offline for 1 day. While you were offline:</div><pre>Join! Achievements ns.hack("n00dles")</pre>
 </>;
}
createRoot(document.getElementById('root')).render(<App/>);
