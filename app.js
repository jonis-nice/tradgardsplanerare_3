(()=>{'use strict';
const $=id=>document.getElementById(id),svg=$('drawing'),NS='http://www.w3.org/2000/svg';let W=20,H=14,scale=42,ox=80,oy=55,zoom=1,tool='select',objects=[],plants=[],selected=null,selectedIds=[],gesture=null,poly=[],undoStack=[],redoStack=[],grid=true,snap=false,hiddenLayers=new Set(),backgroundData=null;
const defaults={bed:['#b8cba9','#71866c'],path:['#c5b7a3','#887760'],lawn:['#c8d9b9','#78936b'],rect:['#d6d9d2','#818982'],roundedRect:['#d6d9d2','#818982'],ellipse:['#d6d9d2','#818982'],circle:['#d6d9d2','#818982'],semi:['#d6d9d2','#818982'],quarter:['#d6d9d2','#818982'],quarterStretch:['#d6d9d2','#818982'],triangle:['#d6d9d2','#818982'],diamond:['#d6d9d2','#818982'],polygon:['#d6d9d2','#818982'],tree:['#d4dfc9','#708b65']};
const clone=o=>JSON.parse(JSON.stringify(o)),uid=()=>Math.random().toString(36).slice(2,10),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function snapshot(){undoStack.push(JSON.stringify({objects,plants,backgroundData}));if(undoStack.length>80)undoStack.shift();redoStack=[]}
function px(v){return v*scale*zoom}
function screenPoint(e){const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const q=pt.matrixTransform(svg.getScreenCTM().inverse());return{x:(q.x-ox)/scale/zoom,y:(q.y-oy)/scale/zoom}}function snapPoint(p){return snap?{x:Math.round(p.x),y:Math.round(p.y)}:p}
function el(tag,attrs={},parent=svg){let n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));parent.appendChild(n);return n}
function shapeCenter(o){if(o.type==='quarter'||o.type==='quarterStretch')return{x:o.x,y:o.y+o.h};if(o.type==='semi')return{x:o.x+o.w/2,y:o.y+o.h};return{x:o.x+o.w/2,y:o.y+o.h/2};}
function rotationHandlePoint(o){const c=shapeCenter(o);if(o.type==='quarter'||o.type==='quarterStretch')return{x:o.x+o.w*.72,y:o.y+o.h*.28};if(o.type==='semi')return{x:o.x+o.w/2,y:o.y-.55};return{x:o.x+o.w/2,y:o.y-.55};}
function angleFrom(c,p){return Math.atan2(p.y-c.y,p.x-c.x)*180/Math.PI;}
function angleDelta(a,b){let d=(a-b+540)%360-180;return d;}
function toLocalPoint(p,o,rotation){const c=shapeCenter(o),a=-(Number(rotation)||0)*Math.PI/180,dx=p.x-c.x,dy=p.y-c.y;return{x:c.x+dx*Math.cos(a)-dy*Math.sin(a),y:c.y+dx*Math.sin(a)+dy*Math.cos(a)};}
function geometry(o,g){let x=o.x,y=o.y,w=o.w,h=o.h,shape;let cx=x+w/2,cy=y+h/2;let target=(o.flipX||o.flipY)?el('g',{transform:`translate(${cx} ${cy}) scale(${o.flipX?-1:1} ${o.flipY?-1:1}) translate(${-cx} ${-cy})`},g):g;switch(o.type){case'ellipse':case'circle':shape=el('ellipse',{cx,cy,rx:w/2,ry:h/2},target);break;case'semi':shape=el('path',{d:`M ${x} ${y+h} A ${w/2} ${h} 0 0 1 ${x+w} ${y+h} Z`},target);break;case'quarter':case'quarterStretch':{let rx=o.type==='quarter'?Math.min(w,h):w,ry=o.type==='quarter'?Math.min(w,h):h,cx=x,cy=y+h;shape=el('path',{d:`M ${cx} ${cy} L ${cx+rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx} ${cy-ry} Z`},target);break;}case'triangle':shape=el('polygon',{points:`${x+w/2},${y} ${x+w},${y+h} ${x},${y+h}`},target);break;case'diamond':shape=el('polygon',{points:`${x+w/2},${y} ${x+w},${y+h/2} ${x+w/2},${y+h} ${x},${y+h/2}`},target);break;case'polygon':shape=el('polygon',{points:(o.points||[]).map(p=>`${p.x},${p.y}`).join(' ')},target);break;default:shape=el('rect',{x,y,width:w,height:h,rx:o.type==='roundedRect'?Math.min(0.35,Math.min(w,h)*0.18):0},target)}shape.setAttribute('fill',o.fill);shape.setAttribute('fill-opacity',o.type==='path'?.9:.72);shape.setAttribute('stroke',o.stroke);shape.setAttribute('stroke-width',1.5);shape.setAttribute('vector-effect','non-scaling-stroke');}
function render(){let vb=svg.viewBox.baseVal;if(!vb||!vb.width)svg.setAttribute('viewBox','0 0 1000 700');svg.innerHTML='';let bg=el('rect',{x:0,y:0,width:1000,height:700,fill:'#fff'});let content=el('g',{});let s=scale*zoom;let worldW=W*s,worldH=H*s;ox=Math.max(20,(1000-worldW)/2);oy=Math.max(20,(700-worldH)/2);if(grid){let gg=el('g',{stroke:'#e9eee8','stroke-width':1});for(let x=0;x<=W;x++)el('line',{x1:ox+x*s,y1:oy,x2:ox+x*s,y2:oy+worldH},gg);for(let y=0;y<=H;y++)el('line',{x1:ox,y1:oy+y*s,x2:ox+worldW,y2:oy+y*s},gg)}el('rect',{x:ox,y:oy,width:worldW,height:worldH,fill:'none',stroke:'#aebaae','stroke-width':1.5});
if(backgroundData){el('image',{x:ox,y:oy,width:worldW,height:worldH,href:backgroundData,preserveAspectRatio:'none',opacity:.48});}let base=el('g',{transform:`translate(${ox},${oy}) scale(${s})`});objects.forEach(o=>{if(hiddenLayers.has(o.layer||'Markytor'))return;let rc=shapeCenter(o);let g=el('g',{transform:`rotate(${o.rotation||0} ${rc.x} ${rc.y})`,'data-object':o.id},base);geometry(o,g);if(o.id===selected||selectedIds.includes(o.id)){el('rect',{x:o.x,y:o.y,width:o.w,height:o.h,fill:'none',stroke:'#2f6242','stroke-width':1/s,'stroke-dasharray':`${5/s} ${3/s}`,'pointer-events':'none'},g);el('circle',{cx:o.x+o.w,cy:o.y+o.h,r:7/s,fill:'#fff',stroke:'#2f6242','stroke-width':1.7/s,'data-handle':'resize','data-handle-id':o.id,'pointer-events':'all',style:'cursor:nwse-resize'});let hp=rotationHandlePoint(o);el('line',{x1:(o.type==='quarter'||o.type==='quarterStretch')?o.x+o.w*.5:o.x+o.w/2,y1:(o.type==='quarter'||o.type==='quarterStretch')?o.y+o.h*.5:o.y,x2:hp.x,y2:hp.y,stroke:'#2f6242','stroke-width':1/s,'pointer-events':'none'});el('circle',{cx:hp.x,cy:hp.y,r:7/s,fill:'#2f6242',stroke:'#fff','stroke-width':1.7/s,'data-handle':'rotate','data-handle-id':o.id,'pointer-events':'all',style:'cursor:grab'});}});
// Liveförhandsvisning av former ritas i samma renderpass som resten av ritningen.
if(gesture?.kind==='draw'&&gesture.preview){let q=gesture.preview;let pg=el('g',{transform:`translate(${ox},${oy}) scale(${s})`,'pointer-events':'none'});geometry(q,pg);}
// Växtsymboler: enkel, tydlig planvy med botaniskt vald grundfärg (ingen dekorativ grenstruktur).
let plantLayer=el('g',{transform:`translate(${ox},${oy}) scale(${s})`});
plants.forEach(p=>{
  if(hiddenLayers.has(p.layer||'Plantering'))return;
  let g=el('g',{transform:`rotate(${p.rotation||0} ${p.x} ${p.y})`,'data-object':p.id},plantLayer);
  let r=Math.max(.08,p.d/2),col=p.color||'#78936b',edge=p.edge||(/Forsythia|Spirea|Berberis|Rönn|oxbär|kvitten|smällspirea/i.test(p.name)?'toothed':(p.category==='Buskar'?'leafy':'smooth'));
  if(edge==='smooth'){el('circle',{cx:p.x,cy:p.y,r,fill:col,'fill-opacity':.30,stroke:col,'stroke-width':1.25/s},g);}
  else{let pts=[],count=edge==='toothed'?64:48,lobes=edge==='toothed'?16:12;for(let i=0;i<count;i++){let a=2*Math.PI*i/count,phase=(i/count*lobes)%1;let mod=edge==='toothed'?(phase<.5?.88:1.06):(0.92+0.10*Math.cos(2*Math.PI*phase));let rr=r*mod;pts.push(`${(p.x+Math.cos(a)*rr).toFixed(4)},${(p.y+Math.sin(a)*rr).toFixed(4)}`)}el('polygon',{points:pts.join(' '),fill:col,'fill-opacity':.30,stroke:col,'stroke-width':1.25/s,'stroke-linejoin':'round'},g);}
  el('circle',{cx:p.x,cy:p.y,r:r*.13,fill:col,'fill-opacity':.8},g);
  if(p.id===selected||selectedIds.includes(p.id))el('circle',{cx:p.x,cy:p.y,r:r+3/s,fill:'none',stroke:'#2f6242','stroke-width':1.5/s,'stroke-dasharray':`${4/s} ${3/s}`},g);
});
// Synlig förhandsvisning av fri form medan hörnpunkterna placeras.
if(tool==='polygon'&&poly.length){let pts=poly.map(p=>`${ox+p.x*s},${oy+p.y*s}`).join(' ');if(poly.length>=3)el('polygon',{points:pts,fill:'#b8cba9','fill-opacity':.38,stroke:'#426b50','stroke-width':2.5,'stroke-linejoin':'round','stroke-dasharray':'6 4'});else if(poly.length>1)el('polyline',{points:pts,fill:'none',stroke:'#426b50','stroke-width':2.5,'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':'6 4'});poly.forEach((p,i)=>el('circle',{cx:ox+p.x*s,cy:oy+p.y*s,r:i===poly.length-1?5:3.5,fill:i===poly.length-1?'#426b50':'#fff',stroke:'#426b50','stroke-width':1.5}));}
// Temporary lasso overlay for multi-plant selection.
if(gesture?.kind==='lasso'&&gesture.current){let a=gesture.start,b=gesture.current;el('rect',{x:ox+Math.min(a.x,b.x)*s,y:oy+Math.min(a.y,b.y)*s,width:Math.abs(b.x-a.x)*s,height:Math.abs(b.y-a.y)*s,fill:'#4d8055','fill-opacity':.10,stroke:'#376b45','stroke-width':1.5,'stroke-dasharray':'6 4'});}
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
  el('text',{x:nx*34,y:ny*34,'text-anchor':'middle','dominant-baseline':'middle','font-size':10,'font-weight':700,fill:'#b52d2d'},cg).textContent='N';
  el('text',{x:-nx*32,y:-ny*32,'text-anchor':'middle','dominant-baseline':'middle','font-size':9,'font-weight':700,fill:'#45534a'},cg).textContent='S';
}
if($('showSun').checked){
  let a=sun*Math.PI/180, x=Math.sin(a)*43,y=-Math.cos(a)*43;
  let sg=el('g',{},svg);
  el('path',{d:`M ${ox+worldW-42} ${oy+42} L ${ox+worldW-42+x} ${oy+42+y}`,stroke:'#c58b48','stroke-width':1.6,'stroke-dasharray':'3 3','stroke-opacity':.7},sg);
  el('circle',{cx:ox+worldW-42+x,cy:oy+42+y,r:6,fill:'#e6b75b',stroke:'#b88736','stroke-width':1},sg);
}
$('shapeCount').textContent=objects.length+' objekt';renderLayers();updateEditor();if($('budgetTotal'))renderPurchases();}
function polygonArea(pts){let a=0;for(let i=0;i<pts.length;i++){let q=pts[(i+1)%pts.length];a+=pts[i].x*q.y-q.x*pts[i].y;}return Math.abs(a/2)}
function renderLayers(){let names=['Plantering','Markytor','Konstruktioner','Detaljer'];$('layerControls').innerHTML=names.map(n=>`<label class=\"check layerrow\"><span>${n}</span><input type=\"checkbox\" data-layer=\"${n}\" ${hiddenLayers.has(n)?'':'checked'}></label>`).join('');$('layerControls').querySelectorAll('[data-layer]').forEach(c=>c.onchange=()=>{if(c.checked)hiddenLayers.delete(c.dataset.layer);else hiddenLayers.add(c.dataset.layer);render()});}
function updateEditor(){let o=objects.find(x=>x.id===selected)||plants.find(x=>x.id===selected);if(selectedIds.length>1){$('emptySelection').classList.remove('hidden');$('editor').classList.add('hidden');$('emptySelection').textContent=selectedIds.length+' växter markerade. Dra någon av dem för att flytta gruppen eller använd Ta bort markerade.';$('multiSelectionActions')?.classList.remove('hidden');return;}$('multiSelectionActions')?.classList.add('hidden');$('emptySelection').classList.toggle('hidden',!!o);$('editor').classList.toggle('hidden',!o);if(!o){$('emptySelection').textContent='Markera en form eller växt för att redigera den.';return;}let plant=plants.includes(o);$('objName').value=o.name||o.type;$('objectLayer').value=o.layer||(plant?'Plantering':'Markytor');$('objW').value=plant?o.d:o.w;$('objH').value=plant?o.d:o.h;$('objRotation').value=o.rotation||0;$('objFill').value=o.fill||'#d4dfc9';$('objStroke').value=o.stroke||'#708b65';$('objFill').disabled=plant;$('objStroke').disabled=plant;$('orientationTools').classList.toggle('hidden',plant||!['semi','quarter','quarterStretch'].includes(o.type));$('flipHorizontal').textContent=o.flipX?'Återställ vänster/höger':'Vänd vänster/höger';$('flipVertical').textContent=o.flipY?'Återställ upp/ner':'Vänd upp/ner';$('rotateQuarterTurn').textContent='Rotera 90°';$('objX').value=o.x;$('objY').value=o.y;$('measureInfo').textContent=plant?`${o.latin||''} · ${o.category||'Växt'} · Höjd ca ${o.height||'?'} m · Avstånd ${o.spacing||'?'} cm · ${o.light||''} · Blomning ${o.bloom||'–'} · Symboldiameter: ${o.d.toFixed(2)} m`:`Bredd: ${o.w.toFixed(2)} m · Höjd: ${o.h.toFixed(2)} m · Area: ${o.type==='polygon'&&o.points?polygonArea(o.points).toFixed(2):(o.w*o.h).toFixed(2)} m² · ${o.type==='polygon'&&o.points?'Fri form':'Rektangulärt mått'}`;}
function setTool(t){tool=t;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('selected',b.dataset.tool===t));$('finishPolygon').classList.toggle('hidden',t!=='polygon');$('toolHelp').textContent=t==='select'?'Markera, flytta och ändra storlek på objekt.':t==='polygon'?'Klicka ut hörnpunkter – linjen visas direkt. Välj Avsluta fri form när du är klar.':t==='plantSelect'?'Dra en ruta runt flera växter. Dra sedan någon av de markerade för att flytta gruppen.':'Dra på ritningen för att skapa en form.'}
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
document.addEventListener('keydown',e=>{
 if(e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
 const mod=e.ctrlKey||e.metaKey;
 if(mod&&e.key.toLowerCase()==='x'){e.preventDefault();cutSelected();}
 if(mod&&e.key.toLowerCase()==='v'){e.preventDefault();pasteClipboard();}
 if(e.key==='Escape'&&tool==='polygon'){poly=[];setTool('select');render();$('status').textContent='Fri form avbruten.';}
});
function newObj(type,a,b){let x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.max(.15,Math.abs(b.x-a.x)),h=Math.max(.15,Math.abs(b.y-a.y));if(type==='circle'||type==='quarter'){let d=Math.max(w,h);w=h=d}let c=defaults[type]||defaults.rect;return{id:uid(),type,x,y,w,h,rotation:0,layer:['bed','path','lawn'].includes(type)?'Markytor':'Konstruktioner',fill:c[0],stroke:c[1],name:type==='bed'?'Rabatt':type==='path'?'Gång':type==='lawn'?'Gräsyta':type==='roundedRect'?'Rundad form':type==='quarterStretch'?'Töjbar kvartscirkel':'Form'};}
let selectedCatalogPlant=null;
function plantInfo(p){return `<b>${p.name}</b><br><i>${p.latin}</i><br>${p.category} · Höjd ca ${p.height} m · Planeringsdiameter ${p.diameter} m<br>Planteringsavstånd ${p.spacing} cm · ${p.light}<br>Blomning: ${p.bloom}`}
function renderCatalog(){let q=$('plantSearch').value.trim().toLocaleLowerCase('sv'),cat=$('plantCategory').value;let list=(window.PLANT_CATALOG||[]).filter(p=>(cat==='Alla'||p.category===cat)&&(!q||(p.name+' '+p.latin).toLocaleLowerCase('sv').includes(q)));$('plantCount').textContent=(window.PLANT_CATALOG||[]).length;$('plantResults').innerHTML='';list.forEach(p=>{let b=document.createElement('button');b.className='plant-item'+(selectedCatalogPlant?.id===p.id?' active':'');b.innerHTML=`<span class="plant-dot" style="--plant-color:${p.color}"></span><span><strong>${p.name}</strong><em>${p.latin}</em></span>`;b.onclick=()=>{selectedCatalogPlant=p;$('plantSelected').innerHTML=plantInfo(p);$('placePlant').disabled=false;setTool('plant');$('status').textContent='Vald växt: '+p.name+' – klicka i ritningen för att placera';renderCatalog()};$('plantResults').appendChild(b)});}
$('plantSearch').addEventListener('input',renderCatalog);$('plantCategory').addEventListener('change',renderCatalog);$('placePlant').onclick=()=>{if(!selectedCatalogPlant)return;setTool('plant');$('status').textContent='Klicka i ritningen för att placera '+selectedCatalogPlant.name};renderCatalog();
svg.addEventListener('pointerdown',e=>{let p=snapPoint(screenPoint(e)),hit=e.target.closest('[data-handle]');
 if(tool==='plant'&&selectedCatalogPlant){snapshot();let d=selectedCatalogPlant.diameter;let item={...clone(selectedCatalogPlant),id:uid(),x:p.x,y:p.y,d,rotation:0,layer:'Plantering'};plants.push(item);selected=item.id;selectedIds=[];setTool('select');render();$('status').textContent='Placerade '+item.name+' – Markera är aktivt. Dra växten för att flytta den.';return;}
 if(tool==='plantSelect'){p=screenPoint(e);gesture={kind:'lasso',start:p,current:p};svg.setPointerCapture(e.pointerId);return;}
 if(hit){let id=hit.getAttribute('data-handle-id')||selected,o=objects.find(z=>z.id===id);if(o){selected=o.id;selectedIds=[];snapshot();if(hit.getAttribute('data-handle')==='rotate'){let c=shapeCenter(o);gesture={kind:'rotate',id:o.id,center:c,startAngle:angleFrom(c,p),original:clone(o)};}else{let localStart=toLocalPoint(p,o,o.rotation||0);gesture={kind:'resize',id:o.id,start:localStart,original:clone(o)};}svg.setPointerCapture(e.pointerId);return}}
 let target=e.target.closest('[data-object]');if(target){let id=target.getAttribute('data-object');
  if(tool==='select'&&selectedIds.includes(id)){snapshot();gesture={kind:'moveGroup',ids:[...selectedIds],start:p,originals:[...objects,...plants].filter(z=>selectedIds.includes(z.id)).map(clone)};svg.setPointerCapture(e.pointerId);return;}
  selected=id;selectedIds=[];
  if(tool==='select'){snapshot();let o=objects.find(z=>z.id===id)||plants.find(z=>z.id===id);gesture={kind:'move',id,start:p,original:clone(o),groupOriginals:o.groupId?plants.filter(q=>q.groupId===o.groupId&&q.id!==o.id).map(clone):[]};svg.setPointerCapture(e.pointerId);render();return;}}
 if(tool==='select'){selected=null;selectedIds=[];render();return;}if(tool==='polygon'){poly.push(p);render();return;}snapshot();gesture={kind:'draw',start:p,type:tool,preview:null};svg.setPointerCapture(e.pointerId)});
svg.addEventListener('pointermove',e=>{if(!gesture)return;let p=snapPoint(screenPoint(e)),o=objects.find(z=>z.id===gesture.id)||plants.find(z=>z.id===gesture.id);
 if(gesture.kind==='lasso'){gesture.current=p;render();}
 else if(gesture.kind==='draw'){gesture.preview=newObj(gesture.type,gesture.start,p);render()}
 else if(o&&gesture.kind==='move'){let dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;o.x=gesture.original.x+dx;o.y=gesture.original.y+dy;if(gesture.groupOriginals?.length){gesture.groupOriginals.forEach(orig=>{let q=plants.find(z=>z.id===orig.id);if(q){q.x=orig.x+dx;q.y=orig.y+dy;}})}if(o.type==='polygon'&&gesture.original.points){o.points=gesture.original.points.map(pt=>({x:pt.x+dx,y:pt.y+dy}));}render()}
 else if(gesture.kind==='moveGroup'){let dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;gesture.originals.forEach(orig=>{let item=plants.find(z=>z.id===orig.id)||objects.find(z=>z.id===orig.id);if(item){item.x=orig.x+dx;item.y=orig.y+dy;}});render();}
 else if(o&&gesture.kind==='rotate'){let a=angleFrom(gesture.center,p);o.rotation=(gesture.original.rotation||0)+angleDelta(a,gesture.startAngle);render()}
 else if(o&&gesture.kind==='resize'&&!plants.includes(o)){let local=toLocalPoint(p,gesture.original,gesture.original.rotation||0),dx=local.x-gesture.start.x,dy=local.y-gesture.start.y,orig=gesture.original;if(orig.type==='circle'){let d=Math.max(.15,Math.max(orig.w+dx,orig.h+dy));o.w=d;o.h=d;}else if(orig.type==='quarter'||orig.type==='quarterStretch'){let pivotY=orig.y+orig.h;o.w=Math.max(.15,orig.w+dx);o.h=Math.max(.15,orig.h-dy);if(orig.type==='quarter'){let d=Math.max(.15,Math.max(o.w,o.h));o.w=d;o.h=d;}o.x=orig.x;o.y=pivotY-o.h;}else{o.w=Math.max(.15,orig.w+dx);o.h=Math.max(.15,orig.h+dy);if(orig.type==='polygon'&&orig.points){o.points=orig.points.map(pt=>({x:pt.x+(dx>0?0:dx),y:pt.y+(dy>0?0:dy)}));}}render()}});
svg.addEventListener('pointerup',()=>{if(!gesture)return;if(gesture.kind==='draw'&&gesture.preview&&gesture.preview.w>.08&&gesture.preview.h>.08){objects.push(gesture.preview);selected=gesture.preview.id;selectedIds=[];setTool('select');$('status').textContent='Form placerad – Markera är aktivt. Dra formen för att flytta den.'}
 if(gesture.kind==='lasso'){let a=gesture.start,b=gesture.current||gesture.start,x1=Math.min(a.x,b.x),x2=Math.max(a.x,b.x),y1=Math.min(a.y,b.y),y2=Math.max(a.y,b.y);selectedIds=plants.filter(p=>p.x>=x1&&p.x<=x2&&p.y>=y1&&p.y<=y2).map(p=>p.id);selected=selectedIds.length===1?selectedIds[0]:null;setTool('select');$('status').textContent=selectedIds.length+' växter markerade';}
 if(gesture.kind==='moveGroup'){$('status').textContent=gesture.ids.length+' markerade objekt flyttade';}
 gesture=null;render()});
svg.addEventListener('pointercancel',()=>{if(gesture?.kind==='draw'){gesture=null;render();return;}gesture=null;render()});

function finishPoly(){if(poly.length<3)return;snapshot();let xs=poly.map(p=>p.x),ys=poly.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,c=defaults.polygon;objects.push({id:uid(),type:'polygon',x,y,w,h,points:poly.map(p=>({x:p.x,y:p.y})),rotation:0,layer:'Markytor',fill:c[0],stroke:c[1],name:'Fri form'});selected=objects.at(-1).id;poly=[];setTool('select');render();$('status').textContent='Fri form placerad – Markera är aktivt. Dra formen för att flytta den.'} $('finishPolygon').onclick=finishPoly;
function applyEditor(){let o=objects.find(z=>z.id===selected)||plants.find(z=>z.id===selected);if(!o)return;snapshot();let plant=plants.includes(o);o.name=$('objName').value;o.layer=$('objectLayer').value;o.rotation=+$('objRotation').value||0;if(!plant){o.fill=$('objFill').value;o.stroke=$('objStroke').value;}let oldX=o.x,oldY=o.y,newX=+$('objX').value||0,newY=+$('objY').value||0;if(!plant&&o.type==='polygon'&&o.points){let dx=newX-oldX,dy=newY-oldY;o.points=o.points.map(pt=>({x:pt.x+dx,y:pt.y+dy}));}o.x=newX;o.y=newY;if(plant)o.d=Math.max(.1,+$('objW').value||o.d);else{o.w=Math.max(.1,+$('objW').value||o.w);o.h=Math.max(.1,+$('objH').value||o.h)}render()}
['objName','objW','objH','objRotation','objFill','objStroke','objX','objY'].forEach(id=>$(id).addEventListener('change',applyEditor));
function flipSelected(axis){let o=objects.find(z=>z.id===selected);if(!o||!['semi','quarter','quarterStretch'].includes(o.type))return;snapshot();let key=axis==='x'?'flipX':'flipY';o[key]=!o[key];render()}$('flipHorizontal').onclick=()=>flipSelected('x');$('flipVertical').onclick=()=>flipSelected('y');$('rotateQuarterTurn').onclick=()=>{let o=objects.find(z=>z.id===selected);if(!o||!['semi','quarter','quarterStretch'].includes(o.type))return;snapshot();o.rotation=((Number(o.rotation)||0)+90)%360;render()};let shapeClipboard=null;
function cutSelected(){
 let ids=selectedIds.length?new Set(selectedIds):new Set(selected?[selected]:[]);
 if(!ids.size)return;
 snapshot();
 shapeClipboard={objects:clone(objects.filter(o=>ids.has(o.id))),plants:clone(plants.filter(p=>ids.has(p.id)))};
 objects=objects.filter(o=>!ids.has(o.id));plants=plants.filter(p=>!ids.has(p.id));
 selected=null;selectedIds=[];render();$('status').textContent='Markerat objekt urklippta – klistra in med Ctrl/Cmd+V.';
}
function pasteClipboard(){
 if(!shapeClipboard)return;
 snapshot();let newObjects=clone(shapeClipboard.objects),newPlants=clone(shapeClipboard.plants);
 [...newObjects,...newPlants].forEach(o=>{o.id=uid();o.x+=.5;o.y+=.5;if(o.type==='polygon'&&o.points)o.points=o.points.map(p=>({x:p.x+.5,y:p.y+.5}));});
 objects.push(...newObjects);plants.push(...newPlants);
 let all=[...newObjects,...newPlants];selected=all.length===1?all[0].id:null;selectedIds=all.length>1?all.map(o=>o.id):[];
 setTool('select');render();$('status').textContent='Urklippta objekt inklistrade.';
}
$('cutSelected').onclick=cutSelected;
$('duplicate').onclick=()=>{let o=objects.find(z=>z.id===selected)||plants.find(z=>z.id===selected);if(!o)return;snapshot();let c=clone(o);c.id=uid();c.x+=.5;c.y+=.5;(plants.includes(o)?plants:objects).push(c);selected=c.id;render()};$('delete').onclick=()=>{if(selectedIds.length){snapshot();let ids=new Set(selectedIds);plants=plants.filter(o=>!ids.has(o.id));objects=objects.filter(o=>!ids.has(o.id));selectedIds=[];selected=null;}else{if(!selected)return;snapshot();objects=objects.filter(o=>o.id!==selected);plants=plants.filter(o=>o.id!==selected);selected=null;}render()};$('deleteSelectedPlants').onclick=()=>{if(!selectedIds.length)return;snapshot();let ids=new Set(selectedIds);plants=plants.filter(p=>!ids.has(p.id));selectedIds=[];selected=null;render();$('status').textContent='Markerade växter borttagna'};$('raise').onclick=()=>reorder(1);$('lower').onclick=()=>reorder(-1);function reorder(d){let i=objects.findIndex(o=>o.id===selected);if(i<0)return;snapshot();let j=clamp(i+d,0,objects.length-1),[o]=objects.splice(i,1);objects.splice(j,0,o);render()}
$('applyPlan').onclick=()=>{W=clamp(+$('planW').value||20,2,200);H=clamp(+$('planH').value||14,2,200);render()};$('gridToggle').onchange=e=>{grid=e.target.checked;render()};$('snapToggle').checked=false;$('snapToggle').onchange=e=>{snap=e.target.checked};['northAngle','sunAngle'].forEach(id=>$(id).addEventListener('change',()=>{let n=((Number($(id).value)||0)%360+360)%360;$(id).value=n;render()}));['showCompass','showSun'].forEach(id=>$(id).addEventListener('change',render));$('zoomIn').onclick=()=>{zoom=clamp(zoom*1.15,.5,2.5);$('zoomLabel').textContent=Math.round(zoom*100)+' %';render()};$('zoomOut').onclick=()=>{zoom=clamp(zoom/1.15,.5,2.5);$('zoomLabel').textContent=Math.round(zoom*100)+' %';render()};$('fit').onclick=()=>{zoom=1;$('zoomLabel').textContent='100 %';render()};
$('styleType').onchange=()=>{let c=defaults[$('styleType').value]||defaults.rect;$('styleFill').value=c[0];$('styleStroke').value=c[1]};$('applyStyle').onclick=()=>{let t=$('styleType').value;defaults[t]=[$('styleFill').value,$('styleStroke').value];$('status').textContent='Standardfärg sparad för '+t};$('makePath').onclick=()=>{let m=$('pathSize').value.toLowerCase().replace(/\s/g,'').match(/^(\d+(?:[.,]\d+)?)x(\d+(?:[.,]\d+)?)m?$/);if(!m){alert('Ange mått som exempelvis 12x1m');return}snapshot();let w=+m[1].replace(',','.'),h=+m[2].replace(',','.');let o={id:uid(),type:'path',x:1,y:1,w,h,rotation:0,fill:defaults.path[0],stroke:defaults.path[1],name:'Gång'};objects.push(o);selected=o.id;render()};
$('undo').onclick=()=>{if(!undoStack.length)return;redoStack.push(JSON.stringify({objects,plants}));let d=JSON.parse(undoStack.pop());objects=d.objects;plants=d.plants;backgroundData=d.backgroundData||null;selected=null;selectedIds=[];render()};$('redo').onclick=()=>{if(!redoStack.length)return;undoStack.push(JSON.stringify({objects,plants}));let d=JSON.parse(redoStack.pop());objects=d.objects;plants=d.plants;backgroundData=d.backgroundData||null;selected=null;selectedIds=[];render()};

// Separate vegetation cleanup: background geometry is never touched.
$('deletePlants').onclick=()=>{
  if(!plants.length)return;
  if(!confirm(`Ta bort samtliga ${plants.length} placerade växter? Former och bakgrundsytor påverkas inte.`))return;
  snapshot();plants=[];selectedIds=[];if(selected&&!objects.some(o=>o.id===selected))selected=null;render();
};

// Purchase and supplier comparison. The app stores sourced offers; web search is opened for live checks.
let customPurchases=[];
let supplierOffers=[];
let selectedOffers={};
try{supplierOffers=JSON.parse(localStorage.getItem('tp3_supplier_offers')||'[]')}catch(_){supplierOffers=[]}
try{selectedOffers=JSON.parse(localStorage.getItem('tp3_selected_offers')||'{}')}catch(_){selectedOffers={}}
function persistOffers(){try{localStorage.setItem('tp3_supplier_offers',JSON.stringify(supplierOffers));localStorage.setItem('tp3_selected_offers',JSON.stringify(selectedOffers))}catch(_){}}
function shapeArea(o){
  if(o.type==='circle')return Math.PI*Math.pow(Math.max(o.w,o.h)/2,2);
  if(o.type==='ellipse')return Math.PI*(o.w/2)*(o.h/2);
  if(o.type==='semi')return Math.PI*o.w*o.h/4;
  if(o.type==='quarter'){let r=Math.min(o.w,o.h);return Math.PI*r*r/4;}
  if(o.type==='triangle')return o.w*o.h/2;
  if(o.type==='diamond')return o.w*o.h/2;
  if(o.type==='polygon'&&o.points?.length>2){let a=0;for(let i=0;i<o.points.length;i++){let p=o.points[i],q=o.points[(i+1)%o.points.length];a+=p.x*q.y-q.x*p.y;}return Math.abs(a/2);}
  return o.w*o.h;
}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function purchaseLines(){
  let lines=[],plantGroups={};plants.forEach(p=>{let k=p.name;plantGroups[k]=(plantGroups[k]||0)+1});
  Object.entries(plantGroups).forEach(([name,qty])=>lines.push({key:'plant:'+name,name,qty,unit:'st',kind:'Växter'}));
  let byType={};objects.forEach(o=>{byType[o.type]=(byType[o.type]||0)+shapeArea(o)});
  const labels={bed:'Rabatt',path:'Gång',lawn:'Gräsyta'};
  Object.entries(byType).forEach(([type,area])=>lines.push({key:'area:'+type,name:(labels[type]||'Form')+' – yta',qty:area,unit:'m²',kind:'Ytberäkning'}));
  return lines;
}
function grossUnitPrice(o){let v=Number(o.price)||0;return o.vatIncluded===false?v*(1+(Number(o.vat)||0)/100):v;}
function renderPurchases(){
  let lines=purchaseLines(),total=0,shippingBySupplier={};
  const target=$('offerTarget'),oldTarget=target.value;
  target.innerHTML='<option value="">Välj kalkylrad</option>'+lines.map(l=>`<option value="${escapeHtml(l.key)}">${escapeHtml(l.name)} (${l.unit})</option>`).join('');
  if(lines.some(l=>l.key===oldTarget))target.value=oldTarget;
  $('autoPurchaseLines').innerHTML=lines.map(line=>{
    let offers=supplierOffers.filter(o=>o.targetKey===line.key&&o.unit===line.unit);
    offers.sort((a,b)=>grossUnitPrice(a)-grossUnitPrice(b));
    let selected=offers.find(o=>o.id===selectedOffers[line.key])||offers[0];
    if(selected)selectedOffers[line.key]=selected.id;
    let manual=Number(window.__purchasePrices?.[line.key])||0;
    let unitPrice=selected?grossUnitPrice(selected):manual;
    let rowTotal=line.qty*unitPrice;total+=rowTotal;
    if(selected&&selected.supplier){let k=selected.supplier;shippingBySupplier[k]=Math.max(shippingBySupplier[k]||0,Number(selected.shipping)||0);}
    let selectHtml=offers.length?`<label>Leverantörsoffert<select data-offer-select="${escapeHtml(line.key)}">${offers.map(o=>`<option value="${escapeHtml(o.id)}" ${o.id===selected?.id?'selected':''}>${escapeHtml(o.supplier)} · ${grossUnitPrice(o).toFixed(2)} kr/${line.unit}</option>`).join('')}</select></label>`:`<label>Manuellt pris / ${line.unit}<input data-auto-price="${escapeHtml(line.key)}" type="number" min="0" step="0.01" value="${manual}"></label>`;
    let source=selected?(selected.url?`<a href="${escapeHtml(selected.url)}" target="_blank" rel="noopener">Produktkälla</a>`:`<span> ${escapeHtml(selected.supplier)} · kontrollerat ${escapeHtml(selected.checked||'datum saknas')}</span>`):'<span>Ingen offert kopplad</span>';
    let search=`https://www.google.com/search?q=${encodeURIComponent(line.name+' pris Sverige')}`;
    return `<div class="purchase-row"><div class="purchase-meta"><div><strong>${escapeHtml(line.name)}</strong><small>${line.kind} · ${line.qty.toFixed(2)} ${line.unit}</small></div>${selectHtml}</div><small>Radtotal: ${rowTotal.toLocaleString('sv-SE',{maximumFractionDigits:2})} kr · ${source} · <a href="${search}" target="_blank" rel="noopener">Sök svenska priser</a></small>${offers.length>1?`<small>${offers.length} jämförbara offerter · lägsta pris valt som standard</small>`:''}</div>`;
  }).join('')||'<p class="hint">Placera växter eller rita former för att skapa automatiska kalkylrader.</p>';
  document.querySelectorAll('[data-auto-price]').forEach(input=>input.onchange=()=>{window.__purchasePrices=window.__purchasePrices||{};window.__purchasePrices[input.dataset.autoPrice]=Math.max(0,Number(input.value)||0);renderPurchases()});
  document.querySelectorAll('[data-offer-select]').forEach(input=>input.onchange=()=>{selectedOffers[input.dataset.offerSelect]=input.value;persistOffers();renderPurchases()});
  $('supplierOffers').innerHTML=supplierOffers.map((o,i)=>`<div class="purchase-row"><strong>${escapeHtml(o.name)}</strong><small>${escapeHtml(o.supplier)} · ${escapeHtml(o.unit)} · ${Number(o.price).toFixed(2)} kr · moms ${Number(o.vat)||0}% · frakt ${Number(o.shipping)||0} kr</small><small>Kopplad till: ${escapeHtml(lines.find(l=>l.key===o.targetKey)?.name||'kalkylrad saknas')} · kontrollerat ${escapeHtml(o.checked||'ej angivet')}</small>${o.url?`<small><a href="${escapeHtml(o.url)}" target="_blank" rel="noopener">Öppna produkt</a></small>`:''}<button data-remove-offer="${i}" class="danger">Ta bort offert</button></div>`).join('')||'<p class="hint">Inga leverantörsofferter sparade ännu.</p>';
  document.querySelectorAll('[data-remove-offer]').forEach(b=>b.onclick=()=>{let o=supplierOffers.splice(+b.dataset.removeOffer,1)[0];if(o&&selectedOffers[o.targetKey]===o.id)delete selectedOffers[o.targetKey];persistOffers();renderPurchases()});
  $('customPurchaseLines').innerHTML=customPurchases.map((p,i)=>`<div class="purchase-row"><div class="purchase-meta"><div><strong>${escapeHtml(p.name)}</strong><small>${p.qty} ${escapeHtml(p.unit)} × ${p.price.toFixed(2)} kr</small></div><strong>${(p.qty*p.price).toFixed(2)} kr</strong></div><button data-remove-purchase="${i}" class="danger">Ta bort</button></div>`).join('');
  document.querySelectorAll('[data-remove-purchase]').forEach(b=>b.onclick=()=>{customPurchases.splice(+b.dataset.removePurchase,1);renderPurchases()});
  total+=customPurchases.reduce((s,p)=>s+p.qty*p.price,0);
  let shipping=Object.values(shippingBySupplier).reduce((a,b)=>a+b,0);total+=shipping;
  $('budgetTotal').textContent=total.toLocaleString('sv-SE',{maximumFractionDigits:2})+' kr';
  let shippingLabel=$('shippingSummary');if(shippingLabel)shippingLabel.textContent='Frakt: '+shipping.toLocaleString('sv-SE',{maximumFractionDigits:2})+' kr (en gång per vald leverantör)';
  persistOffers();
}
function offerCsv(){let header=['targetKey','product','supplier','unit','price','vat','vatIncluded','shipping','checked','url'];let rows=supplierOffers.map(o=>[o.targetKey,o.name,o.supplier,o.unit,o.price,o.vat,o.vatIncluded,o.shipping,o.checked,o.url]);let q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';return '\ufeff'+[header,...rows].map(r=>r.map(q).join(';')).join('\r\n');}
function parseCsv(text){let rows=[],row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if((c===';'||c===',')&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x!==''))rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}return rows;}
$('offerTarget').onchange=()=>{let line=purchaseLines().find(x=>x.key===$('offerTarget').value);if(line)$('offerUnit').value=line.unit};
$('addOffer').onclick=()=>{
  let targetKey=$('offerTarget').value,name=$('offerName').value.trim(),supplier=$('offerSupplier').value.trim(),unit=$('offerUnit').value,price=Number($('offerPrice').value);
  let targetLine=purchaseLines().find(x=>x.key===targetKey);if(targetLine&&targetLine.unit!==unit){alert('Enheten måste stämma med kalkylraden ('+targetLine.unit+').');return}
  if(!targetKey||!name||!supplier||!Number.isFinite(price)||price<0){alert('Välj kalkylrad och ange produkt, leverantör samt giltigt pris.');return}
  let url=$('offerUrl').value.trim();if(url&&!/^https?:\/\//i.test(url)){alert('Produktlänken måste börja med http:// eller https://');return}
  let offer={id:uid(),targetKey,name,supplier,unit,price,vat:Number($('offerVat').value)||0,vatIncluded:$('offerVatIncluded').checked,shipping:Math.max(0,Number($('offerShipping').value)||0),checked:$('offerDate').value||new Date().toISOString().slice(0,10),url};
  supplierOffers.push(offer);selectedOffers[targetKey]=offer.id;persistOffers();$('offerName').value='';$('offerPrice').value='0';$('offerUrl').value='';renderPurchases();
};
$('exportPriceCsv').onclick=()=>download(offerCsv(),'tradgardsplanerare_prislista.csv','text/csv;charset=utf-8');
$('importPriceCsv').onclick=()=>$('priceCsvFile').click();
$('priceCsvFile').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let rows=parseCsv(await f.text()),head=rows.shift().map(x=>x.trim());head[0]=(head[0]||'').replace(/^\uFEFF/,'');let ix=k=>head.indexOf(k);if(ix('targetKey')<0||ix('product')<0||ix('supplier')<0||ix('price')<0)throw Error('CSV behöver kolumnerna targetKey, product, supplier och price. Exportera först en mall från appen.');let added=0;rows.forEach(r=>{let val=k=>r[ix(k)]??'';let targetKey=val('targetKey');if(!targetKey)return;supplierOffers.push({id:uid(),targetKey,name:val('product'),supplier:val('supplier'),unit:val('unit')||'st',price:Number(String(val('price')).replace(',','.'))||0,vat:Number(val('vat'))||25,vatIncluded:String(val('vatIncluded')).toLowerCase()!=='false',shipping:Number(String(val('shipping')).replace(',','.'))||0,checked:val('checked'),url:val('url')}) ;added++});persistOffers();renderPurchases();alert(added+' offerter importerade. Kontrollera att targetKey och enheter stämmer med kalkylraderna.')}catch(err){alert('Kunde inte importera CSV: '+err.message)}e.target.value=''};
$('addPurchase').onclick=()=>{
  let name=$('purchaseName').value.trim(),qty=Math.max(0,Number($('purchaseQty').value)||0),price=Math.max(0,Number($('purchasePrice').value)||0);
  if(!name){alert('Ange namn på inköpsposten.');return}
  customPurchases.push({name,qty,unit:$('purchaseUnit').value,price});$('purchaseName').value='';renderPurchases();
};
$('offerDate').value=new Date().toISOString().slice(0,10);
function project(){return{app:'Tradgardsplanerare',version:3,name:$('projectName').value,place:$('projectPlace').value,width:W,height:H,objects,plants,backgroundData,defaults,compass:{north:+$('northAngle').value,sun:+$('sunAngle').value,showCompass:$('showCompass').checked,showSun:$('showSun').checked},purchasePrices:window.__purchasePrices||{},customPurchases,supplierOffers,selectedOffers}}function download(data,name,type){let a=document.createElement('a'),u=URL.createObjectURL(new Blob([data],{type}));a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500)}$('saveProject').onclick=()=>download(JSON.stringify(project(),null,2),($('projectName').value||'tradgardsprojekt')+'.json','application/json');$('openProject').onclick=()=>$('fileInput').click();$('fileInput').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let d=JSON.parse(await f.text());if(!Array.isArray(d.objects))throw Error('Projektfilen saknar objektlista');objects=d.objects;plants=d.plants||[];backgroundData=d.backgroundData||null;W=d.width||20;H=d.height||14;Object.assign(defaults,d.defaults||{});window.__purchasePrices=d.purchasePrices||{};customPurchases=d.customPurchases||[];supplierOffers=d.supplierOffers||supplierOffers;selectedOffers=d.selectedOffers||{};persistOffers();$('planW').value=W;$('planH').value=H;$('projectName').value=d.name||'Importerat projekt';$('projectPlace').value=d.place||'';if(d.compass){$('northAngle').value=d.compass.north??0;$('sunAngle').value=d.compass.sun??135;$('showCompass').checked=d.compass.showCompass!==false;$('showSun').checked=d.compass.showSun!==false}selected=null;selectedIds=[];render();$('status').textContent='Projekt öppnat'}catch(err){alert('Kunde inte öppna projektet: '+err.message)}e.target.value=''};$('exportPdf').onclick=()=>window.print();$('newProject').onclick=()=>{if(!confirm('Skapa nytt projekt? Spara först om du vill behålla ändringarna.'))return;snapshot();objects=[];plants=[];selected=null;selectedIds=[];customPurchases=[];window.__purchasePrices={};selectedOffers={};W=20;H=14;$('planW').value=20;$('planH').value=14;$('projectName').value='Nytt trädgårdsprojekt';render()};

$('groupSelected').onclick=()=>{if(selectedIds.length<2){alert('Markera minst två växter med Växturval först.');return;}snapshot();let gid=uid();plants.filter(p=>selectedIds.includes(p.id)).forEach(p=>p.groupId=gid);$('status').textContent='Grupp skapad – '+selectedIds.length+' växter';render()};
$('ungroupSelected').onclick=()=>{let ids=new Set(selectedIds.length?selectedIds:(selected?[selected]:[]));let chosen=plants.filter(p=>ids.has(p.id));let groups=new Set(chosen.map(p=>p.groupId).filter(Boolean));if(!groups.size){alert('Markera växter som ingår i en grupp.');return;}snapshot();plants.forEach(p=>{if(groups.has(p.groupId))delete p.groupId});$('status').textContent='Grupper upplösta';render()};
$('backgroundFile').onchange=async e=>{let f=e.target.files[0];if(!f)return;if(!f.type.startsWith('image/')){alert('Välj en bildfil.');return;}let reader=new FileReader();reader.onload=()=>{snapshot();backgroundData=reader.result;render();$('status').textContent='Bakgrundsbild importerad'};reader.readAsDataURL(f);e.target.value=''};
$('removeBackground').onclick=()=>{if(!backgroundData)return;snapshot();backgroundData=null;render();$('status').textContent='Bakgrundsbild borttagen'};
$('exportSvg').onclick=()=>{let cloneSvg=svg.cloneNode(true);cloneSvg.setAttribute('xmlns','http://www.w3.org/2000/svg');let data=new XMLSerializer().serializeToString(cloneSvg);download('<?xml version="1.0" encoding="UTF-8"?>\n'+data,($('projectName').value||'tradgardsplan').replace(/[^\wåäö-]+/gi,'_')+'.svg','image/svg+xml')};
$('exportPlants').onclick=()=>{let rows=[['Antal','Växt','Botaniskt namn','Kategori','Höjd (m)','Diameter (m)','Planteringsavstånd (cm)','Ljus','Blomning']];let counts={};plants.forEach(p=>{let k=(p.name||'')+'|'+(p.latin||'');counts[k]=(counts[k]||{p,n:0});counts[k].n++});Object.values(counts).sort((a,b)=>(a.p.name||'').localeCompare(b.p.name||'','sv')).forEach(({p,n})=>rows.push([n,p.name,p.latin,p.category,p.height,p.diameter,p.spacing,p.light,p.bloom]));let q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';download('\ufeff'+rows.map(r=>r.map(q).join(';')).join('\r\n'),'vaxtforteckning.csv','text/csv;charset=utf-8')};
render();
})();
