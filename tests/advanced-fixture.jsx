// Source-shaped React/MUI interactions; no game state or user save is imported.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Typography, Button, Tabs, Tab, Select, MenuItem, Modal, TextField, Tooltip } from '@mui/material';
import corpus from './fixtures/advanced-v3.0.1.json';
const theme = createTheme({ palette: { mode: 'dark', primary: { main: '#00e878' } }, typography: { fontFamily: 'monospace' } });
const text = prefix => corpus.items.find(e => e.text.startsWith(prefix)).text;
function Popup({ open, close, children }) {
  return <Modal open={open} onClose={close}><Box role="dialog" sx={{ position: 'absolute', left: '10%', top: '10%', width: '80%', maxHeight: '80vh', overflow: 'auto', bgcolor: 'background.paper', p: 2 }}>{children}<Button onClick={close}>Cancel</Button></Box></Modal>;
}
function Sleeves() {
  const [task, setTask] = useState('Idle'), [active, setActive] = useState('Idle'), [modal, setModal] = useState(''), [progress, setProgress] = useState('12.50');
  window.advancedFixture.update = setProgress;
  return <><Typography variant="h4">Sleeves</Typography><Typography>Sleeves can be used to perform different tasks simultaneously.</Typography>
    <Button onClick={() => setModal('faq')}>FAQ</Button><Button onClick={() => setModal('stats')}>More Stats</Button>
    <Select id="task" value={task} onChange={e => { setTask(e.target.value); window.selectedTask = e.target.value; }}>
      {['Idle', 'Shock Recovery', 'Synchronize', 'Perform Bladeburner Actions'].map(x => <MenuItem key={x} value={x}>{x}</MenuItem>)}
    </Select><Button onClick={() => { setActive(task); window.submittedTask = task; }}>Set Task</Button>
    <Typography id="work-desc" whiteSpace="pre-wrap">{active === 'Perform Bladeburner Actions' ? `This sleeve is currently attempting to perform Tracking.\n\nEstimated success chance: 65.1% ~ 78.9%\n\nTasks Completed: 1,234\n \nProgress: ${progress}%` : 'This sleeve is currently idle.'}</Typography>
    <Tooltip title={<Typography>You must reduce the sleeve shock to 0. The current shock is 12.500.</Typography>}><span id="augment-tip"><Button disabled>Manage Augmentations</Button></span></Tooltip>
    <Popup open={!!modal} close={() => setModal('')}>{modal === 'faq' ? <><Typography variant="h5">How do Duplicate Sleeves work?</Typography><Typography>{text('Duplicate Sleeves are')}</Typography></> : <><Typography variant="h5">Stats:</Typography><Typography>{'Hacking: '}{'123.456'}</Typography><Typography>{'Hacking Level multiplier: '}{'1.250'}</Typography></>}</Popup>
  </>;
}
function Covenant() {
  const [open, setOpen] = useState(true), [memory, setMemory] = useState('7');
  return <><Typography variant="h4">The Covenant</Typography><Popup open={open} close={() => setOpen(false)}>
    <Typography>{text('Purchase an additional Sleeve.')}{' '}{5}{' from '}{'The Covenant'}{'.'}</Typography>
    <Button disabled>{'Purchase - '}{'$100.000t'}</Button><Typography>{text('You can also purchase upgrades')}</Typography>
    <Typography>{'Upgrade Memory of Sleeve '}{0}</Typography><Typography>Amount of memory to purchase (must be an integer):</Typography>
    <TextField id="memory" type="number" value={memory} onChange={e => setMemory(e.target.value)} />
    <Button id="purchase-memory" onClick={() => { window.memoryAmount = memory; }}>Purchase</Button>
  </Popup></>;
}
function Stanek() {
  const [modal, setModal] = useState(''), [value, setValue] = useState('+12.500');
  window.advancedFixture.update = setValue;
  return <><Typography variant="h4">Stanek's Gift</Typography><Button id="stanek-info" onClick={() => setModal('info')}>Info</Button>
    <Typography>Summary of active fragments:</Typography><Typography id="effect">{`${value}% hack() power`}</Typography>
    <Typography>{'root [X, Y] '}{'[1, 2]'}</Typography><Typography>{'ID: '}{5}</Typography>
    <Button onClick={() => setModal('clear')}>Clear grid</Button><Button onClick={() => { window.fragmentAction = { x: 1, y: 2, rotation: 3 }; }}>Delete</Button>
    <Popup open={!!modal} close={() => setModal('')}>{modal === 'info' ? <Typography id="stanek-help">{text("Stanek's Gift is a powerful")}</Typography> : <><Typography>WARNING : This will remove all active fragment from the grid.</Typography><Typography>All cumulated charges will be lost.</Typography></>}</Popup>
  </>;
}
function Go() {
  const [tab, setTab] = useState(0), [modal, setModal] = useState(''), [opponent, setOpponent] = useState('No AI'), [score, setScore] = useState('12');
  window.advancedFixture.update = setScore;
  return <><Typography variant="h4">IPvGO Subnet</Typography><Tabs value={tab} onChange={(_, v) => setTab(v)}>{['Status', 'History', 'How to Play'].map(x => <Tab key={x} label={x} />)}</Tabs>
    {tab === 0 ? <><Typography>{'Subnet owner: '}{opponent}</Typography><Typography id="score">{`Score: Black: ${score} White: 6.5`}</Typography><Button onClick={() => setModal('search')}>Find New Subnet</Button><Button onClick={() => { window.goAction = 'passTurn'; }}>Pass Turn (Black)</Button><Button onClick={() => setModal('score')}>View Final Score</Button></> : tab === 1 ? <><Typography>Faction Stats:</Typography><Typography>{'Captured nodes: '}{'1,234'}</Typography></> : <><Typography variant="h5">How to take over IPvGO Subnets</Typography><Typography id="go-rules">{text('Each turn you place a router')}</Typography><Typography>{text('* You cannot repeat previous board states.')}</Typography><a href="https://example.com/guide" id="guide">The Way to Go interactive guide.</a></>}
    <Popup open={!!modal} close={() => setModal('')}>{modal === 'search' ? <><Typography variant="h5">IPvGO Subnet Search</Typography><Select id="opponent" value={opponent} onChange={e => setOpponent(e.target.value)}>{corpus.dynamic.publicOpponents.map(o => <MenuItem key={o.value} value={o.value}>{corpus.dynamic.items.find(e => e.text.startsWith(o.value + ' (')).text}</MenuItem>)}</Select><Button id="search-subnet" onClick={() => { window.goSelection = { opponent, size: 5 }; setModal(''); }}>Search for Subnet</Button></> : <><Typography variant="h4">Game complete!</Typography><Typography>{`Winner: ${opponent}`}</Typography><Typography>{'Subnet power gained: '}{'12.345'}</Typography><Typography>{text('IPvGO uses one of the oldest')}</Typography></>}</Popup>
  </>;
}
function App() {
  const [page, setPage] = useState('Sleeves');
  window.advancedFixture = { setPage };
  return <ThemeProvider theme={theme}><Box className="MuiDrawer-root" sx={{ width: 210, position: 'fixed' }}>{['Sleeves', "Stanek's Gift", 'IPvGO Subnet', 'The Covenant'].map(x => <Button key={x} className={page === x ? 'fixture-active' : ''} onClick={() => setPage(x)}>{x}</Button>)}<Typography>LOCAL UI FIXTURE</Typography></Box>
    <Box component="main" sx={{ ml: '230px', p: 1 }}>{page === 'Sleeves' ? <Sleeves /> : page === "Stanek's Gift" ? <Stanek /> : page === 'IPvGO Subnet' ? <Go /> : <Covenant />}<pre id="api">{'ns.sleeve.setToBladeburnerAction(0, "Tracking"); ns.stanek.chargeFragment(1, 2); ns.go.makeMove(1, 2)'}</pre><span className="katex">sqrt(power) * 1.1</span></Box>
  </ThemeProvider>;
}
createRoot(document.getElementById('root')).render(<App />);
