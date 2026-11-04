TRÄDGÅRDSPLANERARE 3.0 – FAS 8

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


FAS 8 – FRI FORM, MARKERING OCH UTÖKAT VÄXTBIBLIOTEK
- Fri form visar hörnpunkter och en synlig linje/fylld förhandsvisning medan polygonen ritas.
- När fri form avslutas skapas objektet och verktyget växlar automatiskt till Markera.
- Efter placering av en växt eller en vanlig form växlar verktyget automatiskt till Markera; det nyplacerade objektet förblir markerat och kan dras direkt.
- Växtbiblioteket utökat från 244 till 259 poster. Nya exempel: gullviva (Primula veris), jordviva, lungört, vårstjärna, kungsängslilja, blåsippa, fänrikshjärta och backtimjan.
- Katalogens blomningstider, höjder och planteringsmått är vägledande planeringsuppgifter, inte garanterade sortdata.


Fas 9 – ändringar:
- Fri form flyttas nu tillsammans med sina hörnpunkter; även ändring av X/Y i egenskapspanelen flyttar hela polygonen.
- Klipp ut-knapp samt Ctrl/Cmd+X och Ctrl/Cmd+V. Klistra in placerar en kopia förskjuten 0,5 m.
- Växtkatalogen utökad till 300 poster. 25 namngivna rosor med sortspecifika färgsymboler, bland annat Flammentanz i rött.


FAS 10 – GEOMETRI OCH CIRKELSEKTORER
- Halvcirkeln startar med rak bas nedåt och bågen uppåt.
- Kvartscirkeln startar som övre högra cirkelsektorn.
- Ny form: töjbar kvartscirkel, där bredd och höjd kan justeras oberoende.
- Halvcirkel och kvartscirklar kan roteras runt respektive formdefinierade rotationscentrum.
- Rotationscentrum för kvartscirklarna ligger i cirkelns centrum (sektorhörnet).
- Den befintliga rotationsvinkeln och rotationskontrollerna används för samtliga tre former.

Begränsning i denna fas
- Den här leveransen fokuserar på de uttryckligen begärda cirkelformerna och rotationsgeometrin. De större funktionerna i utvecklingsplanens faser 10–17 (lager, gruppering, måttsättning, planteringsberäkning, import/export och analys) är ännu inte implementerade.


FAS 11 – NYA FUNKTIONER
- Lagerpanel: visa/dölj Plantering, Markytor, Konstruktioner och Detaljer.
- Objekt har lagerfält som sparas i projektfilen.
- Gruppera markerade växter och flytta gruppen som en enhet; lös upp grupper.
- Importera bild som bakgrundsunderlag (sparas inbäddad i projektfilen).
- Exportera ritningen som SVG.
- Exportera växtförteckning som CSV med antal per art/sort och kataloguppgifter.
- Fri form får korrekt polygonarea i egenskapspanelen.

Begränsningar i denna version: lasso/utökat gruppurval gäller växter; bakgrundsbilden sträcks över ritningsytan och kan ännu inte kalibreras separat. SVG-exporten exporterar ritningens aktuella vy. PDF-exporten använder webbläsarens utskriftsfunktion.


FAS 12 – MARKERING OCH FRI ROTATION
- Markeringshandtag har separata träffytor och tydligare pekarinteraktion.
- Rotationshandtaget roterar fritt med musen; vinkeländringen normaliseras så att rotationen passerar 180/-180 grader utan ryck.
- Kvartscirkel och justerbar kvartscirkel roterar kring sektorhörnet, dvs. centrum av den tänkta hela cirkeln.
- Halvcirkeln roterar kring mittpunkten på diametern.
- Storleksändring tar hänsyn till objektets rotation. Justerbar kvartscirkel kan ändra bredd och höjd oberoende utan att sektorhörnets rotationscentrum flyttas.
- Standardkvartscirkeln behåller lika bredd och höjd vid storleksändring.

Verifiering: JavaScript-syntax kontrollerad med Node.js. Musinteraktion har inte automatiskt verifierats i en grafisk webbläsare; kontrollera särskilt markering, handtag och rotation i din webbläsare.
