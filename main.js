const startButton=document.querySelector("#startButton");
const mapSelect=document.querySelector("#mapSelect");
const canvas=document.querySelector(".canvas");
const ctx=canvas.getContext("2d");
const minimap=document.querySelector(".minimap");
const mtx=minimap.getContext("2d");
const ba=document.querySelector("#bombAmount");
const widthX=document.querySelector("#widthX");
const heightY=document.querySelector("#heightY");
const lengthZ=document.querySelector("#lengthZ");
const worldW=document.querySelector("#worldW");
const descr=document.querySelector("#descr");
const gameSetting=document.querySelector(".gameSetting");
const side=document.querySelector("#sideText");
ctx.textAlign = "center";
ctx.textBaseline = "middle";
var map;
var safeStart=false;
var fourDimensionalView=false;
var mines=0;
var size=20;
var p={
    x:0,
    y:0,
    z:0,
    w:0
};
var tiles=[];
function generateTiles(){
    tiles=[];
    //xyzwにタイルを作成
    for(let x=0; x<map.width; ++x){
    for(let y=0; y<map.height; ++y){
    for(let z=0; z<map.length; ++z){
    for(let w=0; w<map.world; ++w){
        tiles.push({
            x:x,
            y:y,
            z:z,
            w:w,
            around:[],
            revealed:false,
            flagged:false,
            mine:false,
            value:0
        });
    }
    }
    }
    }
    while(mines<ba.value){
        let seed=Math.round(Math.random()*(tiles.length-1));
        tiles[seed].mine=true;
        mines++;
    }
    for(const t of tiles){
        function addAroundTile(x,y,z,w){
        let id=tileId(t.x+x,t.y+y,t.z+z,t.w+w);
        if(id!=-1){
        if(tiles[id].mine){
            t.value++;
        }
        t.around.push(id);
        }
        }
        for(let r=0; r<3; ++r){
        for(let i=0; i<3; ++i){
        for(let j=0; j<3; ++j){
        for(let k=0; k<3; ++k){
            if(r*i*j*k!=1){
            addAroundTile(r-1,i-1,j-1,k-1);
            }
        }
        }
        }
        }
    }
}
const m = {
    x: null,
    y: null
}
canvas.addEventListener('mousemove', (event) => {
    m.x=event.offsetX;
    m.y=event.offsetY;
    p.x=clamp(Math.floor(m.x/size),map.width);
    p.y=clamp(Math.floor(m.y/size),map.height);
});
startButton.addEventListener("click",(e)=>{
    startButton.innerHTML="";
    start=true;
    map={
        width:parseInt(widthX.value),
        height:parseInt(heightY.value),
        length:parseInt(lengthZ.value),
        world:parseInt(worldW.value)
    };
    size=700/Math.max(map.width,map.height);
    canvas.width=map.width*size;
    canvas.height=map.height*size;
    generateTiles();
    let id=-1;
    let loop=0;
    if(safeStart){
    while(id==-1 || tiles[id].value>0 || tiles[id].mine){
    id=Math.round(Math.random()*(tiles.length-1));
    loop++;
    if(loop>2000){
        break;
    }
    }
    if(loop<2000){
        p.x=tiles[id].x;
        p.y=tiles[id].y;
        p.z=tiles[id].z;
        p.w=tiles[id].w;
        fill(p.x,p.y,p.z,p.w);
    }
    }
    mapSelect.innerHTML="";
    translate();
});
function translate(){
    //canvas
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    mtx.textAlign = "center";
    mtx.textBaseline = "middle";
    mtx.clearRect(0,0,minimap.width,minimap.height);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    side.innerHTML=`${p.x+1},${p.y+1},${p.z+1},${p.w+1}<br><br><br>操作<br>WASDキーでZW平面の移動。WSはZ軸、ADはW軸<br>[SHIFTキー]ZW平面の近傍のマスを可視化`;
    for(const t of tiles){
        const bool=(p.w==t.w && t.z>=p.z);
        let wdist=(t.w-p.w);
        let zdist=(t.z-p.z);
        let hs=size/2;
        let center={
            x:t.x*size+hs,
            y:t.y*size+hs
        };
        const D=Math.pow(0.8,Math.abs(zdist));
        const DW=Math.pow(0.6,Math.abs(wdist));
        ctx.globalAlpha=Math.pow(1-Math.abs(zdist)/map.length,4)*Math.pow(1-Math.abs(wdist)/map.world,2);
        if(bool){
        ctx.strokeRect(center.x-hs*D,center.y-hs*D,size*D,size*D);
        if(start){
        ctx.fillStyle=`hsl(${360*t.w/map.world},50%,25%)`;
        }else{
        ctx.fillStyle=`rgb(10,10,10)`;
        }
            }
            //めくれたとき
        if(bool || (fourDimensionalView && Math.abs(wdist)<=1)){
        var dz=(zdist/map.length)*hs;
            const dw=(wdist/map.world)*hs;
            if(fourDimensionalView){
                ctx.fillStyle=`hsl(${360*t.w/map.world},50%,25%)`;
            }
            ctx.font = `${hs*D*DW}px serif`;
        if(t.revealed || !start){
            if(t.mine){
            ctx.fillText("💀",center.x+dz+dw,center.y-dz+dw);
            }else if(t.value>0){
            ctx.fillText(t.value,center.x+dz+dw,center.y-dz+dw);
            }
        }else{
            if(t.flagged){
                if(bool){
                segment(center.x-hs*D,center.y-hs*D,center.x+hs*D,center.y+hs*D);
                segment(center.x-hs*D,center.y+hs*D,center.x+hs*D,center.y-hs*D);
                }else{
                    ctx.fillText("！",center.x+dz+dw,center.y-dz+dw);
                }
            }
        if(bool){
        ctx.globalAlpha=1/(2*map.length);
        ctx.fillRect(center.x-hs*D,center.y-hs*D,size*D,size*D);
        }
        if(fourDimensionalView && !t.flagged){
            ctx.fillText("？",center.x+dz+dw,center.y-dz+dw);
        }
        }
        }
        }
    //minimap
    const S=minimap.width/Math.max(map.length,map.world);
    const Sn=S*0.9;
    const s=Sn/Math.max(map.width,map.height);
    for(const t of tiles){
        const z=map.length-t.z-1;
        mtx.fillStyle=`hsl(${360*t.w/map.world},50%,25%)`;
        mtx.strokeStyle=`hsl(${360*t.w/map.world},50%,25%)`;
        mtx.globalAlpha=(1-Math.abs(t.x-p.x)/map.width)*(1-Math.abs(t.y-p.y)/map.height)*(1-Math.abs(t.z-p.z)/map.length)*(1-Math.abs(t.w-p.w)/map.world);
        if(t.revealed || !start){
        mtx.strokeRect(t.x*s+t.w*S,t.y*s+z*S,s,s);
        mtx.globalAlpha=mclamp(mtx.globalAlpha,0.5);
        mtx.font = `${s*2/3}px serif`;
        if(t.mine){
        mtx.fillText("💀",(t.x+0.5)*s+t.w*S,(t.y+0.5)*s+z*S);
        }else if(t.value>0){
        mtx.fillText(t.value,(t.x+0.5)*s+t.w*S,(t.y+0.5)*s+z*S);
        }
        }else{
        mtx.fillRect(t.x*s+t.w*S,t.y*s+z*S,s,s);
        if(t.flagged){
        mtx.fillStyle=`hsl(${360*t.w/map.world+180},50%,75%)`;
        mtx.fillRect((t.x+0.125)*s+t.w*S,(t.y+0.125)*s+z*S,s*3/4,s*3/4);
        mtx.fillStyle=`hsl(${360*t.w/map.world},50%,25%)`;
        mtx.fillRect((t.x+0.25)*s+t.w*S,(t.y+0.25)*s+z*S,s/2,s/2);
        }
        }
    }
    mtx.strokeStyle=`#000000`;
    for(let z=0; z<map.length; ++z){
    for(let w=0; w<map.world; ++w){
        const W=map.world-1-w;
        const alpha=mclamp((1-Math.abs(p.z-z)/mclamp(map.length-1,1))*(1-Math.abs(p.w-w)/mclamp(map.world-1,1)),0.5);
        mtx.globalAlpha=alpha;
        //mtx.fillText(Math.round(alpha*100)/100,w*S+Sn/2,z*S+Sn/2);
        const as=Math.max(map.width,map.height);
        mtx.strokeRect(w*S,(map.length-z-1)*S,Sn*(map.width/as),Sn*(map.height/as));
    }
    }
    requestAnimationFrame(translate);
}
function tileId(x,y,z,w){
    return tiles.findIndex(e=>e.x==x && e.y==y && e.z==z && e.w==w);
}
window.addEventListener("keydown",e=>{
    if(e.shiftKey){
        fourDimensionalView=true;
    }
    if(e.code=="KeyW"){
        p.z=clamp(p.z+1,map.length-1);
    }
    if(e.code=="KeyA"){
        p.w=clamp(p.w-1,map.world-1);
    }
    if(e.code=="KeyS"){
        p.z=clamp(p.z-1,map.length-1);
    }
    if(e.code=="KeyD"){
        p.w=clamp(p.w+1,map.world-1);
    }
});
window.addEventListener("keyup",e=>{
    if(e.code.indexOf("Shift")!=-1){
        fourDimensionalView=false;
    }
});
canvas.addEventListener("click",e=>{
    if(start){
    let id=tileId(p.x,p.y,p.z,p.w);
    if(id!=-1 && !tiles[id].flagged){
        if(tiles[id].value==0 && !tiles[id].mine){
            fill(tiles[id].x,tiles[id].y,tiles[id].z,tiles[id].w)
        }else{
        tiles[id].revealed=true;
        if(tiles[id].mine){
            start=false;
        }
        }
    }
    }
});
canvas.addEventListener("contextmenu",()=>{
    event.preventDefault();
});
canvas.addEventListener("auxclick",e=>{
    if(start){
    let id=tileId(p.x,p.y,p.z,p.w);
    if(id!=-1 && !tiles[id].revealed){
        click1();
        tiles[id].flagged=!tiles[id].flagged;
    }
    }
});
function clamp(val,max){
    if(val<0){
        return 0;
    }
    if(max<val){
        return max;
    }
    return val;
}
function mclamp(val,min){
    if(val<min){
        return min;
    }
    return val;
}
function segment(x1,y1,x2,y2){
    ctx.beginPath();
    ctx.lineTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
    ctx.closePath();
}
function line(x1,y1,x2,y2){
    mtx.beginPath();
    mtx.lineTo(x1,y1);
    mtx.lineTo(x2,y2);
    mtx.stroke();
    mtx.closePath();
}
function fill(x,y,z,w){
    let t=tiles[tileId(x,y,z,w)];
    t.revealed=true;
    if(t.value==0){
    for(const a of t.around){
        let T=tiles[a];
        if(!T.revealed){
            fill(T.x,T.y,T.z,T.w);
        }
    }
    }
}