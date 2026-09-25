const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const KEY="focuslab_v1";
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{minutes:0,xp:0,streak:0,lastDay:null,notes:[{id:1,title:"Welcome to FocusLab",body:"Start with retrieval: close your notes and write what you remember. Then check your source and repair the gaps."}],activeNote:1,quiz:{correct:0,total:0,conf:[]}};
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const dayKey=()=>new Date().toISOString().slice(0,10);
if(state.lastDay!==dayKey()){if(state.lastDay){let a=new Date(state.lastDay),b=new Date(dayKey());let d=(b-a)/86400000; if(d>1)state.streak=0}state.lastDay=dayKey();save()}
function render(){
  $("#xp").textContent=state.xp;$("#level").textContent=Math.floor(state.xp/100)+1;
  $("#sideMin").textContent=state.minutes+" min";$("#heroMin").textContent=state.minutes;$("#dashMin").textContent=state.minutes+" min";
  let pct=Math.min(100,state.minutes/60*100);$("#sideBar").style.width=pct+"%";$("#sideGoal").textContent=state.minutes+" / 60 min focus";
  $("#dashStreak").textContent=state.streak+" day"+(state.streak===1?"":"s");
  $("#dashAcc").textContent=state.quiz.total?Math.round(state.quiz.correct/state.quiz.total*100)+"%":"—";
  $("#dashQuiz").textContent=state.quiz.total?state.quiz.correct+" / "+state.quiz.total+" correct":"No attempts yet";
}
render();
$("#today").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(new Date());

function go(page){
 $$(".page").forEach(x=>x.classList.remove("active"));$("#"+page).classList.add("active");
 $$(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 const names={home:"Welcome back.",notes:"Your notes.",timer:"Protect your attention.",learn:"Learn how to learn.",quiz:"Test what you know."};
 $("#heading").textContent=names[page];
 window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav").forEach(b=>b.onclick=()=>go(b.dataset.page));
$$("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));

function renderNotes(){
 const list=$("#noteList");list.innerHTML="";
 state.notes.forEach(n=>{let b=document.createElement("button");b.className="note-item"+(n.id===state.activeNote?" active":"");b.innerHTML="<b>"+esc(n.title||"Untitled")+"</b><span>"+(n.body||"").slice(0,55)+"</span>";b.onclick=()=>{state.activeNote=n.id;loadNote();renderNotes()};list.appendChild(b)});
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function loadNote(){let n=state.notes.find(x=>x.id===state.activeNote);if(!n)return;$("#noteTitle").value=n.title;$("#noteBody").value=n.body}
function saveNote(){let n=state.notes.find(x=>x.id===state.activeNote);n.title=$("#noteTitle").value;n.body=$("#noteBody").value;save();renderNotes();$("#saveState").textContent="Saved just now";setTimeout(()=>$("#saveState").textContent="Saved locally",1200)}
$("#saveNote").onclick=saveNote;$("#newNote").onclick=()=>{let n={id:Date.now(),title:"New note",body:""};state.notes.unshift(n);state.activeNote=n.id;save();renderNotes();loadNote();$("#noteTitle").focus()};
renderNotes();loadNote();

let duration=25*60,remain=duration,running=false,timerId=null;
function timerDisplay(){let m=Math.floor(remain/60),s=remain%60;$("#clock").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")}
function stop(){running=false;clearInterval(timerId)}
function start(){if(running)return;running=true;timerId=setInterval(()=>{remain--;timerDisplay();if(remain<=0){stop();let mins=Math.round(duration/60);state.minutes+=mins;state.xp+=20;state.streak=Math.max(1,state.streak);save();render();alert("Focus block complete. Nice work — take a real break.");remain=duration;timerDisplay()}},1000)}
$("#start").onclick=start;$("#pause").onclick=stop;$("#skip").onclick=()=>{stop();remain=duration;timerDisplay()};
$$(".timer-presets button").forEach(b=>b.onclick=()=>{stop();duration=+b.dataset.min*60;remain=duration;timerDisplay()});
timerDisplay();

const qs=[
 {topic:"Biology",q:"Which process directly produces most ATP in aerobic cellular respiration?",a:["Glycolysis","Oxidative phosphorylation","Fermentation","DNA replication"],c:1,why:"Oxidative phosphorylation generates most ATP through the electron transport chain and chemiosmosis."},
 {topic:"Chemistry",q:"A solution with pH 3 is how many times more acidic than a solution with pH 5?",a:["2 times","20 times","100 times","1,000 times"],c:2,why:"Each pH unit represents a tenfold change in hydrogen-ion concentration. Two units means 10² = 100."},
 {topic:"Physics",q:"If the net force on an object is zero, what must be true?",a:["It must be at rest.","Its acceleration is zero.","Its speed must be increasing.","No forces can act on it."],c:1,why:"Newton’s second law gives Fₙₑₜ = ma. Zero net force means zero acceleration, although the object can still move at constant velocity."},
 {topic:"Learning",q:"Which study action is an example of retrieval practice?",a:["Rereading a chapter three times","Highlighting every definition","Closing the book and answering questions from memory","Copying notes word-for-word"],c:2,why:"Retrieval practice asks you to bring information back from memory instead of simply exposing yourself to it again."},
 {topic:"Math",q:"What is the value of 3² + 4²?",a:["12","20","25","49"],c:2,why:"3² = 9 and 4² = 16, so the sum is 25."}
];
let qi=0,confidence=null;
function showQ(){
 let q=qs[qi%qs.length];$("#qNum").textContent="Question "+(qi+1);$("#qTopic").textContent=q.topic;$("#question").textContent=q.q;
 $("#answers").innerHTML="";$("#feedback").style.display="none";$("#nextQ").hidden=true;confidence=null;
 $$(".confidence button").forEach(x=>x.classList.remove("selected"));
 q.a.forEach((x,i)=>{let b=document.createElement("button");b.className="answer";b.textContent=x;b.onclick=()=>answer(i,b);$("#answers").appendChild(b)});
}
function answer(i,btn){
 if(confidence===null){alert("Pick your confidence first — the experiment needs it.");return}
 $$(".answer").forEach(x=>x.disabled=true);let q=qs[qi%qs.length];
 let correct=i===q.c;if(correct)state.quiz.correct++;state.quiz.total++;state.quiz.conf.push({confidence,correct});
 state.xp+=correct?10:3;save();render();
 $$(".answer")[q.c].classList.add("correct");if(!correct)btn.classList.add("wrong");
 $("#feedback").textContent=(correct?"You got it. ":"Not this time. ")+q.why;$("#feedback").style.display="block";$("#nextQ").hidden=false;$("#qScore").textContent=state.quiz.correct;
}
$$(".confidence button").forEach(b=>b.onclick=()=>{confidence=+b.dataset.conf;$$(".confidence button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});
$("#nextQ").onclick=()=>{qi++;showQ()};showQ();$("#qScore").textContent=state.quiz.correct;
$("#reset").onclick=()=>{if(confirm("Reset your local FocusLab progress and notes?")){localStorage.removeItem(KEY);location.reload()}};
