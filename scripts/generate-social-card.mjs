import sharp from 'sharp';

const svg=`<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#10313a"/><stop offset="1" stop-color="#1d5363"/></linearGradient><radialGradient id="sun"><stop stop-color="#c18a55" stop-opacity=".52"/><stop offset="1" stop-color="#c18a55" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="url(#bg)"/><ellipse cx="1010" cy="80" rx="420" ry="260" fill="url(#sun)"/>
<circle cx="114" cy="114" r="38" fill="none" stroke="#d7a36b" stroke-width="2"/><path d="M114 83l8 22 23 9-23 8-8 23-8-23-23-8 23-9z" fill="#d7a36b"/>
<text x="112" y="280" fill="#fff" font-family="Arial,sans-serif" font-size="22" font-weight="700" letter-spacing="7">RESIDENCIAL</text>
<text x="108" y="372" fill="#fff" font-family="Georgia,serif" font-size="76">Estrela Dalva</text>
<path d="M112 415h92" stroke="#d7a36b" stroke-width="3"/>
<text x="112" y="478" fill="#f2e9dc" font-family="Arial,sans-serif" font-size="30">Praia dos Ingleses · Florianópolis/SC</text>
<text x="112" y="548" fill="#d8e2df" font-family="Arial,sans-serif" font-size="20" letter-spacing="2">HOSPEDAGEM EM SANTA CATARINA</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/og-residencial.png');
