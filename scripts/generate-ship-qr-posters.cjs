const fs = require('fs')
const path = require('path')
const QRCode = require('qrcode')

const posters = [
  {
    fileName: 'qr-crown.svg',
    ship: 'NORDIC CROWN',
    url: 'https://www.handoverpro.dk/adgang/crown?code=CROWN26',
    code: 'CROWN26',
  },
  {
    fileName: 'qr-pearl.svg',
    ship: 'NORDIC PEARL',
    url: 'https://www.handoverpro.dk/adgang/pearl?code=PEARL26',
    code: 'PEARL26',
  },
]

async function createPoster({ fileName, ship, url, code }) {
  const qrBuffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: 800,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
  const qrData = qrBuffer.toString('base64')
  const pngFileName = fileName.replace('.svg', '.png')

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1300" viewBox="0 0 1000 1300">
  <rect width="1000" height="1300" fill="#ffffff"/>
  <text x="500" y="95" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="700" fill="#064e4c">HANDOVERPRO</text>
  <text x="500" y="155" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" letter-spacing="5" fill="#347f7a">${ship}</text>
  <image href="data:image/png;base64,${qrData}" x="100" y="200" width="800" height="800"/>
  <text x="500" y="1065" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" fill="#4b5563">Scan QR-koden, og tryk OK</text>
  <rect x="210" y="1105" width="580" height="115" rx="22" fill="#e7f1ef" stroke="#347f7a" stroke-width="3"/>
  <text x="500" y="1182" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="700" letter-spacing="8" fill="#064e4c">${code}</text>
  <text x="500" y="1260" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#6b7280">Enheden husker adgangen i 6 måneder</text>
</svg>
`

  fs.writeFileSync(path.join(process.cwd(), 'public', fileName), svg)
  fs.writeFileSync(path.join(process.cwd(), 'public', pngFileName), qrBuffer)
}

Promise.all(posters.map(createPoster)).catch((error) => {
  console.error(error)
  process.exitCode = 1
})
