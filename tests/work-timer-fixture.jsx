import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { ThemeProvider, createTheme, Typography, Button, Box } from '@mui/material';

// Text-node structure and centered progress layout from v3.0.1
// src/ui/WorkInProgressRoot.tsx:497–517. Only simulated display values are used.
const theme = createTheme({ palette: { mode: 'dark' }, typography: { fontFamily: 'monospace' } });
function App() {
  const [route, setRoute] = useState('Work');
  const [times, setTimes] = useState({ elapsed: '2 hours 22 minutes 47 seconds', remaining: '1 minute 1 second' });
  window.workTimerFixture = {
    update(next) { flushSync(() => setTimes(next)); },
    route(next) { flushSync(() => setRoute(next)); },
  };
  return <ThemeProvider theme={theme}>
    <nav className="MuiDrawer-root"><Button className="fixture-active">{route}</Button></nav>
    <main>
      <Typography variant="h4">{route === 'Work' ? 'Work timer fixture' : 'Stats'}</Typography>
      <Box display="grid" sx={{ gridTemplateColumns: '1fr 1fr', justifyItems: 'center', textAlign: 'center' }}>
        <Typography id="elapsed">{times.elapsed} elapsed</Typography>
        <Typography id="remaining">{times.remaining} remaining</Typography>
      </Box>
      {route === 'Work' && <><Button id="stop" onClick={() => setRoute('Stats')}>Stop working</Button><Button>Do something else simultaneously</Button></>}
      <input aria-label="Untouched input" defaultValue="home ns.sleep(200)" />
      <pre id="terminal">{times.elapsed} elapsed</pre>
    </main>
  </ThemeProvider>;
}
createRoot(document.getElementById('root')).render(<App />);
