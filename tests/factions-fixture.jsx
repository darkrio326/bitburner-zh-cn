// React/MUI replay of pinned FactionRoot/Info/GangCampaign; actions only record local callbacks.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Typography, Button, Paper, Tooltip, Modal, TextField } from '@mui/material';
import corpus from './fixtures/factions-v3.0.1.json';
import augmentations from './fixtures/augmentation-text-v3.0.1.json';
const text = prefix => corpus.items.find(e => e.text.startsWith(prefix)).text;
const theme = createTheme({ palette: { mode: 'dark', primary: { main: '#00e000' } }, typography: { fontFamily: 'monospace', button: { textTransform: 'none' } } });
const clue = corpus.items.filter(e => e.retained === 'Encoded in-game clue' && e.source.path.includes('Covenant')).map(e => e.text);
const gang = ' is a HACKING gang and its members will have different tasks than in COMBAT gangs. Compared to combat gangs, progression with a hacking gang is slower but more straightforward as territory warfare is not as important.';
function App() {
  const [name, setName] = useState('The Black Hand'), [page, setPage] = useState('faction'), [modal, setModal] = useState(''), [rep, setRep] = useState('1.125'), [amount, setAmount] = useState(''), [donation, setDonation] = useState(false);
  window.factionFixture = { setName, setPage, setModal, setRep, setDonation };
  const option = (button, description, action) => <Paper sx={{ my: 1, p: 1 }}><Button onClick={action}>{button}</Button><Typography>{description}</Typography></Paper>;
  return <ThemeProvider theme={theme}>
    <Box className="MuiDrawer-root" sx={{ position: 'fixed', width: 230 }}><Button onClick={() => setPage('faction')}>Factions</Button><Button onClick={() => setPage('stats')}>Stats</Button></Box>
    <Box component="main" sx={{ ml: '240px', p: 1 }}>
      <Button onClick={() => setPage('list')}>Back</Button>
      <Typography variant="h4">{page === 'stats' ? 'Stats' : page === 'list' ? 'Factions' : page === 'location' ? 'ECorp' : name}</Typography>
      {page === 'location' ? <><Button>Return to World</Button><Typography>Apply for Software Engineering Job</Typography></> : page === 'stats' ? <Typography>General</Typography> : page === 'list' ? <Typography component="i" id="rumor">The {'NSA'} would like to have a word with you once you're ready.</Typography> : <>
        <Typography id="faction-intro" sx={{ whiteSpace: 'pre-wrap' }}>{text('The world, so afraid')}<br /><br />{text('So much pain.')}</Typography>
        <Typography>-------------------------</Typography><Typography>{'Reputation: '}<span id="rep">{rep}</span></Typography><Typography>{'Favor: '}<span>0.000</span></Typography>
        <Typography variant="h5"><span aria-hidden="true">★</span> Special Campaign <Tooltip title={text('Some factions are developing')}><span id="campaign-help">ⓘ</span></Tooltip></Typography>
        {option(text('Execute the formation plan'), text('The tension between'), () => setModal('campaign'))}
        <Typography id="work-intro">{text('Perform work/carry')}{'\u00a0'}{text('Earning reputation will')}</Typography>
        {option('Hacking Contracts', text('Complete hacking contracts'), () => { window.factionAction = { faction: name, work: 'hacking' }; })}
        {option('Field Work', text('Carry out field missions'), () => { window.factionAction = { faction: name, work: 'field' }; })}
        {option('Security Work', text('Serve in a security detail'), () => { window.factionAction = { faction: name, work: 'security' }; })}
        <Paper sx={{ my: 1, p: 1 }}>{donation ? <><TextField id="donation" placeholder="Donation amount" value={amount} onChange={e => setAmount(e.target.value)} /><Button onClick={() => { window.donationAction = { faction: name, amount }; }}>donate</Button></> : <Typography id="donation-limit">Unlock donations at <span>150.000</span> favor with {name}</Typography>}</Paper>
        {option('Purchase Augmentations', text('As your reputation with this faction'), () => setModal('augmentation'))}
      </>}
    </Box>
    <Modal open={!!modal} onClose={() => setModal('')}><Box role="dialog" sx={{ position: 'absolute', left: '10%', top: '10%', width: '80%', maxHeight: '80vh', overflow: 'auto', bgcolor: 'background.paper', p: 2 }}>
      {modal === 'augmentation' ? <><Typography variant="h4">The Black Hand</Typography><Typography id="augmentation-info">{augmentations.entries.find(e => e.name === 'The Black Hand' && e.field === 'info').text}</Typography><Button onClick={() => { window.augmentationAction = 'The Black Hand'; }}>Purchase</Button></> : modal === 'gang' ? <>
        <Typography>{'Would you like to create a new Gang with '}{name}?<br /><br />{text('This will prevent you')}{name}.<br /><br />{name + gang}<br /><br />{text('Other than hacking')}</Typography>
        <Button onClick={() => { window.gangAction = name; }}>Create Gang</Button>
      </> : <Typography component="div" id="campaign-message">{text('Each time you attempt')}<br /><br />{clue.map((line, i) => <React.Fragment key={i}>{line}<br /></React.Fragment>)}</Typography>}
      <Button onClick={() => setModal('')}>Cancel</Button>
    </Box></Modal>
  </ThemeProvider>;
}
createRoot(document.getElementById('root')).render(<App />);
