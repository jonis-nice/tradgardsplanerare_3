(()=>{'use strict';
const $=id=>document.getElementById(id),svg=$('drawing'),NS='http://www.w3.org/2000/svg';let W=20,H=14,scale=42,ox=80,oy=55,zoom=1,tool='select',objects=[],plants=[],selected=null,gesture=null,poly=[],undoStack=[],redoStack=[],grid=true,snap=true;
const defaults={bed:['#b8cba9','#71866c'],path:['#c5b7a3','#887760'],lawn:['#c8d9b9','#78936b'],rect:['#d6d9d2','#818982'],ellipse:['#d6d9d2','#818982'],circle:['#d6d9d2','#818982'],semi:['#d6d9d2','#818982'],triangle:['#d6d9d2','#818982'],diamond:['#d6d9d2','#818982'],polygon:['#d6d9d2','#818982'],tree:['#d4dfc9','#708b65']};
const clone=o=>JSON.parse(JSON.stringify(o)),uid=()=>Math.random().toString(36).slice(2,10),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function snapshot(){undoStack.push(JSON.stringify({objects,plants}));if(undoStack.length>80)undoStack.shift();redoStack=[]}
function px(v){return v*scale*zoom}function world(pt){let r=svg.getBoundingClientRect(),sx=(pt.clientX-r.left)/r.width*1000,sy=(pt.clientY-r.top)/r.height*700;return{x:(sx-ox)/scale/zoom,y:(sy-oy)/scale/zoom}}
function screenPoint(e){return world(e)}function snapPoint(p){return snap?{x:Math.round(p.x*2)/2,y:Math.round(p.y*2)/2}:p}
function el(tag,attrs={},parent=svg){let n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));parent.appendChild(n);return n}
function geometry(o,g){let x=o.x,y=o.y,w=o.w,h=o.h,shape;switch(o.type){case'ellipse':case'circle':shape=el('ellipse',{cx:x+w/2,cy:y+h/2,rx:w/2,ry:h/2},g);break;case'semi':shape=el('path',{d:`M ${x} ${y+h} A ${w/2} ${h} 0 0 1 ${x+w} ${y+h} Z`},g);break;case'triangle':shape=el('polygon',{points:`${x+w/2},${y} ${x+w},${y+h} ${x},${y+h}`},g);break;case'diamond':shape=el('polygon',{points:`${x+w/2},${y} ${x+w},${y+h/2} ${x+w/2},${y+h} ${x},${y+h/2}`},g);break;case'polygon':shape=el('polygon',{points:(o.points||[]).map(p=>`${p.x},${p.y}`).join(' ')},g);break;default:shape=el('rect',{x,y,width:w,height:h,rx:o.type==='bed'?8:2},g)}shape.setAttribute('fill',o.fill);shape.setAttribute('fill-opacity',o.type==='path'?.9:.72);shape.setAttribute('stroke',o.stroke);shape.setAttribute('stroke-width',1.5);shape.setAttribute('vector-effect','non-scaling-stroke');}
function render(){let vb=svg.viewBox.baseVal;if(!vb||!vb.width)svg.setAttribute('viewBox','0 0 1000 700');svg.innerHTML='';let bg=el('rect',{x:0,y:0,width:1000,height:700,fill:'#fff'});let content=el('g',{});let s=scale*zoom;let worldW=W*s,worldH=H*s;ox=Math.max(20,(1000-worldW)/2);oy=Math.max(20,(700-worldH)/2);if(grid){let gg=el('g',{stroke:'#e9eee8','stroke-width':1});for(let x=0;x<=W;x++)el('line',{x1:ox+x*s,y1:oy,x2:ox+x*s,y2:oy+worldH},gg);for(let y=0;y<=H;y++)el('line',{x1:ox,y1:oy+y*s,x2:ox+worldW,y2:oy+y*s},gg)}el('rect',{x:ox,y:oy,width:worldW,height:worldH,fill:'none',stroke:'#aebaae','stroke-width':1.5});
let base=el('g',{transform:`translate(${ox},${oy}) scale(${s})`});objects.forEach(o=>{let g=el('g',{transform:`rotate(${o.rotation||0} ${o.x+o.w/2} ${o.y+o.h/2})`},base);geometry(o,g);if(o.id===selected){let r=el('rect',{x:o.x,y:o.y,width:o.w,height:o.h,fill:'none',stroke:'#2f6242','stroke-width':1/s,'stroke-dasharray':`${5/s} ${3/s}`},g);el('circle',{cx:o.x+o.w,cy:o.y+o.h,r:5/s,fill:'#fff',stroke:'#2f6242','stroke-width':1.5/s,'data-handle':'resize'},g)}});
// Växtsymboler: enkel, tydlig planvy med botaniskt vald grundfärg (ingen dekorativ grenstruktur).
let plantLayer=el('g',{transform:`translate(${ox},${oy}) scale(${s})`});
plants.forEach(p=>{
  let g=el('g',{transform:`rotate(${p.rotation||0} ${p.x} ${p.y})`},plantLayer);
  let r=Math.max(.08,p.d/2),col=p.color||'#78936b';
  el('circle',{cx:p.x,cy:p.y,r,fill:col,'fill-opacity':.30,stroke:col,'stroke-width':1.25/s},g);
  el('circle',{cx:p.x,cy:p.y,r:r*.16,fill:col,'fill-opacity':.8},g);
  if(p.id===selected)el('circle',{cx:p.x,cy:p.y,r:r+3/s,fill:'none',stroke:'#2f6242','stroke-width':1.5/s,'stroke-dasharray':`${4/s} ${3/s}`},g);
});
// Compass and sun indicator: anchored to the drawing frame, with all elements in the correct SVG group.
let north=((Number($('northAngle').value)||0)%360+360)%360;
let sun=((Number($('sunAngle').value)||0)%360+360)%360;
let cg=el('g',{transform:`translate(${ox+worldW-42} ${oy+42})`});
if($('showCompass').checked){
  el('circle',{cx:0,cy:0,r:27,fill:'#ffffff','fill-opacity':.58,stroke:'#526257','stroke-opacity':.48,'stroke-width':1.2},cg);
  let a=north*Math.PI/180, nx=Math.sin(a), ny=-Math.cos(a);
  // North needle: red tip; south needle: white tail with dark outline.
  el('path',{d:`M 0 0 L ${nx*21} ${ny*21} L ${-ny*4} ${nx*4} Z`,fill:'#c83232',stroke:'#8f2525','stroke-width':.65},cg);
  el('path',{d:`M 0 0 L ${-nx*19} ${-ny*19} L ${ny*4} ${-nx*4} Z`,fill:'#fff',stroke:'#65716a','stroke-width':.8},cg);
  el('circle',{cx:0,cy:0,r:2.6,fill:'#45534a'},cg);
  el('text',{x:0,y:-32,'text-anchor':'middle','font-size':10,'font-weight':700,fill:'#b52d2d'},cg).textContent='N';
  el('text',{x:0,y:39,'text-anchor':'middle','font-size':9,fill:'#45534a'},cg).textContent='S';
}
if($('showSun').checked){
  let a=sun*Math.PI/180, x=Math.sin(a)*43,y=-Math.cos(a)*43;
  let sg=el('g',{},svg);
  el('path',{d:`M ${ox+worldW-42} ${oy+42} L ${ox+worldW-42+x} ${oy+42+y}`,stroke:'#c58b48','stroke-width':1.6,'stroke-dasharray':'3 3','stroke-opacity':.7},sg);
  el('circle',{cx:ox+worldW-42+x,cy:oy+42+y,r:6,fill:'#e6b75b',stroke:'#b88736','stroke-width':1},sg);
}
$('shapeCount').textContent=objects.length+' objekt';updateEditor();if($('budgetTotal'))renderPurchases();}
function updateEditor(){let o=objects.find(x=>x.id===selected)||plants.find(x=>x.id===selected);$('emptySelection').classList.toggle('hidden',!!o);$('editor').classList.toggle('hidden',!o);if(!o)return;let plant=plants.includes(o);$('objName').value=o.name||o.type;$('objW').value=plant?o.d:o.w;$('objH').value=plant?o.d:o.h;$('objRotation').value=o.rotation||0;$('objFill').value=o.fill||'#d4dfc9';$('objStroke').value=o.stroke||'#708b65';$('objFill').disabled=plant;$('objStroke').disabled=plant;$('objX').value=o.x;$('objY').value=o.y;$('measureInfo').textContent=plant?`${o.latin||''} · ${o.category||'Växt'} · Höjd ca ${o.height||'?'} m · Avstånd ${o.spacing||'?'} cm · ${o.light||''} · Blomning ${o.bloom||'–'} · Symboldiameter: ${o.d.toFixed(2)} m`:`Bredd: ${o.w.toFixed(2)} m · Höjd: ${o.h.toFixed(2)} m · Area: ${(o.w*o.h).toFixed(2)} m² · Omkrets (rektangulärt mått): ${(2*(o.w+o.h)).toFixed(2)} m`;}
function setTool(t){tool=t;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('selected',b.dataset.tool===t));$('finishPolygon').classList.toggle('hidden',t!=='polygon');$('toolHelp').textContent=t==='select'?'Markera, flytta och ändra storlek på objekt.':t==='polygon'?'Klicka ut hörnpunkter och avsluta polygonen.':'Dra på ritningen för att skapa en form.'}
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
function newObj(type,a,b){let x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.max(.15,Math.abs(b.x-a.x)),h=Math.max(.15,Math.abs(b.y-a.y));if(type==='circle'){let d=Math.max(w,h);w=h=d}let c=defaults[type]||defaults.rect;return{id:uid(),type,x,y,w,h,rotation:0,fill:c[0],stroke:c[1],name:type==='bed'?'Rabatt':type==='path'?'Gång':type==='lawn'?'Gräsyta':'Form'};}
let selectedCatalogPlant=null;
function plantInfo(p){return `<b>${p.name}</b><br><i>${p.latin}</i><br>${p.category} · Höjd ca ${p.height} m · Planeringsdiameter ${p.diameter} m<br>Planteringsavstånd ${p.spacing} cm · ${p.light}<br>Blomning: ${p.bloom}`}
function renderCatalog(){let q=$('plantSearch').value.trim().toLocaleLowerCase('sv'),cat=$('plantCategory').value;let list=(window.PLANT_CATALOG||[]).filter(p=>(cat==='Alla'||p.category===cat)&&(!q||(p.name+' '+p.latin).toLocaleLowerCase('sv').includes(q)));$('plantResults').innerHTML='';list.forEach(p=>{let b=document.createElement('button');b.className='plant-item'+(selectedCatalogPlant?.id===p.id?' active':'');b.innerHTML=`<span class="plant-dot" style="--plant-color:${p.color}"></span><span><strong>${p.name}</strong><em>${p.latin}</em></span>`;b.onclick=()=>{selectedCatalogPlant=p;$('plantSelected').innerHTML=plantInfo(p);$('placePlant').disabled=false;setTool('plant');$('status').textContent='Vald växt: '+p.name+' – klicka i ritningen för att placera';renderCatalog()};$('plantResults').appendChild(b)});}
$('plantSearch').addEventListener('input',renderCatalog);$('plantCategory').addEventListener('change',renderCatalog);$('placePlant').onclick=()=>{if(!selectedCatalogPlant)return;setTool('plant');$('status').textContent='Klicka i ritningen för att placera '+selectedCatalogPlant.name};renderCatalog();
svg.addEventListener('pointerdown',e=>{let p=snapPoint(screenPoint(e)),hit=e.target.closest('[data-handle]');
 if(tool==='plant'&&selectedCatalogPlant){snapshot();let d=selectedCatalogPlant.diameter;let item={...clone(selectedCatalogPlant),id:uid(),x:p.x,y:p.y,d,rotation:0};plants.push(item);selected=item.id;render();$('status').textContent='Placerade '+item.name+' – klicka igen för att placera fler';return;}if(hit&&selected){snapshot();let o=objects.find(z=>z.id===selected);if(o){gesture={kind:'resize',id:o.id,start:p,original:clone(o)};svg.setPointerCapture(e.pointerId);return}}
let target=e.target.closest('[data-object]');if(target){let id=target.getAttribute('data-object');selected=id;if(tool==='select'){snapshot();let o=objects.find(z=>z.id===id)||plants.find(z=>z.id===id);gesture={kind:'move',id,start:p,original:clone(o)};svg.setPointerCapture(e.pointerId);render();return}}
if(tool==='select'){selected=null;render();return}if(tool==='polygon'){poly.push(p);render();return}snapshot();gesture={kind:'draw',start:p,type:tool,preview:null};svg.setPointerCapture(e.pointerId)});
// Add stable object hit targets after drawing; hit regions do not alter the independent vegetation layer.
function attachHits(){svg.querySelectorAll('[data-hit-id]').forEach(n=>n.remove());let s=scale*zoom,group=el('g',{transform:`translate(${ox},${oy}) scale(${s})`});objects.forEach(o=>{let g=el('g',{transform:`rotate(${o.rotation||0} ${o.x+o.w/2} ${o.y+o.h/2})`},group);let sh=el('rect',{x:o.x,y:o.y,width:o.w,height:o.h,fill:'transparent',stroke:'transparent','pointer-events':'all','data-object':o.id,'data-hit-id':o.id},g)});let pg=el('g',{transform:`translate(${ox},${oy}) scale(${s})`});plants.forEach(p=>el('circle',{cx:p.x,cy:p.y,r:p.d/2,fill:'transparent',stroke:'transparent','pointer-events':'all','data-object':p.id,'data-hit-id':p.id},pg));}
const oldRender=render;render=function(){oldRender();attachHits()};
svg.addEventListener('pointermove',e=>{if(!gesture)return;let p=snapPoint(screenPoint(e)),o=objects.find(z=>z.id===gesture.id)||plants.find(z=>z.id===gesture.id);if(gesture.kind==='draw'){gesture.preview=newObj(gesture.type,gesture.start,p);render();let q=gesture.preview,g=el('g',{transform:`translate(${ox},${oy}) scale(${scale*zoom})`});geometry(q,g)}else if(o&&gesture.kind==='move'){o.x=gesture.original.x+p.x-gesture.start.x;o.y=gesture.original.y+p.y-gesture.start.y;render()}else if(o&&gesture.kind==='resize'&&!plants.includes(o)){o.w=Math.max(.15,gesture.original.w+p.x-gesture.start.x);o.h=Math.max(.15,gesture.original.h+p.y-gesture.start.y);render()}});
svg.addEventListener('pointerup',()=>{if(!gesture)return;if(gesture.kind==='draw'&&gesture.preview&&gesture.preview.w>.08&&gesture.preview.h>.08){objects.push(gesture.preview);selected=gesture.preview.id}gesture=null;render()});
function finishPoly(){if(poly.length<3)return;snapshot();let xs=poly.map(p=>p.x),ys=poly.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,c=defaults.polygon;objects.push({id:uid(),type:'polygon',x,y,w,h,points:poly.map(p=>({x:p.x,y:p.y})),rotation:0,fill:c[0],stroke:c[1],name:'Fri form'});selected=objects.at(-1).id;poly=[];render()}$('finishPolygon').onclick=finishPoly;
function applyEditor(){let o=objects.find(z=>z.id===selected)||plants.find(z=>z.id===selected);if(!o)return;snapshot();let plant=plants.includes(o);o.name=$('objName').value;o.rotation=+$('objRotation').value||0;if(!plant){o.fill=$('objFill').value;o.stroke=$('objStroke').value;}o.x=+$('objX').value||0;o.y=+$('objY').value||0;if(plant)o.d=Math.max(.1,+$('objW').value||o.d);else{o.w=Math.max(.1,+$('objW').value||o.w);o.h=Math.max(.1,+$('objH').value||o.h)}render()}
['objName','objW','objH','objRotation','objFill','objStroke','objX','objY'].forEach(id=>$(id).addEventListener('change',applyEditor));$('duplicate').onclick=()=>{let o=objects.find(z=>z.id===selected)||plants.find(z=>z.id===selected);if(!o)return;snapshot();let c=clone(o);c.id=uid();c.x+=.5;c.y+=.5;(plants.includes(o)?plants:objects).push(c);selected=c.id;render()};$('delete').onclick=()=>{snapshot();objects=objects.filter(o=>o.id!==selected);plants=plants.filter(o=>o.id!==selected);selected=null;render()};$('raise').onclick=()=>reorder(1);$('lower').onclick=()=>reorder(-1);function reorder(d){let i=objects.findIndex(o=>o.id===selected);if(i<0)return;snapshot();let j=clamp(i+d,0,objects.length-1),[o]=objects.splice(i,1);objects.splice(j,0,o);render()}
$('applyPlan').onclick=()=>{W=clamp(+$('planW').value||20,2,200);H=clamp(+$('planH').value||14,2,200);render()};$('gridToggle').onchange=e=>{grid=e.target.checked;render()};$('snapToggle').onchange=e=>{snap=e.target.checked};['northAngle','sunAngle'].forEach(id=>$(id).addEventListener('change',()=>{let n=((Number($(id).value)||0)%360+360)%360;$(id).value=n;render()}));['showCompass','showSun'].forEach(id=>$(id).addEventListener('change',render));$('zoomIn').onclick=()=>{zoom=clamp(zoom*1.15,.5,2.5);$('zoomLabel').textContent=Math.round(zoom*100)+' %';render()};$('zoomOut').onclick=()=>{zoom=clamp(zoom/1.15,.5,2.5);$('zoomLabel').textContent=Math.round(zoom*100)+' %';render()};$('fit').onclick=()=>{zoom=1;$('zoomLabel').textContent='100 %';render()};
$('styleType').onchange=()=>{let c=defaults[$('styleType').value]||defaults.rect;$('styleFill').value=c[0];$('styleStroke').value=c[1]};$('applyStyle').onclick=()=>{let t=$('styleType').value;defaults[t]=[$('styleFill').value,$('styleStroke').value];$('status').textContent='Standardfärg sparad för '+t};$('makePath').onclick=()=>{let m=$('pathSize').value.toLowerCase().replace(/\s/g,'').match(/^(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)m?$/);if(!m){alert('Ange mått som exempelvis 12x1m');return}snapshot();let w=+m[1].replace(',','.'),h=+m[2].replace(',','.');let o={id:uid(),type:'path',x:1,y:1,w,h,rotation:0,fill:defaults.path[0],stroke:defaults.path[1],name:'Gång'};objects.push(o);selected=o.id;render()};
$('undo').onclick=()=>{if(!undoStack.length)return;redoStack.push(JSON.stringify({objects,plants}));let d=JSON.parse(undoStack.pop());objects=d.objects;plants=d.plants;selected=null;render()};$('redo').onclick=()=>{if(!redoStack.length)return;undoStack.push(JSON.stringify({objects,plants}));let d=JSON.parse(redoStack.pop());objects=d.objects;plants=d.plants;selected=null;render()};

// Separate vegetation cleanup: background geometry is never touched.
$('deletePlants').onclick=()=>{
  if(!plants.length)return;
  if(!confirm(`Ta bort samtliga ${plants.length} placerade växter? Former och bakgrundsytor påverkas inte.`))return;
  snapshot();plants=[];if(selected&&!objects.some(o=>o.id===selected))selected=null;render();
};

// Purchase calculator. Plant counts are exact; area-derived material quantities are estimates.
let customPurchases=[];
function shapeArea(o){
  if(o.type==='circle')return Math.PI*Math.pow(Math.max(o.w,o.h)/2,2);
  if(o.type==='ellipse')return Math.PI*(o.w/2)*(o.h/2);
  if(o.type==='semi')return Math.PI*(o.w/2)*o.h/2;
  if(o.type==='triangle')return o.w*o.h/2;
  if(o.type==='diamond')return o.w*o.h/2;
  if(o.type==='polygon'&&o.points?.length>2){let a=0;for(let i=0;i<o.points.length;i++){let p=o.points[i],q=o.points[(i+1)%o.points.length];a+=p.x*q.y-q.x*p.y;}return Math.abs(a/2);}
  return o.w*o.h;
}
function renderPurchases(){
  let lines=[],plantGroups={};
  plants.forEach(p=>{let k=p.name;plantGroups[k]=(plantGroups[k]||0)+1});
  Object.entries(plantGroups).forEach(([name,qty])=>lines.push({key:'plant:'+name,name,qty,unit:'st',kind:'Växter'}));
  let byType={};objects.forEach(o=>{byType[o.type]=(byType[o.type]||0)+shapeArea(o)});
  const labels={bed:'Rabatt',path:'Gång',lawn:'Gräsyta'};
  Object.entries(byType).forEach(([type,area])=>lines.push({key:'area:'+type,name:(labels[type]||'Form')+' – yta',qty:area,unit:'m²',kind:'Ytberäkning'}));
  let total=0;
  $('autoPurchaseLines').innerHTML=lines.map(line=>{
    let id='price_'+line.key.replace(/[^a-z0-9]/gi,'_'),saved=window.__purchasePrices?.[line.key]||0;
    total+=line.qty*saved;
    return `<div class="purchase-row"><div class="purchase-meta"><div><strong>${line.name}</strong><small>${line.kind} · ${line.qty.toFixed(2)} ${line.unit}</small></div><label>Pris / ${line.unit}<input data-auto-price="${line.key}" type="number" min="0" step="0.01" value="${saved}"></label></div><small>Radtotal: ${(line.qty*saved).toFixed(2)} kr</small></div>`;
  }).join('')||'<p class="hint">Placera växter eller rita former för att skapa automatiska kalkylrader.</p>';
  document.querySelectorAll('[data-auto-price]').forEach(input=>input.onchange=()=>{window.__purchasePrices=window.__purchasePrices||{};window.__purchasePrices[input.dataset.autoPrice]=Math.max(0,Number(input.value)||0);renderPurchases()});
  $('customPurchaseLines').innerHTML=customPurchases.map((p,i)=>`<div class="purchase-row"><div class="purchase-meta"><div><strong>${p.name}</strong><small>${p.qty} ${p.unit} × ${p.price.toFixed(2)} kr</small></div><strong>${(p.qty*p.price).toFixed(2)} kr</strong></div><button data-remove-purchase="${i}" class="danger">Ta bort</button></div>`).join('');
  document.querySelectorAll('[data-remove-purchase]').forEach(b=>b.onclick=()=>{customPurchases.splice(+b.dataset.removePurchase,1);renderPurchases()});
  total+=customPurchases.reduce((s,p)=>s+p.qty*p.price,0);
  $('budgetTotal').textContent=total.toLocaleString('sv-SE',{maximumFractionDigits:2})+' kr';
}
$('addPurchase').onclick=()=>{
  let name=$('purchaseName').value.trim(),qty=Math.max(0,Number($('purchaseQty').value)||0),price=Math.max(0,Number($('purchasePrice').value)||0);
  if(!name){alert('Ange namn på inköpsposten.');return}
  customPurchases.push({name,qty,unit:$('purchaseUnit').value,price});$('purchaseName').value='';renderPurchases();
};
function project(){return{app:'Tradgardsplanerare',version:3,name:$('projectName').value,place:$('projectPlace').value,width:W,height:H,objects,plants,defaults,compass:{north:+$('northAngle').value,sun:+$('sunAngle').value,showCompass:$('showCompass').checked,showSun:$('showSun').checked},purchasePrices:window.__purchasePrices||{},customPurchases}}function download(data,name,type){let a=document.createElement('a'),u=URL.createObjectURL(new Blob([data],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)}$('saveProject').onclick=()=>download(JSON.stringify(project(),null,2),($('projectName').value||'tradgardsprojekt')+'.json','application/json');$('openProject').onclick=()=>$('fileInput').click();$('fileInput').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let d=JSON.parse(await f.text());if(!Array.isArray(d.objects))throw Error('Projektfilen saknar objektlista');objects=d.objects;plants=d.plants||[];W=d.width||20;H=d.height||14;Object.assign(defaults,d.defaults||{});window.__purchasePrices=d.purchasePrices||{};customPurchases=d.customPurchases||[];$('planW').value=W;$('planH').value=H;$('projectName').value=d.name||'Importerat projekt';$('projectPlace').value=d.place||'';if(d.compass){$('northAngle').value=d.compass.north??0;$('sunAngle').value=d.compass.sun??135;$('showCompass').checked=d.compass.showCompass!==false;$('showSun').checked=d.compass.showSun!==false}selected=null;render();$('status').textContent='Projekt öppnat'}catch(err){alert('Kunde inte öppna projektet: '+err.message)}e.target.value=''};$('exportPdf').onclick=()=>window.print();$('newProject').onclick=()=>{if(!confirm('Skapa nytt projekt? Spara först om du vill behålla ändringarna.'))return;snapshot();objects=[];plants=[];selected=null;W=20;H=14;$('planW').value=20;$('planH').value=14;$('projectName').value='Nytt trädgårdsprojekt';render()};
render();
})();
