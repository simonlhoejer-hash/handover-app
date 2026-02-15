# Kitchen Handover

Internt overleveringssystem til Galley & Shop.

---

## 🚀 Features

### 📋 Partier
- Status: **Mangler / Afventer / Læst**
- Viser seneste overleveringsdato
- Viser hvem der skal læse / har læst
- Klikbart kort pr. parti
- Ens layout for Galley & Shop

---

### 📅 Kalender
- Dansk & Norsk skoleferie
- Dansk & Norske helligdage
- Påske beregnes dynamisk
- Overlap vises med gradient
- Klikbar dato
- Markering af dags dato
- Måned navigation

---

## 🧠 Holiday Engine

Holiday logik er samlet i:

```
lib/holidays/
  danish.ts
  norwegian.ts
  easter.ts
  holidayEngine.ts
```

UI bruger kun:

```
createHolidayEngine(year)
```

Det holder logik adskilt fra UI og gør systemet nemt at udvide.

---

## 🏗 Struktur

```
app/
components/
lib/
  holidays/
```

Holiday logik er samlet ét sted.  
UI komponenter indeholder ingen dato-beregning.

---

## 🛠 Development

Start lokalt:

```bash
npm run dev
```

---

## 🧹 Hvis der opstår mærkelige fejl

Stop server:

```bash
CTRL + C
```

Slet cache:

```bash
rd /s /q .next
```

Start igen:

```bash
npm run dev
```

---

## 📦 Commit & Deploy til Vercel

Commit ændringer:

```bash
git add .
git commit -m "Holiday engine + unified status layout"
git push
```

Vercel deployer automatisk fra `main` branch.

---

## 🌍 Production

App hostes via Vercel.  
Deploy sker automatisk ved push til main.

---

## 👨‍🍳 Formål

Systemet bruges til:

- Daglig overlevering
- Overblik over manglende partier
- Planlægning ved ferie og helligdage
- Travlhedsforståelse for køkken & shop
