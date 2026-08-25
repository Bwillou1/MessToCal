/**
 * MessToCal - Zero-Server Client-Side Cryptography & Local Vault
 * Provides AES-GCM 256-bit Encryption with 4-Digit PIN and Local Host Profile Storage
 * 100% In-Browser - NO server involved, impossible for crawlers to read without PIN
 */

const CryptoVault = (function() {

  // Convert buffer to hex string
  function bufToHex(buf) {
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Convert hex string to Uint8Array
  function hexToBuf(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Derives an AES-GCM 256-bit key from a 4-digit PIN and salt via PBKDF2
   */
  async function deriveKeyFromPin(pin, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts event data client-side with a 4-digit PIN
   */
  async function encryptEvent(eventData, pin) {
    if (!pin || pin.length < 4) {
      throw new Error("Le mot de passe doit comporter au moins 4 chiffres.");
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKeyFromPin(pin, salt);

    const payload = JSON.stringify({
      t: eventData.title || '',
      sd: eventData.startDate || '',
      st: eventData.startTime || '12:00',
      ed: eventData.endDate || eventData.startDate || '',
      et: eventData.endTime || '18:00',
      l: eventData.location || '',
      th: eventData.theme || '',
      f: eventData.foodInfo || '',
      o: eventData.organizer || '',
      gl: eventData.giftListUrl || '',
      fb: eventData.facebookLink || '',
      n: eventData.notes || ''
    });

    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      enc.encode(payload)
    );

    return {
      c: bufToHex(ciphertext),
      s: bufToHex(salt),
      iv: bufToHex(iv)
    };
  }

  /**
   * Decrypts ciphertext with 4-digit PIN client-side
   */
  async function decryptEvent(cipherHex, saltHex, ivHex, pin) {
    try {
      const salt = hexToBuf(saltHex);
      const iv = hexToBuf(ivHex);
      const ciphertext = hexToBuf(cipherHex);

      const key = await deriveKeyFromPin(pin, salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      const jsonStr = dec.decode(decrypted);
      const data = JSON.parse(jsonStr);

      return {
        title: data.t || '',
        startDate: data.sd || '',
        startTime: data.st || '12:00',
        endDate: data.ed || data.sd || '',
        endTime: data.et || '18:00',
        location: data.l || '',
        theme: data.th || '',
        foodInfo: data.f || '',
        organizer: data.o || '',
        giftListUrl: data.gl || '',
        facebookLink: data.fb || '',
        notes: data.n || '',
        rawText: `Événement déverrouillé : ${data.t}`
      };
    } catch (err) {
      throw new Error("Mot de passe incorrect ou données corrompues.");
    }
  }

  /**
   * Generates encrypted share URL with PIN protection
   */
  async function generateEncryptedShareUrl(eventData, pin) {
    const enc = await encryptEvent(eventData, pin);
    const baseUrl = window.location.href.split('#')[0];
    return `${baseUrl}#enc=${enc.c}&s=${enc.s}&iv=${enc.iv}`;
  }

  /**
   * Checks if URL contains encrypted payload
   */
  function parseEncryptedParams() {
    const hash = window.location.hash;
    if (!hash || !hash.includes('#enc=')) return null;

    try {
      const params = new URLSearchParams(hash.substring(1));
      const c = params.get('enc');
      const s = params.get('s');
      const iv = params.get('iv');

      if (c && s && iv) {
        return { c, s, iv };
      }
    } catch (e) {
      console.warn("Encrypted params parse error", e);
    }
    return null;
  }

  /**
   * Local Host Profile Storage (Name, Address, Phone, Default times)
   */
  function saveHostProfile(profile) {
    try {
      localStorage.setItem('messtocal-host-profile', JSON.stringify(profile));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getHostProfile() {
    try {
      const data = localStorage.getItem('messtocal-host-profile');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  return {
    encryptEvent,
    decryptEvent,
    generateEncryptedShareUrl,
    parseEncryptedParams,
    saveHostProfile,
    getHostProfile
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CryptoVault;
}
