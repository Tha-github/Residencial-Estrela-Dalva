import sharp from 'sharp';

const svg=`<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b3346"/><stop offset="1" stop-color="#0f4f6d"/></linearGradient><radialGradient id="sun"><stop stop-color="#e3a27c" stop-opacity=".52"/><stop offset="1" stop-color="#e3a27c" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="url(#bg)"/><ellipse cx="1010" cy="80" rx="420" ry="260" fill="url(#sun)"/>
<circle cx="114" cy="114" r="38" fill="none" stroke="#e3a27c" stroke-width="2"/><path d="M114 83l8 22 23 9-23 8-8 23-8-23-23-8 23-9z" fill="#e3a27c"/>
<text x="112" y="280" fill="#fff" font-family="Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="7">RESIDENCIAL</text>
<text x="108" y="372" fill="#fff" font-family="Georgia,serif" font-size="76">Estrela Dalva</text>
<path d="M112 415h92" stroke="#e3a27c" stroke-width="3"/>
<text x="112" y="478" fill="#f2ebe0" font-family="Arial,sans-serif" font-size="30">Loft com mezanino · Ingleses, Florianópolis</text>
<text x="112" y="548" fill="#bcd5e1" font-family="Arial,sans-serif" font-size="20" letter-spacing="2">ATÉ 4 HÓSPEDES · 450 M DA PRAIA</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/og-residencial.png');
