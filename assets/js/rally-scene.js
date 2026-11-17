// Landscape and cars are drawn on a 384-pixel canvas to keep the same pixel scale throughout.
const RallyScene = (() => {
  'use strict';
  const width = 384, height = 216, horizon = 89, lens = 160, cameraHeight = 4.1;
  const sky = document.createElement('canvas');
  sky.width = 640; sky.height = horizon + 2;
  const backdrop = sky.getContext('2d');
  function poly(ctx, colour, points) {
    ctx.fillStyle = colour;
    ctx.beginPath();
    points.forEach(([x,y], i) => i ? ctx.lineTo(Math.round(x), Math.round(y)) : ctx.moveTo(Math.round(x), Math.round(y)));
    ctx.closePath();
    ctx.fill();
  }
  function box(ctx, colour, x, y, w, h) {
    ctx.fillStyle = colour;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }
  function paintSky() {
    const stops = [[92,126,160],[159,173,183],[236,189,161],[255,213,167]];
    for (let y=0; y<=horizon; y++) {
      const t = y / horizon * 2.99, i = Math.floor(t);
      const rgb = stops[i].map((v,k)=>Math.round(v+(stops[i+1][k]-v)*(t-i)));
      box(backdrop, 'rgb('+rgb.join(',')+')',0,y,640,1);
    }
    for (let y=-13; y<=13; y++) {
      const half = Math.round(Math.sqrt(169-y*y));
      box(backdrop,'#ffe5ad',424-half,40+y,half*2,1);
    }
    for (let i=0;i<29;i++) {
      const x=(i*83)%640, y=22+((i*7)%30);
      box(backdrop, i%2?'#dcb7a9':'#c8b2b1',x,y,8+(i*19)%49,1);
    }
    for (let layer=0;layer<3;layer++) {
      const colour=['#9c929e','#727d8b','#475e6a'][layer];
      for (let x=0;x<640;x++) {
        const ridge=Math.abs(Math.sin(x*.012+layer*1.45)*Math.cos(x*.007+layer)) * (24-layer*5);
        const y=66+layer*7-ridge-2*Math.sin(x*.07+layer);
        box(backdrop,colour,x,y,1,90-y);
      }
    }
    for (let x=0;x<640;x+=3) {
      const top=82+Math.sin(x*.033)*2, h=2+Math.abs(Math.sin(x*5))*5;
      poly(backdrop,'#394e53',[[x,top-h],[x-2,top+2],[x+2,top+2]]);
      box(backdrop,'#394e53',x-2,top+2,5,10);
    }
  }
  function pine(ctx,x,base,h) {
    const w=h*.23;
    box(ctx,'#443f38',x-h*.035,base-h*.25,h*.07,h*.25);
    for (let i=0;i<3;i++) {
      const top=base-h+i*h*.19, spread=w*(.53+i*.24);
      poly(ctx,'#1e3937',[[x,top],[x-spread,top+h*.45],[x+spread,top+h*.45]]);
      poly(ctx,'#39574b',[[x,top],[x-spread,top+h*.45],[x-spread*.12,top+h*.34]]);
    }
  }
  function cottage(ctx, x, base, k) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(base));
    ctx.scale(k, k);
    poly(ctx, '#893f38', [[-3.3,0],[-3.3,-2.3],[1,-2.3],[1,0]]);
    poly(ctx, '#683738', [[1,0],[1,-2.3],[2.7,-3.6],[4,-2.2],[4,-.4]]);
    poly(ctx, '#42434a', [[-3.8,-2.3],[-2.3,-3.8],[2.8,-3.8],[1.2,-2.3]]);
    ctx.fillStyle = '#e5caa3';
    ctx.fillRect(-2.7,-1.8,.8,.8); ctx.fillRect(-.9,-1.8,.8,.8); ctx.fillRect(.8,-2.3,.18,2.3);
    ctx.fillStyle = '#513e3b'; ctx.fillRect(-.7,-4.3,.36,.8);
    ctx.restore();
  }
  function finishGate(ctx, x, y, k) {
    box(ctx,'#d4ccb1',x-7.2*k,y-4.2*k,.2*k,4.2*k);
    box(ctx,'#565b60',x+7*k,y-4.2*k,.2*k,4.2*k);
    box(ctx,'#263a41',x-7.2*k,y-4.8*k,14.4*k,.82*k);
    for (const side of [-1,1]) {
      for (let j=0;j<8;j++) {
        const xx=x+side*(2+j*.58)*k;
        box(ctx,'#d9d4bc',xx,y-(j%2?4.78:4.41)*k,.55*k,.34*k);
      }
    }
    if (k>2) {
      ctx.fillStyle='#f8ebc7'; ctx.font='bold '+Math.max(3,Math.round(k*.7))+'px monospace';
      ctx.textAlign='center'; ctx.fillText('MÅL',Math.round(x),Math.round(y-4.15*k)); ctx.textAlign='start';
    }
  }
  function car(ctx,x,y,scale,ghost,steer) {
    ctx.save(); ctx.translate(Math.round(x),Math.round(y)); ctx.scale(scale,scale);
    if (ghost) ctx.globalAlpha=.72;
    const dark=ghost?'#234f66':'#412e36', paint=ghost?'#8ce8e2':'#be4738', light=ghost?'#c1ffff':'#ff8651';
    box(ctx,'#34363b',-28,-2,56,4);
    box(ctx,'#202a31',-25,-9,8,12);box(ctx,'#202a31',17,-9,8,12);
    poly(ctx,dark,[[-29,-8],[-28,-16],[-23,-19],[-17,-30],[14,-30],[22,-20],[28,-16],[29,-6],[24,-2],[-24,-2]]);
    const lean=Math.round(steer*2);
    poly(ctx,light,[[-23,-18],[-16+lean,-29],[14+lean,-29],[22,-18]]);
    poly(ctx,'#263c49',[[-19,-19],[-14+lean,-27],[12+lean,-27],[18,-19]]);
    poly(ctx,'#547381',[[-17,-20],[-13+lean,-26],[3+lean,-26],[-4,-20]]);
    box(ctx,'#1d3036',-26,-18,52,2);box(ctx,light,-27,-16,54,3);
    box(ctx,paint,-27,-13,54,7);box(ctx,dark,-27,-6,54,3);
    box(ctx,'#792f34',-25,-13,12,5);box(ctx,'#792f34',13,-13,12,5);
    box(ctx,'#ffb16b',-25,-13,4,3);box(ctx,'#ffb16b',21,-13,4,3);
    box(ctx,'#ed6751',-20,-13,7,3);box(ctx,'#ed6751',13,-13,7,3);
    box(ctx,'#e8d4a3',-6,-10,12,4);box(ctx,'#625c53',-4,-9,8,1);
    box(ctx,'#282e36',-27,-5,54,3);box(ctx,'#b4a097',-25,-5,50,1);
    ctx.restore();
  }
  function draw(canvas, lap, rival, cover = false) {
    const ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    const distance=lap.distance-6.65, lane=lap.lane;
    const origin=GhostLap.position(distance), slope=GhostLap.slope(distance);
    const skyOffset=Math.round(128-slope*58);
    ctx.drawImage(sky,skyOffset,0,width,horizon+1,0,0,width,horizon+1);
    function centre(depth) {
      return width/2 + (GhostLap.position(distance+depth)-origin-depth*slope-lane*6)*lens/depth;
    }
    for (let y=horizon+1;y<height;y++) {
      const depth=lens*cameraHeight/(y-horizon), z=distance+depth;
      const x=Math.round(centre(depth)), half=Math.round(6*lens/depth), stripe=Math.floor(z/7)%2;
      box(ctx,stripe?'#72816a':'#78866b',0,y,width,1);
      const shore=x-half*2.6;
      if (shore>0 && depth>12) {
        box(ctx,Math.floor(z*.8)%7===0?'#b7c5ba':'#829e9d',0,y,shore,1);
        box(ctx,'#b7aa86',shore,y,Math.max(1,half*.14),1);
      }
      box(ctx,stripe?'#a59a7d':'#a99c7d',x-half*1.23,y,half*2.46,1);
      box(ctx,stripe?'#d4c7ab':'#a79c86',x-half*1.04,y,half*2.08,1);
      box(ctx,stripe?'#53545c':'#55565d',x-half,y,2*half,1);
      if (z%18<8) box(ctx,'#e1cfa7',x-half*.014,y,half*.028,1);
      if ((z%GhostLap.length)<2.4) {
        for (let j=0;j<14;j++) box(ctx,j%2===Math.floor(z*1.5)%2?'#ded8c5':'#343943',x-half+j*half/7,y,half/7+1,1);
      }
    }
    const rivalDepth=rival ? 6.65+rival.distance-distance : -1;
    let rivalDrawn=false;
    function drawRival() {
      const scale=6.65/rivalDepth;
      car(ctx,centre(rivalDepth)+rival.lane*6*lens/rivalDepth,horizon+lens*cameraHeight/rivalDepth,scale,true,0);
      rivalDrawn=true;
    }
    for (let marker=Math.floor((distance+170)/8)*8;marker>distance+5;marker-=8) {
      const depth=marker-distance;
      if (rivalDepth>=depth && rivalDepth<=170 && !rivalDrawn) drawRival();
      const x=centre(depth), k=lens/depth, y=horizon+cameraHeight*k, n=Math.round(marker/8)%192;
      if (n === 0) finishGate(ctx,x,y,k);
      if (n % 48 === 26 || n % 48 === 28) cottage(ctx,x+(n%48===26?12:22)*k,y,k);
      const side=n%4===1?-1:1;
      const treeX=x+side*(9.6+(n*7%11))*k;
      if (treeX>-70 && treeX<width+70) pine(ctx,treeX,y,(3.4+(n*3%6)) * k);
      if (n%3===0) {
        for (const sign of [-1,1]) {
          box(ctx,'#ddd7c2',x+sign*7.6*k,y-1.2*k,.15*k,1.2*k);
          box(ctx,'#773f36',x+sign*7.6*k,y-.96*k,.15*k,.25*k);
        }
      }
    }
    const carY=horizon+lens*cameraHeight/6.65;
    if (!rivalDrawn && rivalDepth>=6.65 && rivalDepth<=170) drawRival();
    car(ctx,width/2,carY,cover?1.1:1,false,lap.lateral);
    if (!rivalDrawn && rivalDepth>=5 && rivalDepth<6.65) drawRival();
  }
  if (backdrop) paintSky();
  return { draw };
})();
