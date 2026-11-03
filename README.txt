TRÄDGÅRDSPLANERARE 3.0 – FAS 5

Innehåll
- index.html: gränssnitt
- styles.css: layout och utseende
- app.js: ritverktyg, växtplacering, projektdata och inköpssystem
- catalog.js: växtbibliotek

Start
Öppna index.html i en modern webbläsare. För bästa funktionalitet kan projektet köras via en lokal webbserver eller publiceras på GitHub Pages.

Fas 5 – Inköp och prisförslag
- Kalkylrader skapas automatiskt från placerade växter och ritade ytor.
- Flera leverantörsofferter kan kopplas till samma kalkylrad.
- Offerter jämförs per enhet; lägsta registrerade pris väljs automatiskt som standard.
- Moms kan anges per offert. Frakt räknas en gång per vald leverantör.
- Produktlänk, leverantör, kontrolldatum och pris sparas.
- Egna prislistor kan exporteras/importeras som CSV.
- Prisregister sparas lokalt i webbläsaren och följer även med i projektets JSON-fil.
- Varje kalkylrad har en svensk webbsöklänk för kontroll av aktuella priser.

Viktig begränsning
Appen är en fristående klientapp utan server eller leverantörs-API. Webbsökningen öppnar externa sökresultat men hämtar inte priser automatiskt från butiker. För automatisk liveprisimport krävs en serverdel och godkända leverantörs-API:er eller dataflöden. Priser i registret är användarregistrerade och ska verifieras mot leverantören.

Mängder från ritningen är uppskattningar. Ytarea är inte samma sak som faktisk materialåtgång; jorddjup, densitet, spill, emballage och leveransvillkor måste anges separat innan beställning.
