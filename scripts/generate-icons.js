import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const standardSvgPath = path.join(publicDir, 'icon.svg');
const standardSvg = fs.readFileSync(standardSvgPath, 'utf-8');

// Create Maskable SVG where background is full bleed (no rx rounded corners)
// and inner content is scaled inside the 80% safe zone
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="45%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#FFFBEB"/>
    </linearGradient>

    <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>

    <linearGradient id="plusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6"/>
      <stop offset="100%" stop-color="#1D4ED8"/>
    </linearGradient>

    <linearGradient id="carryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>

    <filter id="dropShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#78350F" flood-opacity="0.32"/>
    </filter>
    <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#991B1B" flood-opacity="0.35"/>
    </filter>
    <filter id="starShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#B45309" flood-opacity="0.4"/>
    </filter>
  </defs>

  <!-- Full-bleed background for maskable icon safe zone -->
  <rect width="512" height="512" fill="url(#bgGrad)"/>

  <!-- Scaled content inside 80% safe zone (center 256, 256) -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <circle cx="100" cy="90" r="14" fill="#FFFFFF" opacity="0.35"/>
    <circle cx="430" cy="110" r="10" fill="#FFFFFF" opacity="0.4"/>
    <circle cx="420" cy="410" r="18" fill="#FFFFFF" opacity="0.25"/>
    <circle cx="90" cy="400" r="12" fill="#FFFFFF" opacity="0.3"/>

    <!-- Main Math Adventure Card -->
    <g filter="url(#dropShadow)">
      <rect x="76" y="70" width="360" height="372" rx="42" fill="url(#cardGrad)" stroke="#FDE68A" stroke-width="4"/>

      <!-- Card Top Header Ribbon -->
      <path d="M 76 112 C 76 88.8 94.8 70 118 70 L 394 70 C 417.2 70 436 88.8 436 112 L 436 128 L 76 128 Z" fill="#FEF3C7"/>

      <!-- Header Dots -->
      <circle cx="120" cy="99" r="6" fill="#F59E0B" opacity="0.6"/>
      <circle cx="145" cy="99" r="6" fill="#F59E0B" opacity="0.6"/>
      <circle cx="170" cy="99" r="6" fill="#F59E0B" opacity="0.6"/>

      <!-- Mini Star in Header -->
      <g transform="translate(390, 99) scale(0.9)" filter="url(#starShadow)">
        <polygon points="0,-12 3.7,-3.7 12.6,-2.5 5.8,3.5 7.8,12.2 0,7.6 -7.8,12.2 -5.8,3.5 -12.6,-2.5 -3.7,-3.7" fill="url(#starGrad)"/>
      </g>

      <!-- Carry Bubble Badge (+1) -->
      <g transform="translate(196, 156)" filter="url(#badgeShadow)">
        <circle cx="0" cy="0" r="22" fill="url(#carryGrad)"/>
        <text x="0" y="7" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Noto Sans TC', Fredoka, sans-serif" font-weight="900" font-size="20" fill="#FFFFFF">+1</text>
      </g>

      <!-- Row 1: 3 8 -->
      <text x="196" y="228" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Fredoka', 'Noto Sans TC', sans-serif" font-weight="800" font-size="54" fill="#1E293B">3</text>
      <text x="312" y="228" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Fredoka', 'Noto Sans TC', sans-serif" font-weight="800" font-size="54" fill="#1E293B">8</text>

      <!-- Row 2: + 2 7 -->
      <g transform="translate(124, 280)">
        <rect x="-6" y="-18" width="12" height="36" rx="6" fill="url(#plusGrad)"/>
        <rect x="-18" y="-6" width="36" height="12" rx="6" fill="url(#plusGrad)"/>
      </g>
      <text x="196" y="302" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Fredoka', 'Noto Sans TC', sans-serif" font-weight="800" font-size="54" fill="#1E293B">2</text>
      <text x="312" y="302" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Fredoka', 'Noto Sans TC', sans-serif" font-weight="800" font-size="54" fill="#1E293B">7</text>

      <!-- Divider Line -->
      <line x1="110" y1="324" x2="396" y2="324" stroke="#475569" stroke-width="6" stroke-linecap="round"/>

      <!-- Answer Row: 6 5 -->
      <text x="196" y="395" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Fredoka', 'Noto Sans TC', sans-serif" font-weight="900" font-size="62" fill="#16A34A">6</text>
      <text x="312" y="395" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Fredoka', 'Noto Sans TC', sans-serif" font-weight="900" font-size="62" fill="#16A34A">5</text>
    </g>

    <!-- Golden 3D Reward Star in bottom right -->
    <g transform="translate(400, 395) scale(1.6)" filter="url(#starShadow)">
      <polygon points="0,-18 5.5,-5.5 18.9,-3.7 8.7,5.2 11.7,18.3 0,11.4 -11.7,18.3 -8.7,5.2 -18.9,-3.7 -5.5,-5.5" fill="url(#starGrad)" stroke="#B45309" stroke-width="1.5"/>
      <circle cx="-4" cy="-4" r="3" fill="#FFFFFF" opacity="0.6"/>
    </g>
  </g>
</svg>`;

async function generate() {
  console.log('Generating PWA icons from SVG...');

  // 1. pwa-192x192.png (purpose: any)
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Generated pwa-192x192.png');

  // 2. pwa-512x512.png (purpose: any)
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Generated pwa-512x512.png');

  // 3. pwa-maskable-192x192.png (purpose: maskable)
  await sharp(Buffer.from(maskableSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-192x192.png'));
  console.log('Generated pwa-maskable-192x192.png');

  // 4. pwa-maskable-512x512.png (purpose: maskable)
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Generated pwa-maskable-512x512.png');

  // 5. apple-touch-icon.png (180x180)
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // 6. favicon.png (64x64)
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Generated favicon.png');

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
