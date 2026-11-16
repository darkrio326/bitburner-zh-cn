import React,{useState}from'react';
import{createRoot}from'react-dom/client';
import corpus from'./fixtures/city-maps-v3.0.1.json';
function App(){
 const[city,setCity]=useState('Sector-12'),[visible,setVisible]=useState(true),[font,setFont]=useState(16),[modal,setModal]=useState(false);
 window.mapFixture={setCity,setVisible,setFont,setModal};
 const map=corpus.maps.find(m=>m.city===city);
 return <><aside className="MuiDrawer-root"><button className="fixture-active">City</button></aside>
 <div id="map-scroll" style={{width:950,height:520,overflow:'auto',border:'2px solid #555',position:'relative'}}>
 {visible&&<section id="city-map" style={{color:'#00ff00',background:'#101820',fontSize:font,fontFamily:'monospace',width:'max-content'}}>
 {map.text.split('\n').map((line,i)=>{const pieces=[];let start=0;for(const m of line.matchAll(/[A-Z]/g)){pieces.push(line.slice(start,m.index));pieces.push(<span key={m.index} aria-label={`${city}-${m[0]}`} onClick={()=>window.mapClick=`${city}-${m[0]}`}><b>{m[0]}</b></span>);start=m.index+1;}pieces.push(line.slice(start));return <p key={i} style={{whiteSpace:'pre',lineHeight:'1em',margin:0}}>{pieces}</p>})}
 </section>}
 </div><button id="toggle-modal" onClick={()=>setModal(!modal)}>Open test dialog</button>
 {modal&&<div id="modal-cover" role="dialog" style={{position:'fixed',inset:0,zIndex:1300,background:'#e5e5e5'}}><button onClick={()=>setModal(false)}>Close</button></div>}
 <pre>[powerhouse gym]</pre><div id="terminal">[world stock exchange]</div>
 </>;
}
createRoot(document.getElementById('root')).render(<App/>);
