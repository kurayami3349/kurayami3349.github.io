import fs from 'node:fs';
import path from 'node:path';

const C={ink:'#17324d',muted:'#617487',teal:'#087f8c',gold:'#ce8b23',red:'#cb5b5b',line:'#d8e3ea',pale:'#eef6f8',white:'#ffffff'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const text=(x,y,s,size=18,color=C.ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+esc(s)+'</text>';
const line=(x1,y1,x2,y2,color=C.line,width=2,extra='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
const arrow=(x1,y1,x2,y2,color=C.teal)=>line(x1,y1,x2,y2,color,2.4,'marker-end="url(#arrow)"');
function box(x,y,w,h,title,sub,color=C.teal){
 return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="12" fill="'+C.white+'" stroke="'+color+'" stroke-width="2"/>'+text(x+w/2,y+32,title,19,color,'text-anchor="middle" font-weight="600"')+(sub?text(x+w/2,y+60,sub,15,C.muted,'text-anchor="middle"'):'');
}
function svg(h,title,desc,body){
 return '<svg xmlns="http://www.w3.org/2000/svg" width="920" height="'+h+'" viewBox="0 0 920 '+h+'" role="img"><title>'+esc(title)+'</title><desc>'+esc(desc)+'</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="'+C.teal+'"/></marker></defs><rect width="920" height="'+h+'" rx="16" fill="#f7fafc"/><g font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif">'+text(28,37,title,23,C.ink,'font-weight="600"')+body+'</g></svg>';
}
function rk4(y,t,dt,f){
 const k1=f(y,t),k2=f(y.map((v,i)=>v+dt*k1[i]/2),t+dt/2),k3=f(y.map((v,i)=>v+dt*k2[i]/2),t+dt/2),k4=f(y.map((v,i)=>v+dt*k3[i]),t+dt);
 return y.map((v,i)=>v+dt*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);
}
function run(initial,dt,end,f){
 let y=initial.slice();const data=[{t:0,y:y.slice()}];
 for(let n=1;n<=Math.round(end/dt);n++){y=rk4(y,(n-1)*dt,dt,f);data.push({t:n*dt,y:y.slice()});}
 return data;
}
function plotFrame({x,y,w,h,xmax,ymin,ymax,yticks,label}){
 const X=t=>x+t/xmax*w,Y=v=>y+(ymax-v)/(ymax-ymin)*h;
 let body=text(x,y-17,label,16,C.muted);
 for(const v of yticks)body+=line(x,Y(v),x+w,Y(v))+text(x-12,Y(v)+5,String(v),14,C.muted,'text-anchor="end"');
 for(let t=0;t<=xmax;t++)body+=line(X(t),y,X(t),y+h)+text(X(t),y+h+26,String(t),14,C.muted,'text-anchor="middle"');
 body+=line(x,y,x,y+h,C.muted)+line(x,y+h,x+w,y+h,C.muted)+text(x+w-5,y+h+49,'时间 / s',14,C.muted,'text-anchor="end"');
 return {body,X,Y};
}
function curve(data,value,P,color,dash=''){
 const d=data.filter((_,i)=>i%5===0).map((p,i)=>(i?'L':'M')+P.X(p.t).toFixed(2)+' '+P.Y(value(p)).toFixed(2)).join(' ');
 return '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2.8" '+(dash?'stroke-dasharray="'+dash+'"':'')+'/>';
}
function legend(x,y,label,color,dash=''){
 return line(x,y-5,x+28,y-5,color,3,dash?'stroke-dasharray="'+dash+'"':'')+text(x+38,y,label,16,C.ink);
}
export function buildFigures(root){
 const assets=path.join(root,'assets');fs.mkdirSync(assets,{recursive:true});
 const save=(name,content)=>fs.writeFileSync(path.join(assets,name+'.svg'),content);

 let spring=line(100,90,100,270,C.ink,7)+line(105,190,142,190,C.ink)+line(142,122,142,246,C.ink)+line(142,122,200,122,C.ink);
 for(let y=100;y<270;y+=18)spring+=line(75,y+17,97,y,C.muted,1.5);
 spring+='<path d="M200 122 L216 105 L240 139 L264 105 L288 139 L312 105 L336 139 L352 122 L460 122" fill="none" stroke="'+C.teal+'" stroke-width="3"/>';
 spring+=line(460,122,460,246,C.ink)+line(142,246,250,246,C.ink)+line(250,228,250,264,C.gold,3)+line(250,228,325,228,C.gold,3)+line(250,264,325,264,C.gold,3)+line(300,231,300,261,C.gold,4)+line(300,246,460,246,C.gold,3)+line(460,184,500,184,C.ink);
 spring+='<rect x="500" y="133" width="134" height="105" rx="12" fill="#deeff1" stroke="'+C.teal+'" stroke-width="2"/>';
 spring+=text(567,193,'质量 m',24,C.ink,'text-anchor="middle"')+text(243,85,'弹簧 K',19,C.teal)+text(249,300,'阻尼 B',19,C.gold)+arrow(642,184,820,184)+text(687,159,'外力 f_ext',20,C.teal)+arrow(500,330,780,330)+text(610,358,'正方向 +x',17,C.muted);
 spring+=text(28,410,'固定平衡点 x₀；偏移 ξ = x − x₀。弹簧拉回，阻尼抑制速度，质量抵抗加速。',18);
 save('spring-model',svg(440,'质量—弹簧—阻尼：一套力平衡模型','并联的弹簧和阻尼器连接质量块，向右的外力作用于质量块。',spring));

 const damping=[.25,1,2].map(z=>({z,B:6*z,data:run([1,0],.001,5,([x,v])=>[v,-6*z*v-9*x])}));
 const dp=plotFrame({x:90,y:125,w:770,h:275,xmax:5,ymin:-.5,ymax:1,yticks:[-.5,0,.5,1],label:'归一化偏移 ξ / ξ(0)'});
 let dampingBody=text(28,69,'m = 1，K = 9，初始偏移 = 1，初始速度 = 0；只改变阻尼。',16,C.muted)+dp.body;
 damping.forEach((s,i)=>{const color=[C.teal,C.gold,C.red][i];dampingBody+=curve(s.data,p=>p.y[0],dp,color)+legend(80+i*270,487,['欠阻尼 ζ = 0.25','临界阻尼 ζ = 1','过阻尼 ζ = 2'][i],color);});
 save('damping-response',svg(525,'阻尼改变自由响应的形状','三种阻尼比的数值积分曲线，欠阻尼振荡而另外两种无振荡。',dampingBody));

 let layers=box(35,90,240,85,'任务目标','轨迹、接触力、柔顺行为')+box(340,90,240,85,'控制器与参考生成','PID、阻抗、导纳、混合')+box(645,90,240,85,'命令接口','位置 / 速度 / 力矩');
 layers+=arrow(277,132,335,132)+arrow(582,132,640,132)+arrow(765,180,765,240)+box(645,247,240,85,'驱动与执行内环','电流 → 电机 → 关节')+arrow(640,290,585,290)+box(340,247,240,85,'机器人与接触环境','运动与力由物理共同决定')+arrow(335,290,280,290)+box(35,247,240,85,'测量与估计','编码器、力传感器、观测器');
 layers+='<path d="M155 247 V208 H460 V180" fill="none" stroke="'+C.teal+'" stroke-width="2.4" marker-end="url(#arrow)"/>';
 layers+=text(28,380,'发送什么指令，与实现什么控制目标，是两个问题。',20,C.ink,'font-weight="600"')+text(28,411,'例如：导纳可以发送位置；接收位置的内环也可能是阻抗或逆动力学控制。',18,C.muted);
 save('control-layers',svg(440,'从任务目标到电机：控制链路的不同层次','任务目标、控制器、命令接口、执行内环、物理对象及测量反馈。',layers));

 const m=2,g=9.81,kp=200,kd=40,alpha=100,beta=20;
 const zd=t=>.15*Math.sin(3*t),vd=t=>.45*Math.cos(3*t),ad=t=>-1.35*Math.sin(3*t);
 const tracking=[0,1,2].map(mode=>run([.05,0],.001,6,([z,v],t)=>[v,(mode===0?-g:0)+(mode===2?ad(t):0)+alpha*(zd(t)-z)+beta*(vd(t)-v)]));
 const tp=plotFrame({x:90,y:145,w:770,h:240,xmax:6,ymin:-.3,ymax:.2,yticks:[-.3,-.2,-.1,0,.1,.2],label:'位置 z / m'});
 const ep=plotFrame({x:90,y:495,w:770,h:170,xmax:6,ymin:-.06,ymax:.13,yticks:[-.05,0,.05,.1],label:'误差 e / m，e = z_d − z'});
 let trackingBody=text(28,68,'理想模型，m = 2 kg，k_p = 200 N/m，k_d = 40 Ns/m；z_d = 0.15 sin(3t) m。',16,C.muted);
 trackingBody+=legend(30,105,'目标',C.ink,'7 5')+legend(168,105,'纯 PD',C.red)+legend(342,105,'重力补偿 + PD',C.gold)+legend(594,105,'逆动力学 + 前馈',C.teal)+tp.body+ep.body;
 trackingBody+=curve(tracking[0],p=>zd(p.t),tp,C.ink,'7 5');
 tracking.forEach((data,i)=>{const color=[C.red,C.gold,C.teal][i];trackingBody+=curve(data,p=>p.y[0],tp,color)+curve(data,p=>zd(p.t)-p.y[0],ep,color);});
 trackingBody+=text(28,747,'同样的等效反馈增益：重力补偿消除重力偏差；加速度前馈消除参考加速的持续激励。',17);
 save('tracking-response',svg(780,'静态重力偏差与动态跟踪误差是不同问题','三种控制器在相同参考和等效增益下的位置与误差曲线。',trackingBody));

 let hybrid='<rect x="65" y="275" width="510" height="70" fill="#dfe9ee"/>'+line(65,275,575,275,C.ink,3)+'<path d="M165 95 L245 155 L315 138 L365 225" fill="none" stroke="#52738d" stroke-width="24" stroke-linejoin="round"/><circle cx="245" cy="155" r="15" fill="#fff" stroke="#52738d" stroke-width="5"/><circle cx="315" cy="138" r="15" fill="#fff" stroke="#52738d" stroke-width="5"/><rect x="340" y="230" width="55" height="45" rx="6" fill="'+C.teal+'"/>';
 hybrid+=arrow(390,244,550,244)+text(422,220,'切向运动 +t',18,C.teal)+arrow(367,225,367,160)+text(382,167,'法向 +n',18,C.teal)+line(310,200,310,260,C.red,3)+'<path d="M304 251 L310 264 L316 251z" fill="'+C.red+'"/>'+text(90,224,'机器人压向表面',17,C.red)+text(85,325,'接触面',18,C.muted);
 hybrid+=box(610,100,275,88,'切向：运动目标','沿表面移动、跟踪轨迹')+box(610,215,275,88,'法向：力目标','维持接触、调节法向力');
 hybrid+=text(28,396,'选择矩阵必须在同一接触坐标系下使用；法向位置由接触与力调节共同决定。',18)+text(28,429,'经典混合控制按方向分配目标：不会在同一受约束方向任意指定位置和接触力。',17,C.muted);
 save('hybrid-contact',svg(460,'混合力位控制：先把任务方向分清','末端沿表面切向跟踪运动，并在法向建立目标接触力。',hybrid));

 let ia=text(30,83,'A · 基础阻抗：实际偏差 → 控制力 → 实际运动',21,C.teal,'font-weight="600"');
 ia+=box(30,115,190,82,'平衡点 / 轨迹','x₀ 或 x_d')+box(282,115,250,82,'阻抗控制律','实际位置、速度误差')+box(595,115,295,82,'力矩接口 → 机器人','产生实际状态 x、v');
 ia+=arrow(223,156,276,156)+arrow(535,156,589,156)+text(549,141,'力',15,C.muted);
 ia+='<path d="M744 200 V240 H408 V201" fill="none" stroke="'+C.teal+'" stroke-width="2.4" marker-end="url(#arrow)"/>'+text(470,231,'实际运动反馈',17,C.muted);
 ia+=arrow(744,65,744,109)+text(774,84,'外力作用',16,C.muted);
 ia+=line(30,275,890,275);
 ia+=text(30,316,'B · 基础导纳：测量外力 → 虚拟运动 → 内环追踪',21,C.teal,'font-weight="600"');
 ia+=box(30,350,190,82,'外力测量 / 估计','f_ext 或力误差')+box(282,350,250,82,'导纳虚拟模型','积分得到 x_v、v_v')+box(595,350,295,82,'运动内环 → 机器人','实际状态 x、v');
 ia+=arrow(223,391,276,391)+arrow(535,391,589,391);
 ia+='<path d="M744 435 V475 H620 V435" fill="none" stroke="'+C.teal+'" stroke-width="2.4" marker-end="url(#arrow)"/>'+text(400,481,'内环使用实际运动反馈',17,C.muted);
 ia+=arrow(815,310,815,344)+text(833,330,'外力',15,C.muted);
 ia+='<path d="M860 435 V504 H125 V437" fill="none" stroke="'+C.teal+'" stroke-width="2.2" marker-end="url(#arrow)"/>'+text(180,486,'接触力反馈',16,C.muted);
 ia+=text(30,527,'导纳的虚拟位置与实际位置需要分别记录；它们只在内环足够理想时近似相同。',18)+text(30,561,'图示是基础架构。一般阻抗也可使用力反馈，导纳实现也可能混合实际状态反馈。',17,C.muted);
 save('impedance-admittance',svg(590,'阻抗与导纳：力—运动关系相似，实现链路不同','对比实际运动反馈生成力矩的阻抗，以及力输入生成虚拟参考再由运动内环追踪的导纳。',ia));

 const rms=data=>Math.sqrt(data.filter(p=>p.t>=3).reduce((a,p)=>a+(zd(p.t)-p.y[0])**2,0)/data.filter(p=>p.t>=3).length);
 const inverseAnalyticError=t=>(-.05-.05*t)*Math.exp(-10*t);
 const analyticalErrorMax=Math.max(...tracking[2].map(p=>Math.abs((zd(p.t)-p.y[0])-inverseAnalyticError(p.t))));
 const checks={inverseDynamicsAnalyticErrorMax:analyticalErrorMax,inverseDynamicsAnalyticAgreement:analyticalErrorMax<1e-7,underdampedCrossesZero:Math.min(...damping[0].data.map(p=>p.y[0]))<0,criticalRemainsPositive:damping[1].data.every(p=>p.y[0]>0),overdampedRemainsPositive:damping[2].data.every(p=>p.y[0]>0)};
 if(Object.values(checks).some(v=>v===false))throw new Error('Numerical model check failed: '+JSON.stringify(checks));
 return {method:'RK4',dtSeconds:.001,hardwareData:false,damping:{mass:1,stiffness:9,zeta:[.25,1,2],initial:[1,0],durationSeconds:5},tracking:{mass:m,gravity:g,kp,kd,alpha,beta,reference:'0.15 sin(3 t)',initial:[.05,0],durationSeconds:6,steadyRmsErrorMetersFrom3s:{pd:rms(tracking[0]),gravityPd:rms(tracking[1]),inverseDynamics:rms(tracking[2])},expectedStaticPdGravityOffsetMeters:m*g/kp},checks};
}
