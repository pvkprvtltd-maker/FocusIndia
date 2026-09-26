const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const KEY = "focuslab_v1";

let state = JSON.parse(localStorage.getItem(KEY) || "null") || {
  minutes: 0,
  xp: 0,
  streak: 0,
  lastDay: null,
  notes: [{
    id: 1,
    title: "Welcome to FocusLab",
    body: "Start with retrieval: close your notes and write what you remember. Then check your source and repair the gaps."
  }],
  activeNote: 1,
  quiz: {
    correct: 0,
    total: 0,
    conf: []
  }
};

const save = () => localStorage.setItem(KEY, JSON.stringify(state));

const dayKey = () => new Date().toISOString().slice(0, 10);

if (state.lastDay !== dayKey()) {
  if (state.lastDay) {
    let a = new Date(state.lastDay);
    let b = new Date(dayKey());
    let d = (b - a) / 86400000;
    if (d > 1) state.streak = 0;
  }

  state.lastDay = dayKey();
  save();
}


/* =========================
   DASHBOARD
========================= */

function render() {
  $("#xp").textContent = state.xp;
  $("#level").textContent = Math.floor(state.xp / 100) + 1;

  $("#sideMin").textContent = state.minutes + " min";
  $("#heroMin").textContent = state.minutes;
  $("#dashMin").textContent = state.minutes + " min";

  let pct = Math.min(100, state.minutes / 60 * 100);
  $("#sideBar").style.width = pct + "%";
  $("#sideGoal").textContent = state.minutes + " / 60 min focus";

  $("#dashStreak").textContent =
    state.streak + " day" + (state.streak === 1 ? "" : "s");

  $("#dashAcc").textContent =
    state.quiz.total
      ? Math.round(state.quiz.correct / state.quiz.total * 100) + "%"
      : "—";

  $("#dashQuiz").textContent =
    state.quiz.total
      ? state.quiz.correct + " / " + state.quiz.total + " correct"
      : "No attempts yet";
}

render();

$("#today").textContent =
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());


/* =========================
   NAVIGATION
========================= */

function go(page) {
  $$(".page").forEach(x => x.classList.remove("active"));

  const target = $("#" + page);
  if (target) target.classList.add("active");

  $$(".nav").forEach(x =>
    x.classList.toggle("active", x.dataset.page === page)
  );

  const names = {
    home: "Welcome back.",
    notes: "Your notes.",
    timer: "Protect your attention.",
    learn: "Learn how to learn.",
    quiz: "Test what you know."
  };

  $("#heading").textContent = names[page] || "FocusLab";

  window.scrollTo(0,0);
}

$$(".nav").forEach(b => {
  b.onclick = () => go(b.dataset.page);
});

$$("[data-go]").forEach(b => {
  b.onclick = () => go(b.dataset.go);
});


/* =========================
   NOTES
========================= */

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function renderNotes() {
  const list = $("#noteList");
  list.innerHTML = "";

  state.notes.forEach(n => {
    let b = document.createElement("button");

    b.className =
      "note-item" +
      (n.id === state.activeNote ? " active" : "");

    b.innerHTML =
      "<b>" + esc(n.title || "Untitled") + "</b>" +
      "<span>" + esc((n.body || "").slice(0, 55)) + "</span>";

    b.onclick = () => {
      state.activeNote = n.id;
      loadNote();
      renderNotes();
    };

    list.appendChild(b);
  });
}

function loadNote() {
  let n = state.notes.find(x => x.id === state.activeNote);

  if (!n) return;

  $("#noteTitle").value = n.title;
  $("#noteBody").value = n.body;
}

function saveNote() {
  let n = state.notes.find(x => x.id === state.activeNote);

  if (!n) return;

  n.title = $("#noteTitle").value;
  n.body = $("#noteBody").value;

  save();
  renderNotes();

  $("#saveState").textContent = "Saved just now";

  setTimeout(() => {
    $("#saveState").textContent = "Saved locally";
  }, 1200);
}

$("#saveNote").onclick = saveNote;

$("#newNote").onclick = () => {
  let n = {
    id: Date.now(),
    title: "New note",
    body: ""
  };

  state.notes.unshift(n);
  state.activeNote = n.id;

  save();
  renderNotes();
  loadNote();

  $("#noteTitle").focus();
};

renderNotes();
loadNote();


/* =========================
   QUIZ THIS NOTE BUTTON
========================= */

$("#quizNote").onclick = () => {
  let note = state.notes.find(n => n.id === state.activeNote);

  if (!note || !note.body.trim()) {
    alert("Write some notes first, then try the quiz.");
    return;
  }

  startNoteQuiz(note);
};


/* =========================
   FOCUS TIMER
========================= */

let duration = 25 * 60;
let remain = duration;
let running = false;
let timerId = null;

function timerDisplay() {
  let m = Math.floor(remain / 60);
  let s = remain % 60;

  $("#clock").textContent =
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0");
}

function stop() {
  running = false;
  clearInterval(timerId);
}

function start() {
  if (running) return;

  running = true;

  timerId = setInterval(() => {
    remain--;
    timerDisplay();

    if (remain <= 0) {
      stop();

      let mins = Math.round(duration / 60);

      state.minutes += mins;
      state.xp += 20;
      state.streak = Math.max(1, state.streak);

      save();
      render();

      alert(
        "Focus block complete. Nice work — take a real break."
      );

      remain = duration;
      timerDisplay();
    }
  }, 1000);
}

$("#start").onclick = start;
$("#pause").onclick = stop;

$("#skip").onclick = () => {
  stop();
  remain = duration;
  timerDisplay();
};

$$(".timer-presets button").forEach(b => {
  b.onclick = () => {
    stop();

    duration = +b.dataset.min * 60;
    remain = duration;

    timerDisplay();
  };
});

timerDisplay();


/* =========================
   STUDY TECHNIQUES
========================= */

const techniqueTips = {
  "Retrieval practice":
    "Close your notes. Write everything you can remember about the topic for 2 minutes. Then open your notes and check what you missed.",

  "Spaced practice":
    "Study this topic today, then return to it tomorrow, again after a few days, and once more later. Short repeated sessions beat one giant cram session.",

  "Interleaving":
    "Mix different types of questions instead of doing 20 identical problems in a row. Your goal is to decide which method each problem needs.",

  "Feynman check":
    "Explain the topic as if you were teaching it to a younger student. Whenever you get stuck or use vague words, check your notes and repair that gap.",

  "Elaboration":
    "Ask yourself: Why does this happen? How does it work? What is an example? What is it connected to?",

  "Dual coding":
    "Turn the idea into a useful visual: a timeline, labelled diagram, flowchart, table, or concept map."
};

$$(".tech").forEach(card => {
  const button = card.querySelector("b");
  const title = card.querySelector("h3");

  if (!button || !title) return;

  button.style.cursor = "pointer";

  button.onclick = () => {
    const name = title.textContent;
    const tip = techniqueTips[name];

    if (tip) {
      alert(name + "\n\nTry this:\n\n" + tip);
    }
  };
});


/* =========================
   QUIZ SYSTEM
========================= */

let qs = [];
let qi = 0;
let confidence = null;
let currentQuizTitle = "General Quiz";


/*
   Creates questions directly from the
   user's selected note.

   It uses sentences from the note and
   hides an important word.
*/

function createNoteQuestions(note) {
  const text = note.body
    .replace(/\s+/g, " ")
    .trim();

  let sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length >= 20);

  if (!sentences.length) {
    return [];
  }

  // Use up to 5 useful sentences.
  sentences = sentences.slice(0, 5);

  let questions = [];

  sentences.forEach((sentence, index) => {
    const words = sentence.split(/\s+/);

    // Find useful words to hide.
    const candidates = words.filter(word =>
      word.replace(/[^A-Za-z0-9]/g, "").length >= 5
    );

    if (!candidates.length) return;

    const answerWord =
      candidates[Math.floor(candidates.length / 2)];

    const cleanAnswer =
      answerWord.replace(/[^A-Za-z0-9-]/g, "");

    if (!cleanAnswer) return;

    const questionText =
      sentence.replace(
        answerWord,
        "________"
      );

    // Get alternative words from the note.
    const alternatives = [];

    words.forEach(word => {
      const clean = word.replace(/[^A-Za-z0-9-]/g, "");

      if (
        clean.length >= 4 &&
        clean.toLowerCase() !== cleanAnswer.toLowerCase() &&
        !alternatives.some(
          x => x.toLowerCase() === clean.toLowerCase()
        )
      ) {
        alternatives.push(clean);
      }
    });

    // Add words from other sentences if needed.
    sentences.forEach(other => {
      other.split(/\s+/).forEach(word => {
        const clean = word.replace(/[^A-Za-z0-9-]/g, "");

        if (
          clean.length >= 4 &&
          clean.toLowerCase() !== cleanAnswer.toLowerCase() &&
          !alternatives.some(
            x => x.toLowerCase() === clean.toLowerCase()
          )
        ) {
          alternatives.push(clean);
        }
      });
    });

    const choices = [
      cleanAnswer,
      ...alternatives.slice(0, 3)
    ];

    // Need at least two choices.
    if (choices.length < 2) return;

    // Shuffle choices.
    choices.sort(() => Math.random() - 0.5);

    const correctIndex =
      choices.findIndex(
        x => x.toLowerCase() === cleanAnswer.toLowerCase()
      );

    questions.push({
      topic: note.title || "Your notes",
      q: "Complete the idea from your notes:\n\n" + questionText,
      a: choices,
      c: correctIndex,
      why:
        "This question was generated directly from your selected note."
    });
  });

  return questions;
}


function startNoteQuiz(note) {
  qs = createNoteQuestions(note);

  if (!qs.length) {
    alert(
      "I need a little more text to make a quiz. Add a few complete sentences to your note."
    );
    return;
  }

  currentQuizTitle = note.title || "Your notes";

  qi = 0;
  confidence = null;

  go("quiz");
  showQ();
}


function showQ() {
  if (!qs.length) return;

  let q = qs[qi % qs.length];

  $("#qNum").textContent =
    "Question " + (qi + 1);

  $("#qTopic").textContent =
    currentQuizTitle;

  $("#question").textContent = q.q;

  $("#answers").innerHTML = "";

  $("#feedback").style.display = "none";

  $("#nextQ").hidden = true;

  confidence = null;

  $$(".confidence button").forEach(x =>
    x.classList.remove("selected")
  );

  q.a.forEach((x, i) => {
    let b = document.createElement("button");

    b.className = "answer";
    b.textContent = x;

    b.onclick = () => answer(i, b);

    $("#answers").appendChild(b);
  });
}


function answer(i, btn) {
  if (confidence === null) {
    alert(
      "Pick your confidence first — the experiment needs it."
    );
    return;
  }

  $$(".answer").forEach(x =>
    x.disabled = true
  );

  let q = qs[qi % qs.length];

  let correct = i === q.c;

  if (correct) {
    state.quiz.correct++;
  }

  state.quiz.total++;

  state.quiz.conf.push({
    confidence,
    correct
  });

  state.xp += correct ? 10 : 3;

  save();
  render();

  $$(".answer")[q.c].classList.add("correct");

  if (!correct) {
    btn.classList.add("wrong");
  }

  $("#feedback").textContent =
    (correct ? "You got it. " : "Not this time. ") +
    q.why;

  $("#feedback").style.display = "block";

  $("#nextQ").hidden = false;

  $("#qScore").textContent =
    state.quiz.correct;
}


$$(".confidence button").forEach(b => {
  b.onclick = () => {
    confidence = +b.dataset.conf;

    $$(".confidence button").forEach(x =>
      x.classList.remove("selected")
    );

    b.classList.add("selected");
  };
});


$("#nextQ").onclick = () => {
  qi++;

  if (qi >= qs.length) {
    alert(
      "You've finished this note quiz! Nice work."
    );

    qi = 0;
  }

  showQ();
};


$("#qScore").textContent =
  state.quiz.correct;


/* =========================
   RESET
========================= */

$("#reset").onclick = () => {
  if (
    confirm(
      "Reset your local FocusLab progress and notes?"
    )
  ) {
    localStorage.removeItem(KEY);
    location.reload();
  }
};
