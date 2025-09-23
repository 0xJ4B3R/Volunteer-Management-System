/**
 * Universal SHA-256 hashing function that works on all devices
 * Falls back to pure JavaScript implementation when crypto.subtle is not available
 */

// Pure JavaScript SHA-256 implementation
function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Hash(message: string): string {
  const msgBuffer = new TextEncoder().encode(message);
  
  // Pre-processing: adding a single 1 bit
  const msgLength = msgBuffer.length;
  const bitLength = msgLength * 8;
  
  // Create a new array with padding
  const paddedLength = Math.ceil((bitLength + 65) / 512) * 512;
  const paddedArray = new Uint8Array(paddedLength / 8);
  paddedArray.set(msgBuffer);
  paddedArray[msgLength] = 0x80;
  
  // Append original length as 64-bit big-endian
  const view = new DataView(paddedArray.buffer);
  view.setUint32(paddedArray.length - 4, bitLength, false);
  
  // SHA-256 constants
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  
  // Initial hash values
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  
  // Process message in 512-bit chunks
  for (let chunk = 0; chunk < paddedArray.length; chunk += 64) {
    const w = new Array(64);
    
    // Copy chunk into first 16 words
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(chunk + i * 4, false);
    }
    
    // Extend the first 16 words into the remaining 48 words
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    
    // Initialize hash value for this chunk
    let a = h0, b = h1, c = h2, d = h3;
    let e = h4, f = h5, g = h6, h = h7;
    
    // Main loop
    for (let i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[i] + w[i]) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    
    // Add this chunk's hash to result so far
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }
  
  // Produce the final hash value as a 256-bit number
  const hashArray = [h0, h1, h2, h3, h4, h5, h6, h7];
  return hashArray.map(h => h.toString(16).padStart(8, '0')).join('');
}

/**
 * Creates a SHA-256 hash of the given password
 * Uses crypto.subtle when available, falls back to pure JavaScript implementation
 * @param password - The password to hash
 * @returns Promise<string> - The SHA-256 hash as a hexadecimal string
 */
export const createHash = async (password: string): Promise<string> => {
  // First try crypto.subtle (works on desktop and modern mobile browsers)
  try {
    if (crypto && crypto.subtle && crypto.subtle.digest) {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }
  } catch (error) {
    console.warn('crypto.subtle failed, using JavaScript fallback:', error);
  }
  
  // Fallback to pure JavaScript SHA-256 implementation (works on all devices including Samsung browser)
  return sha256Hash(password);
};
