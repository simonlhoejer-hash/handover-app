export const translations = {
  da: {
    // Menu
    partier: 'Partier',
    outlets: 'Outlets',
    galleyMoede: 'Galley Afdelingsmøde',
    shopMoede: 'Shop Afdelingsmøde',
    kalender: 'Kalender',
    indstillinger: 'Indstillinger',
    handoverTitle: 'Overlevering',
    handoverSubtitle: 'Vælg parti og læs eller skriv overlevering.',
    foodWaste: 'Food waste',
    overview: 'Overblik',
    app: 'App',
    language: 'Sprog',
    theme: 'Tema',
    switchLanguage: 'Skift sprog',
    switchTheme: 'Skift tema',
    privacy: 'Privatliv og persondata',
    privacyIntro:
      'HandoverPro registrerer fornavne i forbindelse med arbejdsrelaterede overleveringer.',
    privacyPurposeTitle: 'Formål',
    privacyPurpose:
      'Fornavne bruges til at vise, hvem der har skrevet, modtaget og læst en overlevering samt hvem der har skrevet en kommentar.',
    privacyContentTitle: 'Indhold',
    privacyContent:
      'Skriv kun arbejdsrelaterede driftsoplysninger. Skriv ikke CPR-numre, helbredsoplysninger eller andre følsomme eller private oplysninger.',
    privacyRetentionTitle: 'Opbevaring',
    privacyRetention:
      'Overleveringer, fornavne, kommentarer og tilknyttede billeder opbevares i op til 12 måneder og slettes derefter.',
    privacyResponsibilityTitle: 'Dataansvar',
    privacyResponsibility:
      'Arbejdsgiveren er ansvarlig for behandlingen af personoplysninger i HandoverPro. Spørg din nærmeste leder, hvis du ønsker indsigt, rettelse eller sletning.',

    // Status
    online: 'Online',
    offline: 'Offline',
    synced: 'Synkroniseret',
    waitingShort: 'venter',
    syncing: 'Synkroniserer',
    retrying: 'prøver igen',
    offlineShowingCached: 'Offline. Viser seneste gemte tal.',

    // Forside
    missing: '❌ Mangler',
    pending: '🕒 Afventer',
    read: '✓ Læst',
    last: 'Sidst',
    noHandover: 'Ingen overleveringer endnu',
    loading: 'Indlæser…',
    loadingShort: 'Henter...',

    // Handover form
    newHandover: 'Ny overlevering',
    senderName: 'Dit navn (afsender)',
    receiverName: 'Modtager (hvem skal læse)',
    images: 'Billeder',
    saving: 'Gemmer...',
    saveHandover: 'Gem overlevering',
    writtenHandover: 'Skriftlig',
    oralHandover: 'Mundtlig overlevering',
    oralHandoverNoText:
      'Mundtlig overlevering er valgt. Du behøver ikke skrive tekst.',
    draftNotPublished: 'Kladde - ikke offentliggjort',
    draftSaving: 'Gemmer...',
    draftSaved: '✓ Gemt kladde',
    draftSaveFailed: 'Kunne ikke gemme kladde',
    draftLoaded: 'Kladde hentet',
    lastSavedAt: 'Sidst gemt kl.',
    publishConfirmTitle: 'Er du sikker?',
    publishConfirmText:
      'Når overleveringen er gemt, kan den ikke redigeres eller slettes igen.',
    publishConfirmButton: 'Gem og offentliggør',
    publishCancelButton: 'Annuller',
    publishRequiresDraft:
      'Kladde-funktionen kræver, at Supabase SQL-filen er kørt.',

    // Parti page
    handoversFor: 'Overleveringer for',
    history: 'Historik',
    requiredFields: 'Afsender, modtager og overlevering skal udfyldes',

    // History item
    cannotEditRead: 'Overleveringen er allerede læst og kan ikke redigeres',
    enterFirstName: 'Skriv dit fornavn for at kvittere',
    edit: 'Rediger',
    save: 'Gem',
    cancel: 'Annuller',
    firstNamePlaceholder: 'Dit fornavn',
    markAsRead: '✓ Markér som læst',
    readBy: '✔️ Læst af',

    // Comments
    comments: 'Kommentarer',
    noComments: 'Ingen kommentarer endnu',
    yourName: 'Dit navn',
    writeComment: 'Skriv kommentar...',
    addComment: 'Tilføj kommentar',
    couldNotSaveComment: 'Kunne ikke gemme kommentar',
    timePrefix: 'kl.',

    // Editor
    editorTemplate: `Nye tiltag:
• 

Udfordringer:
• 

Vigtigt:
• 

Rengøring:
• `,
    bullet: 'Punkt',

    // Image upload
    uploading: 'Uploader…',
    chooseFile: 'Vælg fil',
    imageHelp: 'Maks 5MB · Kun JPG eller PNG',
    onlyPngJpg: 'Kun PNG og JPG er tilladt',
    imageMaxSize: 'Billedet må max være',
    couldNotReadImage: 'Kunne ikke læse billedet',
    couldNotGetUrl: 'Kunne ikke hente public URL',
    preview: 'Preview',
    editorPlaceholder: `Hjælp den næste vagt 👇

Hvad er anderledes i dag?
Hvad mangler at blive lavet?
Er der noget kritisk?
Skriv tal og mængder.
Skriv hvor tingene står.`,
    bulletList: '• Liste',
    numberedList: '1. Liste',

    // Login/admin/kalkulation
    loginTagline: 'Digital overlevering til køkken og ledelse.',
    login: 'Log ind',
    administration: 'Administration',
    chooseOutlet: 'Vælg outlet',
    calculations: 'kalkulationer',
    calculation: 'Kalkulation',
    createCalculationSubtitle: 'Opret ny ret eller grundkalkulation',
    department: 'Afdeling',
    type: 'Type',
    dish: 'Ret',
    baseCalculation: 'Grundkalkulation',
    name: 'Navn',
    salesPrice: 'Salgspris',
    rawIngredient: 'Råvare',
    amount: 'Mængde',
    unit: 'Enhed',
    price: 'Pris',
    total: 'I alt',
    searchIngredient: 'Søg råvare...',
    result: 'Resultat',
    foodCost: 'Food Cost',
    costPrice: 'Kostpris',

    // Food waste
    foodWasteSubtitle: 'Vælg sted og registrer vægten for i dag.',
    today: 'I dag',
    zeroKgToday: '0 kg i dag',
    writeKg: 'Skriv kg.',
    comment: 'Kommentar',
    foodWasteAutoSaveHint: 'Gemmer automatisk, når du er færdig med at skrive.',
    foodWasteSavedReturning: 'Gemt – går tilbage til oversigten.',
    savedLocally: 'Gemt lokalt. Sendes automatisk, når der er net.',
    registrationWaiting: 'registrering venter på net.',
    registrationsWaiting: 'registreringer venter på net.',
    offlineEntriesSaved:
      'Offline. Registreringer gemmes lokalt og sendes automatisk senere.',
    latestForLocation: 'Seneste for stedet',
    noRegistrations: 'Ingen registreringer endnu.',
    waiting: 'Venter',
    back: 'Tilbage',
    deleteRegistration: 'Slet registrering',
    couldNotDeleteRegistration: 'Kunne ikke slette registreringen.',

    // Food waste overview
    foodWasteOverview: 'Food waste overblik',
    foodWasteOverviewSubtitle: 'Sammenlign buffetspild og produktionsaffald.',
    buffetWaste: 'Buffetspild',
    productionWaste: 'Gennem kværnen i alt',
    productionAndDeckOne: 'Produktion & Dæk 1',
    buffetKgPerGuest: 'Buffet kg pr. gæst',
    buffetDevelopment: 'Buffetspild over tid',
    productionDevelopment: 'Gennem kværnen over tid',
    buffetByLocation: 'Buffetspild pr. sted',
    productionByLocation: 'Produktion & Dæk 1 pr. sted',
    productionAveragePerDay: 'Produktionsaffald pr. dag',
    buffetWasteExplanation: 'Viser mulig overproduktion og tabte råvarer.',
    productionWasteExplanation:
      'Viser mængden gennem kværnen og grundlaget for sparet renovation.',
    category: 'Kategori',
    guestCountsNeedSql:
      'Gæstetal kræver den nye Supabase SQL, før de kan gemmes.',
    fromDate: 'Fra dato',
    toDate: 'Til dato',
    exporting: 'Eksporterer...',
    exportExcel: 'Eksporter Excel',
    kgInPeriod: 'Kg i perioden',
    guests: 'Gæster',
    kgPerGuest: 'Kg pr. gæst',
    averagePerDay: 'Gns. pr. dag',
    averageKgPerDay: 'Gns. kg pr. dag',
    weightChart: 'Vægt graf',
    noRegistrationsInPeriod: 'Ingen registreringer i perioden.',
    writeGuests: 'Skriv gæster',
    guestCountPlaceholder: 'Antal gæster',
    saveGuests: 'Gem gæster',
    guestCountRequired: 'Skriv antal gæster.',
    couldNotSaveGuests: 'Kunne ikke gemme gæster endnu.',
    guestsSaved: 'Gæster gemt.',
    overviewByLocation: 'Oversigt pr. sted',
    perDay: 'pr. dag',
    latestRegistrations: 'Seneste registreringer',
    periodFrom: 'Periode fra',
    periodTo: 'Periode til',
    period: 'Periode',
    date: 'Dato',
    location: 'Sted',
    kg: 'Kg',
    created: 'Oprettet',
    week: 'Uge',
    sheetOverview: 'Overblik',
    sheetPerLocation: 'Pr sted',
    sheetChartData: 'Graf data',
    sheetRegistrations: 'Registreringer',
    sheetGuests: 'Gæster',
  },

  sv: {
    // Menu
    partier: 'Avdelningar',
    outlets: 'Butiker',
    galleyMoede: 'Galley Avdelningsmöte',
    shopMoede: 'Shop Avdelningsmöte',
    kalender: 'Kalender',
    indstillinger: 'Inställningar',
    handoverTitle: 'Överlämning',
    handoverSubtitle: 'Välj avdelning och läs eller skriv överlämning.',
    foodWaste: 'Food waste',
    overview: 'Översikt',
    app: 'App',
    language: 'Språk',
    theme: 'Tema',
    switchLanguage: 'Byt språk',
    switchTheme: 'Byt tema',
    privacy: 'Integritet och personuppgifter',
    privacyIntro:
      'HandoverPro registrerar förnamn i samband med arbetsrelaterade överlämningar.',
    privacyPurposeTitle: 'Syfte',
    privacyPurpose:
      'Förnamn används för att visa vem som har skrivit, tagit emot och läst en överlämning samt vem som har skrivit en kommentar.',
    privacyContentTitle: 'Innehåll',
    privacyContent:
      'Skriv endast arbetsrelaterad driftinformation. Skriv inte personnummer, hälsouppgifter eller andra känsliga eller privata uppgifter.',
    privacyRetentionTitle: 'Lagring',
    privacyRetention:
      'Överlämningar, förnamn, kommentarer och tillhörande bilder lagras i upp till 12 månader och raderas därefter.',
    privacyAccessTitle: 'Åtkomst',
    privacyAccess:
      'Åtkomst till appens Nordic Crown- och Nordic Pearl-sidor kräver var sin gemensamma avdelningskod. Det begränsar åtkomsten via appen, och enheten kommer ihåg den i upp till 6 månader. Koden kan delas av avdelningschefen och bytas vid behov. Eftersom koden är gemensam identifierar den inte den enskilda användaren.',
    privacyResponsibilityTitle: 'Personuppgiftsansvar',
    privacyResponsibility:
      'Arbetsgivaren ansvarar för behandlingen av personuppgifter i HandoverPro. Fråga din närmaste chef om du önskar tillgång, rättelse eller radering.',

    // Status
    online: 'Online',
    offline: 'Offline',
    synced: 'Synkroniserat',
    waitingShort: 'väntar',
    syncing: 'Synkroniserar',
    retrying: 'försöker igen',
    offlineShowingCached: 'Offline. Visar senast sparade siffror.',

    // Forside
    missing: '❌ Saknas',
    pending: '🕒 Väntar',
    read: '✓ Läst',
    last: 'Senast',
    noHandover: 'Inga överlämningar ännu',
    loading: 'Laddar…',
    loadingShort: 'Hämtar...',

    // Handover form
    newHandover: 'Ny överlämning',
    senderName: 'Ditt namn (avsändare)',
    receiverName: 'Mottagare (vem ska läsa)',
    images: 'Bilder',
    saving: 'Sparar...',
    saveHandover: 'Spara överlämning',
    writtenHandover: 'Skriftlig',
    oralHandover: 'Muntlig överlämning',
    oralHandoverNoText:
      'Muntlig överlämning är vald. Du behöver inte skriva text.',
    draftNotPublished: 'Utkast - inte publicerat',
    draftSaving: 'Sparar...',
    draftSaved: '✓ Utkast sparat',
    draftSaveFailed: 'Kunde inte spara utkast',
    draftLoaded: 'Utkast hämtat',
    lastSavedAt: 'Senast sparat kl.',
    publishConfirmTitle: 'Är du säker?',
    publishConfirmText:
      'När överlämningen har sparats kan den inte redigeras eller raderas igen.',
    publishConfirmButton: 'Spara och publicera',
    publishCancelButton: 'Avbryt',
    publishRequiresDraft:
      'Utkastfunktionen kräver att Supabase SQL-filen har körts.',

    // Parti page
    handoversFor: 'Överlämningar för',
    history: 'Historik',
    requiredFields: 'Avsändare, mottagare och överlämning måste fyllas i',

    // History item
    cannotEditRead: 'Överlämningen är redan läst och kan inte redigeras',
    enterFirstName: 'Skriv ditt förnamn för att kvittera',
    edit: 'Redigera',
    save: 'Spara',
    cancel: 'Avbryt',
    firstNamePlaceholder: 'Ditt förnamn',
    markAsRead: '✓ Markera som läst',
    readBy: '✔️ Läst av',

    // Comments
    comments: 'Kommentarer',
    noComments: 'Inga kommentarer ännu',
    yourName: 'Ditt namn',
    writeComment: 'Skriv kommentar...',
    addComment: 'Lägg till kommentar',
    couldNotSaveComment: 'Kunde inte spara kommentar',
    timePrefix: 'kl.',

    // Editor
    editorTemplate: `Nya åtgärder:
• 

Utmaningar:
• 

Viktigt:
• 

Städning:
• `,
    bullet: 'Punkt',

    // Image upload
    uploading: 'Laddar upp…',
    chooseFile: 'Välj fil',
    imageHelp: 'Max 5MB · Endast JPG eller PNG',
    onlyPngJpg: 'Endast PNG och JPG är tillåtna',
    imageMaxSize: 'Bilden får max vara',
    couldNotReadImage: 'Kunde inte läsa bilden',
    couldNotGetUrl: 'Kunde inte hämta publik URL',
    preview: 'Preview',
    editorPlaceholder: `Hjälp nästa vakt 👇

Vad är annorlunda idag?
Vad saknas att bli gjort?
Finns det något kritiskt?
Skriv siffror och mängder.
Skriv var sakerna står.`,
    bulletList: '• Lista',
    numberedList: '1. Lista',

    // Login/admin/kalkulation
    loginTagline: 'Digital överlämning till kök och ledning.',
    login: 'Logga in',
    administration: 'Administration',
    chooseOutlet: 'Välj outlet',
    calculations: 'kalkyler',
    calculation: 'Kalkyl',
    createCalculationSubtitle: 'Skapa ny rätt eller grundkalkyl',
    department: 'Avdelning',
    type: 'Typ',
    dish: 'Rätt',
    baseCalculation: 'Grundkalkyl',
    name: 'Namn',
    salesPrice: 'Försäljningspris',
    rawIngredient: 'Råvara',
    amount: 'Mängd',
    unit: 'Enhet',
    price: 'Pris',
    total: 'Totalt',
    searchIngredient: 'Sök råvara...',
    result: 'Resultat',
    foodCost: 'Food Cost',
    costPrice: 'Kostpris',

    // Food waste
    foodWasteSubtitle: 'Välj plats och registrera vikten för idag.',
    today: 'Idag',
    zeroKgToday: '0 kg idag',
    writeKg: 'Skriv kg.',
    comment: 'Kommentar',
    foodWasteAutoSaveHint: 'Sparas automatiskt när du har skrivit klart.',
    foodWasteSavedReturning: 'Sparat – går tillbaka till översikten.',
    savedLocally: 'Sparat lokalt. Skickas automatiskt när det finns nät.',
    registrationWaiting: 'registrering väntar på nät.',
    registrationsWaiting: 'registreringar väntar på nät.',
    offlineEntriesSaved:
      'Offline. Registreringar sparas lokalt och skickas automatiskt senare.',
    latestForLocation: 'Senaste för platsen',
    noRegistrations: 'Inga registreringar ännu.',
    waiting: 'Väntar',
    back: 'Tillbaka',
    deleteRegistration: 'Radera registrering',
    couldNotDeleteRegistration: 'Kunde inte radera registreringen.',

    // Food waste overview
    foodWasteOverview: 'Food waste översikt',
    foodWasteOverviewSubtitle: 'Jämför buffésvinn och produktionsavfall.',
    buffetWaste: 'Buffésvinn',
    productionWaste: 'Produktionsavfall',
    productionAndDeckOne: 'Produktion & Däck 1',
    buffetKgPerGuest: 'Buffé kg per gäst',
    buffetDevelopment: 'Buffésvinn över tid',
    productionDevelopment: 'Produktionsavfall över tid',
    buffetByLocation: 'Buffésvinn per plats',
    productionByLocation: 'Produktion & Däck 1 per plats',
    productionAveragePerDay: 'Produktionsavfall per dag',
    buffetWasteExplanation: 'Visar möjlig överproduktion och förlorade råvaror.',
    productionWasteExplanation:
      'Visar mängden genom kvarnen och underlaget för sparad avfallshantering.',
    category: 'Kategori',
    guestCountsNeedSql:
      'Gästantal kräver den nya Supabase SQL innan de kan sparas.',
    fromDate: 'Från datum',
    toDate: 'Till datum',
    exporting: 'Exporterar...',
    exportExcel: 'Exportera Excel',
    kgInPeriod: 'Kg i perioden',
    guests: 'Gäster',
    kgPerGuest: 'Kg per gäst',
    averagePerDay: 'Gen. per dag',
    averageKgPerDay: 'Gen. kg per dag',
    weightChart: 'Viktgraf',
    noRegistrationsInPeriod: 'Inga registreringar i perioden.',
    writeGuests: 'Skriv gäster',
    guestCountPlaceholder: 'Antal gäster',
    saveGuests: 'Spara gäster',
    guestCountRequired: 'Skriv antal gäster.',
    couldNotSaveGuests: 'Kunde inte spara gäster ännu.',
    guestsSaved: 'Gäster sparade.',
    overviewByLocation: 'Översikt per plats',
    perDay: 'per dag',
    latestRegistrations: 'Senaste registreringar',
    periodFrom: 'Period från',
    periodTo: 'Period till',
    period: 'Period',
    date: 'Datum',
    location: 'Plats',
    kg: 'Kg',
    created: 'Skapad',
    week: 'Vecka',
    sheetOverview: 'Översikt',
    sheetPerLocation: 'Per plats',
    sheetChartData: 'Grafdata',
    sheetRegistrations: 'Registreringar',
    sheetGuests: 'Gäster',
  },
}
