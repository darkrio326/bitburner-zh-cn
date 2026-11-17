// Local React/MUI fixtures shaped after pinned v3.0.1 components.
// All purchase/copy handlers record local test values only, never game actions.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, Typography, Button, Box, Paper, Select, MenuItem, TextField, Dialog } from '@mui/material';
import corpus from './fixtures/supplement-v071-v3.0.1.json';
const formatInt = n => n.toLocaleString('en-US');
const Money = ({ money }) => <span className="fixture-money" data-value={money}>${formatInt(money)}</span>;
const hashes = /* HASH_RECORDS */[];
const receipt = corpus.texts.find(e => e.match === 'template').en;
const theme = createTheme({ palette: { mode: 'dark', primary: { main: '#00e878' } }, typography: { fontFamily: 'monospace' } });

function App() {
  const [route, setRoute] = useState('Hacknet'), [level, setLevel] = useState(2);
  const [order, setOrder] = useState('Market Order'), [position, setPosition] = useState('L'), [quantity, setQuantity] = useState('10');
  const [filter, setFilter] = useState(''), [placeholder, setPlaceholder] = useState('Filter augmentations'), [popup, setPopup] = useState(false), [purchased, setPurchased] = useState('Neurotrainer I');
  window.supplement = { setRoute, setLevel, setPlaceholder, setPurchased, setPopup };
  const stockAction = action => { window.supplementAction = { action, order, position, quantity, symbol: 'ECP' }; };
  return <ThemeProvider theme={theme}>
    <nav className="MuiDrawer-root" style={{ position: 'fixed', width: 220 }}>{['Hacknet', 'Stocks', 'Shop', 'Stats'].map(name => <Button key={name} onClick={() => setRoute(name)}>{name}</Button>)}</nav>
    <main style={{ marginLeft: 240, padding: 16 }}>
      <Typography variant="h4">{route === 'Hacknet' ? <>Hacknet {'Servers'}</> : route === 'Stocks' ? 'Stock Market' : route === 'Shop' ? <>Faction Augmentations - {'CyberSec'}</> : 'Stats'}</Typography>
      {route === 'Hacknet' && hashes.map(hash => <Paper key={hash.name} data-upgrade={hash.name} sx={{ p: 1, mb: 1 }}>
        <Typography data-name onClick={() => { window.supplementCopied = hash.name; }}>{hash.name}</Typography>
        <Typography>Cost: <span data-number>{40}</span>, Bought: <span data-number>{level}</span> times</Typography>
        <Typography data-desc>{hash.desc}</Typography>
        <Button onClick={() => { window.supplementAction = { action: 'hash', name: hash.name, level }; }}>Buy</Button>
        {hash.effect && <Typography data-effect>{hash.effect(level)}</Typography>}
      </Paper>)}
      {route === 'Stocks' && <>
        <Box display="flex" alignItems="center" id="stock-controls">
          <TextField inputProps={{ 'aria-label': 'quantity' }} placeholder="Quantity (Shares)" value={quantity} onChange={e => setQuantity(e.target.value)} />
          <Select inputProps={{ 'aria-label': 'position' }} value={position} onChange={e => setPosition(e.target.value)}><MenuItem value="L">Long</MenuItem><MenuItem value="S">Short</MenuItem></Select>
          <Select inputProps={{ 'aria-label': 'order type' }} value={order} onChange={e => setOrder(e.target.value)}>{corpus.selectors.map(e => <MenuItem key={e.value} value={e.value}>{e.value}</MenuItem>)}</Select>
          <Button onClick={() => stockAction('Buy')}>Buy</Button><Button onClick={() => stockAction('Sell')}>Sell</Button>
          <Button onClick={() => stockAction('Buy MAX')}>Buy MAX</Button><Button onClick={() => stockAction('Sell ALL')}>Sell ALL</Button>
        </Box>
        {corpus.orders.map(e => <Box key={e.value} display="flex" alignItems="center"><Typography data-order={e.value}>{e.value} - {'Long Position'} - <span data-number>12,345</span> @ <Money money={123.45} /></Typography><Button>Cancel Order</Button></Box>)}
      </>}
      {route === 'Shop' && <>
        <Box display="flex" gap={3}><Box display="flex"><Typography>Reputation: </Typography><span id="shop-rep">3.683k</span></Box><Box display="flex"><Typography>Favor: </Typography><span id="shop-favor">0.000</span></Box></Box>
        <TextField inputProps={{ 'aria-label': 'augmentation filter' }} placeholder={placeholder} value={filter} onChange={e => setFilter(e.target.value)} />
        <Box id="filtered-augs">{['Neurotrainer I', 'BitWire'].filter(name => name.toLowerCase().includes(filter.toLowerCase())).map(name => <Typography key={name}>{name}</Typography>)}</Box>
        <Button id="purchase-fixture" onClick={() => { window.supplementAction = { action: 'purchase', augmentation: purchased, filter }; setPopup(true); }}>Buy</Button>
      </>}
      {route === 'Stats' && <input id="unrelated-filter" placeholder="Filter augmentations" />}
      <div className="monaco-editor"><input id="editor-filter" placeholder="Filter augmentations" defaultValue="ns.hack('home')" /></div>
      <pre id="terminal">Market Order ns.hacknet.spendHashes('Sell for Money') Neurotrainer I</pre>
    </main>
    <Dialog open={popup} onClose={() => setPopup(false)} maxWidth="md">
      <Box sx={{ overflowWrap: 'break-word', whiteSpace: 'pre-line', p: 2 }}><Typography component="span" id="purchase-receipt">{receipt.replace('{augmentation}', purchased)}</Typography></Box>
      <Button onClick={() => setPopup(false)}>Close</Button>
    </Dialog>
  </ThemeProvider>;
}
createRoot(document.getElementById('root')).render(<App />);
