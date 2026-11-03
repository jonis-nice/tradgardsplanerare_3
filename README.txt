TRÄDGÅRDSPLANERARE 3.0 – FAS 6

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

FAS 6: Fri placering som standard (rutnät kan visas utan snapping), valfri 1 m snapping, kvartscirkel och spegling av halvcirkel/kvartscirkel. Växtbiblioteket utökat från 150 till 250 poster med buskar, träd, perenner, annueller och frösådda växter. Växtsymboler har schematiska konturer (slät, bladig eller sågtandad). Planeringsmått är ungefärliga och ska kontrolleras mot aktuell plantskoleinformation.

Fas 6 – utökad ritning och växtbibliotek
- Fri placering är standard; rutnätet är visuellt stöd och kan kopplas in som valfri 1 m snapping.
- Koordinatfält har 0,01 m precision.
- Ny kvartscirkel samt horisontell och vertikal spegling av halvcirklar och kvartscirklar.
- Växtbiblioteket omfattar 250 poster, inklusive 100 tillagda trädgårdsväxter, buskar, träd, annueller och frösådda växter.
- Växtsymboler använder schematiska släta, bladiga eller sågtandade konturer. Konturerna är grafiska planeringssymboler, inte exakta botaniska bladformer.
- Höjd, diameter, planteringsavstånd och blomning är vägledande kataloguppgifter. Kontrollera alltid sort, härdighet och slutlig storlek mot plantskola och växtplats innan beställning.


FAS 7 – GEOMETRI OCH VÄXTKONTURER
- Kvartscirkeln är korrigerad till en fylld 90-graders cirkelsektor med två radier som möts i cirkelns centrumhörn. Den tidigare diagonala kordformen är borttagen.
- Kvartscirkeln skapas kvadratisk för att spegling i X/Y ska ge fyra korrekta orienteringar.
- Ett enda halvcirkelverktyg används. Vänd upp/ner ändrar öppningens riktning; rotation 90 grader orienterar den åt höger/vänster.
- En legend med slät, bladig och sågtandad växtkontur visas i växtbiblioteket.
