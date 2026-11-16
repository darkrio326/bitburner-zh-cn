import React,{useState}from'react';
import{createRoot}from'react-dom/client';
import{ThemeProvider,createTheme,Box,Button,Typography,List,ListItemButton,ListItemText,Paper,Link,Dialog}from'@mui/material';
import ReactMarkdown from'react-markdown';
import remarkGfm from'remark-gfm';
import corpus from'./fixtures/documentation-v3.0.1.json';
const {FactionName,CompletedProgramName,AugmentationName}=corpus.enums;
const sourceEffects=/* SF_COMPONENTS */[];
const theme=createTheme({palette:{mode:'dark',primary:{main:'#00e878'}},typography:{fontFamily:'monospace'}});
function App(){
 const[route,setRoute]=useState('Documentation'),[path,setPath]=useState('index.md'),[past,setPast]=useState([]),[sf,setSF]=useState(1),[modal,setModal]=useState(false);
 const navigate=next=>{window.fixtureLinkClicks=(window.fixtureLinkClicks??0)+1;const rel=new URL(next,'https://fixture.test/'+path).pathname.slice(1);if(corpus.pages.some(p=>p.path===rel)){setPast([...past,path]);setPath(rel)}};
 window.documentationFixture={route:setRoute,doc:setPath,source:setSF,popup:setModal};
 const components={
 h1:({children})=><Typography variant="h2">{children}</Typography>,h2:({children})=><Typography variant="h3">{children}</Typography>,h3:({children})=><Typography variant="h4">{children}</Typography>,
 p:({children})=><Typography sx={{mb:1}}>{children}</Typography>,li:({children})=><ListItemText><Typography component="div" sx={{display:'list-item'}}>{children}</Typography></ListItemText>,
 a:({href,children})=><Link component="button" variant="body1" fontSize="inherit" onClick={()=>navigate(href)}>{children}</Link>,
 code:({inline,children})=>inline?<Typography component="span" className="tss-fixture-code">{children}</Typography>:<pre><code>{children}</code></pre>,
 pre:({children})=><span className="tss-fixture-pre">{children}</span>,
 };
 const markdown=p=><ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>{corpus.pages.find(e=>e.path===p)?.markdown??''}</ReactMarkdown>;
 const record=corpus.sourceFiles.find(e=>e.number===sf);
 return <ThemeProvider theme={theme}>
 <nav className="MuiDrawer-root" style={{position:'fixed',width:220}}>{['Documentation','Augmentations','Stats'].map(n=><Button key={n} className={route===n?'fixture-active':''} onClick={()=>setRoute(n)}>{n}</Button>)}</nav>
 <main style={{marginLeft:240,padding:16}}>
 {route==='Documentation'?<><Box display="flex" alignItems="center"><Button onClick={()=>{setPath(past.at(-1)??'index.md');setPast(past.slice(0,-1))}}>Back</Button><Button onClick={()=>setPath('index.md')}>Home</Button><input placeholder="Search NS API" onKeyDown={e=>{if(e.key==='Enter')window.fixtureSearch=e.currentTarget.value}}/></Box><article className="MuiBox-root" data-path={path}>{markdown(path)}</article></>:
 route==='Augmentations'?<><Typography variant="h4">Augmentations</Typography><Typography variant="h5">Source Files</Typography><Paper sx={{display:'grid',gridTemplateColumns:'1fr 3fr'}}><Box><List sx={{height:400,overflowY:'scroll'}}>{corpus.sourceFiles.map(e=><ListItemButton key={e.number} selected={e.number===sf} onClick={()=>setSF(e.number)}><ListItemText disableTypography primary={<Typography>Source-File {e.number}: {e.name}</Typography>} secondary={<Typography>Level: {3} / {3}</Typography>}/></ListItemButton>)}</List></Box><Box sx={{m:1,minWidth:0}}><Typography variant="h6" sx={{display:'flex',flexWrap:'wrap'}}>Source-File {sf}: {record.name}</Typography><Typography id="sf-effect" component="div" sx={{maxHeight:350,overflowY:'scroll'}}>Level: {3} / {3}<br/>{sourceEffects[sf-1]}</Typography></Box></Paper></>:<><Typography variant="h4">Stats</Typography><Typography id="outside-doc">Source-Files are a type of persistent upgrade that is more powerful than</Typography><Button onClick={()=>setModal(true)}>Help</Button></>}
 </main><Dialog open={modal} onClose={()=>setModal(false)} maxWidth="md" fullWidth><Box sx={{p:2}}>{markdown('advanced/sourcefiles.md')}<Button onClick={()=>setModal(false)}>Close</Button></Box></Dialog>
 </ThemeProvider>
}
createRoot(document.getElementById('root')).render(<App/>);
