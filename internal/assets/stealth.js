const sessionSeed = (typeof __pinchtab_seed !== 'undefined') ? __pinchtab_seed : 42;

const seededRandom = (function() {
  const cache = {};
  return function(seed) {
    if (cache[seed] !== undefined) return cache[seed];
    let t = (seed + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    cache[seed] = result;
    return result;
  };
})();

// webdriver: DO NOT override navigator.webdriver here.
// With --enable-automation=false (set in init.go), Chrome natively has webdriver=false.
// Any JS override triggers CreepJS lie detector (lieProps['Navigator.webdriver']).
// "Less is more" — the native false value passes all 3 CreepJS conditions:
//   (1) webdriver === undefined → false (it's false, not undefined)
//   (2) !!webdriver → false
//   (3) lieProps → false (no tampering)

delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

if (!window.chrome) { window.chrome = {}; }
if (!window.chrome.runtime) {
  window.chrome.runtime = {
    onConnect: undefined,
    onMessage: undefined
  };
}

const originalQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (parameters) => (
  parameters.name === 'notifications' ?
    Promise.resolve({ state: Notification.permission }) :
    originalQuery(parameters)
);

// Create a proper PluginArray that passes all three sannysoft checks:
//   1. navigator.plugins instanceof PluginArray
//   2. navigator.plugins.length > 0
//   3. navigator.plugins[0].toString() === '[object Plugin]'
(function() {
  const fakePlugins = [
    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer',             description: 'Portable Document Format' },
    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
    { name: 'Native Client',     filename: 'internal-nacl-plugin',             description: '' },
  ];

  function makePlugin(p) {
    let base = {};
    try { if (typeof Plugin !== 'undefined') base = Object.create(Plugin.prototype); } catch(e) {}
    Object.defineProperty(base, Symbol.toStringTag, { value: 'Plugin', configurable: false });
    ['name','filename','description'].forEach(function(k) {
      Object.defineProperty(base, k, { value: p[k], writable: false, enumerable: true, configurable: false });
    });
    Object.defineProperty(base, 'length',    { value: 1,            writable: false, enumerable: true });
    Object.defineProperty(base, 'item',      { value: function() { return null; }, writable: false });
    Object.defineProperty(base, 'namedItem', { value: function() { return null; }, writable: false });
    return base;
  }

  const realProto = Object.getPrototypeOf(navigator.plugins);
  const arr = Object.create(realProto);
  Object.defineProperty(arr, 'length',    { value: fakePlugins.length, writable: false, enumerable: true });
  Object.defineProperty(arr, 'item',      { value: function(i) { return arr[i] || null; }, writable: false });
  Object.defineProperty(arr, 'namedItem', { value: function(n) {
    for (var i = 0; i < fakePlugins.length; i++) { if (arr[i] && arr[i].name === n) return arr[i]; }
    return null;
  }, writable: false });
  Object.defineProperty(arr, 'refresh',   { value: function() {}, writable: false });

  fakePlugins.forEach(function(p, i) {
    var plugin = makePlugin(p);
    Object.defineProperty(arr, i,     { value: plugin, writable: false, enumerable: true });
    Object.defineProperty(arr, p.name, { value: plugin, writable: false, enumerable: false });
  });

  Object.defineProperty(navigator, 'plugins', { get: function() { return arr; }, configurable: true });
})();

Object.defineProperty(navigator, 'languages', {
  get: () => ['en-US', 'en'],
});

// Derive platform from user agent to avoid mismatch detection
(function() {
  const ua = navigator.userAgent || '';
  let platform = 'Win32';
  if (ua.includes('Macintosh') || ua.includes('Mac OS X')) {
    platform = 'MacIntel';
  } else if (ua.includes('Linux')) {
    platform = ua.includes('x86_64') || ua.includes('amd64') ? 'Linux x86_64' : 'Linux';
  } else if (ua.includes('Windows')) {
    platform = 'Win32';
  }
  Object.defineProperty(navigator, 'platform', {
    get: () => platform,
    configurable: true
  });
})();

Object.defineProperty(navigator.connection || {}, 'rtt', {
  get: () => 100,
});

// Fix noDownlinkMax: define on prototype so it exists as a proper API property.
// Headless Chrome's NetworkInformation prototype lacks downlinkMax entirely.
// Real Chrome on WiFi reports Infinity.
if (navigator.connection) {
  try {
    const connProto = Object.getPrototypeOf(navigator.connection);
    if (!connProto.hasOwnProperty('downlinkMax')) {
      Object.defineProperty(connProto, 'downlinkMax', {
        get: () => Infinity,
        configurable: true,
        enumerable: true
      });
    }
  } catch(e) {}
}

const stealthLevel = (typeof __pinchtab_stealth_level !== 'undefined') ? __pinchtab_stealth_level : 'light';

if (stealthLevel === 'full') {

// Fix screen dimensions: headless Chrome reports screen as 800×600 even in new mode.
// Pool entries are CSS pixel resolutions for real Mac displays at DPR=2:
//   1440×900  → 2880×1800 physical (MacBook Pro 15" Retina)
//   1920×1080 → 3840×2160 physical (External 4K @2x)
//   2560×1440 → 5120×2880 physical (iMac 27" 5K / Apple Studio Display)
// On non-Mac (DPR=1), these are also valid common monitor resolutions.
// Screen must be STRICTLY larger than window (real monitors > browser windows).
(function() {
  const isMac = navigator.platform === 'MacIntel';
  const dpr = isMac ? 2 : 1;
  // Only include resolutions that correspond to real displays at this DPR.
  const screens = isMac ? [
    { w: 1440, h: 900 },   // MacBook Pro 15" Retina (2880×1800 physical)
    { w: 1920, h: 1080 },  // External 4K display @2x (3840×2160 physical)
    { w: 2560, h: 1440 },  // iMac 27" 5K / Apple Studio Display (5120×2880 physical)
  ] : [
    { w: 1920, h: 1080 },  // Full HD
    { w: 2560, h: 1440 },  // QHD
    { w: 3840, h: 2160 },  // 4K
  ];
  const ow = window.outerWidth || 1280;
  const oh = window.outerHeight || 800;
  const valid = screens.filter(s => s.w > ow && s.h > oh);
  const pool = valid.length > 0 ? valid : [screens[screens.length - 1]];
  const picked = pool[Math.floor(seededRandom(sessionSeed + 9999) * pool.length)];
  const sw = picked.w;
  const sh = picked.h;

  const overrides = {
    width: sw, height: sh, availWidth: sw, availHeight: sh - 25,
    colorDepth: 24, pixelDepth: 24
  };
  // Override on Screen.prototype, NOT on the screen instance.
  // Real Chrome inherits screen properties from Screen.prototype — there are no
  // own-property descriptors on the screen object. Overriding on the instance is
  // detectable via Object.getOwnPropertyDescriptor(screen, 'width') !== undefined.
  // Prototype-level overrides are invisible to this check.
  const screenProto = Object.getPrototypeOf(window.screen);
  for (const [key, value] of Object.entries(overrides)) {
    try {
      Object.defineProperty(screenProto, key, { get: () => value, configurable: true });
    } catch(e) {}
  }
  // devicePixelRatio and screenY: Chrome defines these as OWN properties on window,
  // so prototype overrides get shadowed. Delete the own property first, then set on
  // prototype so getOwnPropertyDescriptor(window, 'devicePixelRatio') returns undefined.
  // If delete fails (non-configurable), fall back to own-property override.
  const winProto = Object.getPrototypeOf(window);
  for (const [prop, val] of [['devicePixelRatio', dpr], ['screenY', 25]]) {
    try {
      delete window[prop];
      Object.defineProperty(winProto, prop, { get: () => val, configurable: true });
    } catch(e) {
      try { Object.defineProperty(window, prop, { get: () => val, configurable: true }); } catch(e2) {}
    }
  }
})();

// Fix hasKnownBgColor: headless Chrome resolves CSS system colors like 'ActiveText'
// to hardcoded defaults instead of querying the OS theme.
// Override getComputedStyle to return realistic values for system color keywords.
(function() {
  const systemColorMap = {
    'activetext': 'rgb(0, 102, 204)',
    'accentcolor': 'rgb(0, 122, 255)',
    'accentcolortext': 'rgb(255, 255, 255)',
  };
  const colorProps = ['color', 'backgroundColor', 'borderColor'];
  const origGCS = window.getComputedStyle;
  window.getComputedStyle = function(element, pseudoElt) {
    const style = origGCS.call(this, element, pseudoElt);
    if (element && element.style) {
      for (const prop of colorProps) {
        const inlineVal = element.style.getPropertyValue(prop === 'backgroundColor' ? 'background-color' : prop === 'borderColor' ? 'border-color' : prop);
        const key = inlineVal ? inlineVal.toLowerCase().trim() : '';
        if (systemColorMap[key]) {
          try {
            Object.defineProperty(style, prop, {
              get: () => systemColorMap[key],
              configurable: true,
            });
          } catch(e) {}
        }
      }
    }
    return style;
  };
  // Preserve native toString to avoid lie detection
  window.getComputedStyle.toString = origGCS.toString.bind(origGCS);
  Object.defineProperty(window.getComputedStyle, 'name', { value: 'getComputedStyle' });
  Object.defineProperty(window.getComputedStyle, 'length', { value: origGCS.length });
})();

// WebGL: DO NOT spoof UNMASKED_RENDERER/VENDOR here.
// The subprocess architecture (BRIDGE_ONLY=1) gives Chrome real Metal GPU access.
// Spoofing to "Intel Iris" caused hasBadWebGL detection in CreepJS because
// the page reported "Intel Iris" but the Service Worker reported real "Apple M2"
// (workers access WebGL via OffscreenCanvas, bypassing our page-level spoof).

const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
const originalToBlob = HTMLCanvasElement.prototype.toBlob;
const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

HTMLCanvasElement.prototype.toDataURL = function(...args) {
  const context = this.getContext('2d');
  if (context && this.width > 0 && this.height > 0) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, this.width, this.height);
    const pixelCount = Math.min(10, Math.floor(imageData.data.length / 400));
    for (let i = 0; i < pixelCount; i++) {
      const idx = Math.floor(seededRandom(sessionSeed + i) * (imageData.data.length / 4)) * 4;
      // Skip fully transparent pixels — modifying them creates detectable artifacts
      if (imageData.data[idx] === 0 && imageData.data[idx+1] === 0 && 
          imageData.data[idx+2] === 0 && imageData.data[idx+3] === 0) continue;
      if (imageData.data[idx] < 255) imageData.data[idx] += 1;
      if (imageData.data[idx + 1] < 255) imageData.data[idx + 1] += 1;
    }
    tempCtx.putImageData(imageData, 0, 0);
    return originalToDataURL.apply(tempCanvas, args);
  }
  return originalToDataURL.apply(this, args);
};

HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
  const dataURL = this.toDataURL(type, quality);
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){ u8arr[n] = bstr.charCodeAt(n); }
  const blob = new Blob([u8arr], {type: mime});
  setTimeout(() => callback(blob), 5 + seededRandom(sessionSeed + 1000) * 10);
};

// Canvas noise consistency: both toDataURL and getImageData must use seeded random.
// Using Math.random() for getImageData while toDataURL uses seededRandom creates a
// detectable mismatch — a detector calling both on the same canvas sees different noise.
CanvasRenderingContext2D.prototype.getImageData = function(...args) {
  const imageData = originalGetImageData.apply(this, args);
  const pixelCount = imageData.data.length / 4;
  const noisyPixels = Math.min(10, Math.floor(pixelCount * 0.0001));
  for (let i = 0; i < noisyPixels; i++) {
    const pixelIndex = Math.floor(seededRandom(sessionSeed + 500 + i) * pixelCount) * 4;
    // Skip fully transparent pixels
    if (imageData.data[pixelIndex] === 0 && imageData.data[pixelIndex+1] === 0 && 
        imageData.data[pixelIndex+2] === 0 && imageData.data[pixelIndex+3] === 0) continue;
    const direction = seededRandom(sessionSeed + 600 + i) > 0.5 ? 1 : -1;
    imageData.data[pixelIndex] = Math.min(255, Math.max(0, imageData.data[pixelIndex] + direction));
  }
  return imageData;
};

const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
CanvasRenderingContext2D.prototype.measureText = function(text) {
  const metrics = originalMeasureText.apply(this, arguments);
  const noise = 0.0001 + (seededRandom(sessionSeed + text.length) * 0.0002);
  return new Proxy(metrics, {
    get(target, prop) {
      if (prop === 'width') return target.width * (1 + noise);
      return target[prop];
    }
  });
};

if (window.RTCPeerConnection) {
  const originalRTCPeerConnection = window.RTCPeerConnection;
  window.RTCPeerConnection = function(config, constraints) {
    if (config && config.iceServers) config.iceTransportPolicy = 'relay';
    return new originalRTCPeerConnection(config, constraints);
  };
  window.RTCPeerConnection.prototype = originalRTCPeerConnection.prototype;
}

}

const __pinchtab_origGetTimezoneOffset = Date.prototype.getTimezoneOffset;
Object.defineProperty(Date.prototype, 'getTimezoneOffset', {
  value: function() {
    return window.__pinchtab_timezone || __pinchtab_origGetTimezoneOffset.call(this);
  }
});

// hardwareConcurrency / deviceMemory: DO NOT spoof.
// The spoofed values are inconsistent with the real values reported by Service Workers
// (which access navigator.hardwareConcurrency directly, bypassing page-level overrides).
// CreepJS detects this mismatch as "hasWorkerViolation". The real hardware values are
// fine — they don't identify headless Chrome, they identify the machine.
