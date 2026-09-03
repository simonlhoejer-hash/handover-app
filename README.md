# HandoverPro

HandoverPro er Go Nordic Cruiselines interne arbejdsplatform til skriftlige overleveringer og registrering af madspild om bord på **Nordic Crown** og **Nordic Pearl**.

Produktionssiden findes på [handoverpro.dk](https://handoverpro.dk).

## Funktioner

- Skriftlige overleveringer opdelt efter skib og parti
- Status for manglende, afventende og læste overleveringer
- Automatisk lagring af kladder
- Billeder på overleveringer
- Registrering og statistik for madspild
- Gæstetal og beregninger pr. gæst
- Offline registrering af Waste-data med senere synkronisering
- Dansk og svensk brugerflade
- PWA-understøttelse til installation på computer og mobil
- QR-adgang til Nordic Crown og Nordic Pearl

## Skibe og adresser

| Område | Adresse | Databaseværdi |
| --- | --- | --- |
| Nordic Crown | `/crown` | `crown` |
| Nordic Pearl | `/pearl` | `pearl` |
| Tidligere Galley-link | `/galley` | Viser forklaring og vej til login |

Forsiden og skibsvalget er offentligt tilgængelige. Skibssiderne kræver en fælles skibskode. Et godkendt login gemmes i en sikker cookie i op til seks måneder.

Adgangskoden er en enkel fælles adgangskontrol og ikke et individuelt brugersystem. Al database- og billedadgang går derfor gennem beskyttede serverruter, som kontrollerer skibets signerede login-cookie. Browseren har ikke direkte adgang til Supabase-tabellerne.

## Overleveringer og datalagring

Nye overleveringer skal være skriftlige. Publicerede overleveringer kan ikke redigeres eller slettes manuelt.

Supabase rydder automatisk overleveringer, kommentarer og tilknyttede billeder, når de er ældre end 12 måneder. Oprydningen kører dagligt kl. 03.15.

## Offlinebrug

Appens sider gemmes lokalt via en service worker. Waste-registreringer kan oprettes uden internet og lægges i en lokal kø. Når computeren igen får forbindelse, synkroniseres køen med Supabase.

Computeren bør forbindes til internettet jævnligt, så lokale registreringer bliver sendt og den nyeste app-version bliver hentet.

## Teknologi

- Next.js 16 og React 19
- TypeScript
- Tailwind CSS
- Supabase
- Vercel
- TipTap-editor
- PWA/service worker

## Lokal udvikling

Installer pakker:

```bash
npm install
```

Start udviklingsserveren:

```bash
npm run dev
```

Åbn derefter [http://localhost:3000](http://localhost:3000).

Kontroller en produktionsbygning:

```bash
npm run build
```

## Miljøvariabler

Opret `.env.local` lokalt. Filen må ikke lægges på GitHub.

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
CROWN_ACCESS_CODE=
SOUSCHEF_ACCESS_CODE=
PEARL_ACCESS_CODE=
ACCESS_SESSION_SECRET=
```

`SUPABASE_SECRET_KEY` findes under Supabase-projektets API Keys og må aldrig være offentlig eller begynde med `NEXT_PUBLIC_`. Den ældre `SUPABASE_SERVICE_ROLE_KEY` understøttes som reserve. `ACCESS_SESSION_SECRET` bør være en lang, tilfældig værdi. De samme servervariabler skal oprettes i Vercel.

## Supabase

De aktuelle SQL-definitioner ligger i [`lib/supabase`](lib/supabase):

1. `food-waste.sql` – tabeller og regler til Waste og gæstetal
2. `handover-departments.sql` – gyldige afdelinger for Crown og Pearl
3. `handover-drafts.sql` – kladder, tidsstempler og låsning af publicerede overleveringer
4. `handover-performance.sql` – indeks til hurtigere statusopslag
5. `handover-retention.sql` – automatisk sletning efter 12 måneder
6. `secure-server-access.sql` – fjerner offentlig database- og storageadgang efter den sikre serverudgave er deployet

Kør aldrig `secure-server-access.sql`, før den nye app er udgivet med `SUPABASE_SECRET_KEY`; ellers mister den nuværende app midlertidigt forbindelsen til data.

Filerne er database-dokumentation og må ikke slettes efter kørsel. Engangsmigreringer fjernes, når resultatet er kontrolleret.

## Centrale mapper

```text
app/                 Sider, login og API-ruter
components/          Brugerflade og funktionskomponenter
lib/                 Supabase, offlinekø og fælles logik
lib/supabase/        Aktuelle SQL-definitioner
public/              PWA-filer, QR-koder og billeder
deliverables/        A4-dokumenter med QR-koder
scripts/             Generering af QR-materiale
```

## QR-materiale

Færdige A4-dokumenter findes i `deliverables`. QR-billederne ligger i `public`, og genereringsfilerne ligger i `scripts`.

Hvis adresser eller adgangskoder ændres, skal QR-materialet genereres og kontrolleres igen.

## Udgivelse

Produktionsmiljøet hostes på Vercel. Ændringer deployes automatisk, når de er kontrolleret og flettet ind i `main` på GitHub.

Før udgivelse køres som minimum:

```bash
npm run build
```

Efter udgivelse kontrolleres `/crown`, `/pearl` og det gamle `/galley`-link.
