TRÄDGÅRDSPLANERARE 3.0 – ETAPP 1

Detta är ett separat projekt. Version 2.0 och originalprojektet har inte ändrats.

FILER
- index.html: gränssnitt
- styles.css: utseende
- app.js: ritmotor och funktioner

TESTA LOKALT
1. Packa upp ZIP-filen.
2. Öppna index.html i en modern webbläsare (Chrome, Edge eller Firefox rekommenderas).
3. Alla tre filer måste ligga i samma mapp.

PUBLICERA MED GITHUB PAGES
1. Skapa ett NYTT repository, exempelvis tradgardsplanerare-v3.
2. Ladda upp index.html, styles.css och app.js till repositoryts rot.
3. Öppna Settings → Pages.
4. Välj Deploy from a branch, branch main och folder /(root).
5. Spara och invänta publicering.

ETAPP 1 INGÅR
- Separata lager för former och växtsymboler; växtlagret renderas över formytor.
- Standardfärger per formtyp och redigerbara standardfärger.
- Former: rabatt, gång, gräsyta, rektangel, oval, cirkel, halvcirkel, triangel, romb och fri polygon.
- Flytta, kopiera, rotera via grader, ändra storlek via exakta mått, positionera med X/Y.
- Måttinmatning för gång, exempelvis 12x1m.
- Måttvisning för former (polygonens visade area/omkrets är för närvarande baserad på omslutande rektangel).
- Justerbar kompass och solriktningspil.
- Rutnät, halvmeterssnäppning, zoom, ångra/gör om, JSON-spara/öppna och PDF via utskrift.

BEGRÄNSNINGAR I DENNA PROTOTYP
- Växtlagret är tekniskt separerat men det fullständiga växtbiblioteket och artunika symboler byggs i etapp 2.
- Rotation och storlek ändras i egenskapspanelen; fria draghandtag för rotation/storleksändring är inte implementerade ännu.
- Fri polygon ritas med klickpunkter. Polygonens geometri roteras visuellt men dess måttredigering utgår från omslutande rektangel.
- Kompass/sol är orienteringshjälpmedel, inte astronomisk sol- eller skuggsimulering.
- Ingen fullständig webbläsar-/enhetstestning har gjorts i alla miljöer. JavaScript har syntaxkontrollerats.
