// AlertManager + DialogBox nesting from pinned v3.0.1. Callbacks are local only.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Modal, Box, Typography, IconButton, Button } from '@mui/material';
import documentation from './fixtures/documentation-v3.0.1.json';
export const installedNames = ['Artificial Synaptic Potentiation', 'Embedded Netburner Module', 'Neurotrainer II', 'CRTX42-AA Gene Modification', 'Social Negotiation Assistant (S.N.A)', 'DataJack', 'Neural-Retention Enhancement', 'Cranial Signal Processors - Gen III', 'NeuroFlux Governor - 1', 'NutriGen Implant', 'Hacknet Node NIC Architecture Neural-Upload', 'Hacknet Node Cache Architecture Neural-Upload'];
const receipt = (names = installedNames) => 'You slowly drift to sleep as scientists put you under in order to install the following Augmentations:\n' + names.map(n => n + '\n').join('') + '\nYou wake up in your home...you feel different...';
const theme = createTheme({ palette: { mode: 'dark', primary: { main: '#00ff00' }, text: { primary: '#00ff00' } }, typography: { fontFamily: 'monospace', fontSize: 14 } });
function App() {
  const [open, setOpen] = useState(true), [message, setMessage] = useState(receipt()), [route, setRoute] = useState('Terminal'), [value, setValue] = useState('17.500k');
  window.dialogFixture = {
    show: text => { setMessage(text); setOpen(true); }, setRoute, setValue,
    install: names => { setMessage(receipt(names)); setOpen(true); },
    close: () => setOpen(false), original: receipt(), names: installedNames,
  };
  let content = message;
  if (message === 'company') content = <>You finished working for {'MegaCorp'}<br />You have <span>{value}</span> reputation with them.</>;
  if (message === 'faction') content = <>You worked for {'CyberSec'}.<br />They now have a total of <span>{value}</span> reputation.</>;
  if (message === 'grafted') content = <>You've finished grafting {'Neurotrainer II'}.<br />The augmentation has been applied to your body{', but you feel a bit off.'}</>;
  if (message === 'cancelled') content = <>You cancelled the grafting of {'Neurotrainer II'}.<br />Your money was not returned to you.</>;
  if (message === 'sourcefile') content = <>You received a Source-File for destroying a BitNode!<br /><br />{'Source-File 1: Source Genesis'}<br /><br /><Typography>{documentation.items.find(e => e.sf === 1 && e.text.startsWith('This Source-File')).text}</Typography><code>ns.hack('n00dles')</code></>;
  return <ThemeProvider theme={theme}>
    <aside className="MuiDrawer-root"><Button>{route}</Button></aside><main><h4>{route}</h4><div id="terminal"><p>{receipt()}</p></div></main>
    <Modal open={open} onClose={() => setOpen(false)}><Box role="dialog" sx={{ position: 'absolute', left: '4%', top: 50, width: '92%', boxSizing: 'border-box', p: 2, border: '2px solid #0f0', boxShadow: '0 0 12px #0f0', bgcolor: '#000', maxHeight: '80vh', overflow: 'auto' }}>
      <IconButton aria-label="Close popup" onClick={() => setOpen(false)} sx={{ position: 'absolute', right: 0, top: 0, p: 0, color: '#0f0' }}>×</IconButton>
      <Box sx={{ overflowWrap: 'break-word', whiteSpace: 'pre-line' }}><Typography component="span" id="alert-outer">{typeof content === 'string' && !['company', 'faction', 'grafted', 'cancelled', 'sourcefile'].includes(content) ? <Typography component="span" id="alert-message" style={{ whiteSpace: 'pre-wrap' }}>{content}</Typography> : content}</Typography></Box>
    </Box></Modal>
  </ThemeProvider>;
}
createRoot(document.getElementById('root')).render(<App />);
