import dictionary from '../translations/zh-CN.json';
import { install } from './runtime.js';

install(dictionary, {
  getValue: (key, fallback) => typeof GM_getValue === 'function' ? GM_getValue(key, fallback) : fallback,
  setValue: (key, value) => { if (typeof GM_setValue === 'function') GM_setValue(key, value); },
  registerMenu: typeof GM_registerMenuCommand === 'function' ? GM_registerMenuCommand : undefined,
  unregisterMenu: typeof GM_unregisterMenuCommand === 'function' ? GM_unregisterMenuCommand : undefined,
});
