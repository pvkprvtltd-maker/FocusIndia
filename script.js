/* =========================================
   FOCUSINDIA
   Main App Script
========================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================
   STORAGE
   Keep the old key so existing notes survive.
========================================= */

const KEY = "focuslab_v1";

const defaultState = {
  minutes: 0,
  xp: 0,
  streak: 0,
  lastDay: null,

  notes: [
    {
      id: 1,
      title: "Welcome to FocusIndia",
      body:
        "Start with retrieval practice. Close your notes and write what you remember. Then check your source and repair the gaps."
    }
  ],

  activeNote: 1,

  quiz: {
    correct: 0,
    total: 0
  }
};


function loadState() {
  try {
    const saved = localStorage.getItem(KEY);

    if (!saved) {
      return structuredClone(defaultState);
    }

    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(defaultState),
      ...parsed,
      quiz: {
        ...defaultState.quiz,
        ...(parsed.quiz || {})
      },
      notes:
        Array.isArray(parsed.notes)
          ? parsed.notes
          : structuredClone(defaultState.notes)
    };

  } catch (error) {
    console.error("Could not load saved data:", error);
    return structuredClone(defaultState);
  }
}


let state = loadState();


function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}


/* =========================================
   DATE / STREAK
========================================= */

function dayKey() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function updateDay() {
  const today = dayKey();

  if (state.lastDay === today) {
    return;
  }

  if (state.lastDay) {
    const previous = new Date(state.lastDay + "T00:00:00");
    const current = new Date(today + "T00:00:00");

    const difference =
      Math.round(
        (current - previous) / 86400000
      );

    if (difference > 1) {
      state.streak = 0;
    }
  }

  state.lastDay = today;
  save();
}


updateDay();


/* =========================================
   TODAY
========================================= */

$("#today").textContent =
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(new Date());


/* =========================================
   DASHBOARD
========================================= */

function renderDashboard() {

  const level =
    Math.floor(state.xp / 100) + 1;

  $("#xp").textContent = state.xp;
  $("#level").textContent = level;

  $("#sideMinutes").textContent =
    state.minutes + " min";

  $("#heroMinutes").textContent =
    state.minutes;

  $("#dashboardMinutes").textContent =
    state.minutes + " min";


  const percentage =
    Math.min(
      100,
      (state.minutes / 60) * 100
    );

  $("#sideProgress").style.width =
    percentage + "%";

  $("#sideGoal").textContent =
    state.minutes + " / 60 min focus";


  $("#dashboardStreak").textContent =
    state.streak +
    " day" +
    (state.streak === 1 ? "" : "s");


  if (state.quiz.total > 0) {

    const accuracy =
      Math.round(
        (state.quiz.correct /
          state.quiz.total) *
        100
      );

    $("#dashboardAccuracy").textContent =
      accuracy + "%";

    $("#dashboardQuiz").textContent =
      state.quiz.correct +
      " / " +
      state.quiz.total +
      " correct";

  } else {

    $("#dashboardAccuracy").textContent =
      "—";

    $("#dashboardQuiz").textContent =
      "No attempts yet";
  }
}


renderDashboard();


/* =========================================
   NAVIGATION
========================================= */

const pageTitles = {

  home: "Welcome back.",

  notes: "Your notes.",

  timer: "Protect your attention.",

  techniques: "Learn how to learn.",

  quiz: "Test what you know."
};


function go(page) {

  $$(".page").forEach((section) => {
    section.classList.remove("active");
  });


  const target =
    $("#" + page);

  if (!target) {
    return;
  }


  target.classList.add("active");


  $$(".nav").forEach((button) => {

    button.classList.toggle(
      "active",
      button.dataset.page === page
    );

  });


  $("#pageHeading").textContent =
    pageTitles[page] || "FocusIndia";


  /*
    Instantly return to the top.
    No smooth scrolling because that
    caused the mobile positioning issue.
  */

  window.scrollTo(0, 0);
}


$$(".nav").forEach((button) => {

  button.addEventListener("click", () => {

    go(button.dataset.page);

  });

});


$$("[data-go]").forEach((button) => {

  button.addEventListener("click", () => {

    go(button.dataset.go);

  });

});


/* =========================================
   NOTES
========================================= */

function escapeHTML(text) {

  return String(text).replace(
    /[&<>"']/g,
    (character) => {

      const replacements = {

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"

      };

      return replacements[character];
    }
  );
}


function renderNotes() {

  const list = $("#noteList");

  list.innerHTML = "";


  state.notes.forEach((note) => {

    const button =
      document.createElement("button");

    button.className =
      "note-item" +
      (
        note.id === state.activeNote
          ? " active"
          : ""
      );


    button.innerHTML = `

      <strong>
        ${escapeHTML(
          note.title || "Untitled"
        )}
      </strong>

      <span>
        ${escapeHTML(
          (note.body || "").slice(0, 65)
        )}
      </span>

    `;


    button.addEventListener(
      "click",
      () => {

        state.activeNote =
          note.id;

        loadNote();
        renderNotes();

      }
    );


    list.appendChild(button);

  });
}


function getActiveNote() {

  return state.notes.find(
    (note) =>
      note.id === state.activeNote
  );
}


function loadNote() {

  const note =
    getActiveNote();

  if (!note) {
    return;
  }

  $("#noteTitle").value =
    note.title || "";

  $("#noteBody").value =
    note.body || "";
}


function saveNote() {

  const note =
    getActiveNote();

  if (!note) {
    return;
  }


  note.title =
    $("#noteTitle").value.trim() ||
    "Untitled note";

  note.body =
    $("#noteBody").value;


  save();

  renderNotes();


  $("#saveState").textContent =
    "Saved just now";


  setTimeout(() => {

    $("#saveState").textContent =
      "Saved locally";

  }, 1400);
}


$("#saveNote").addEventListener(
  "click",
  saveNote
);


/* Auto-save when leaving the editor */

$("#noteTitle").addEventListener(
  "blur",
  saveNote
);

$("#noteBody").addEventListener(
  "blur",
  saveNote
);


/* New note */

$("#newNote").addEventListener(
  "click",
  () => {

    const note = {

      id: Date.now(),

      title: "New note",

      body: ""

    };


    state.notes.unshift(note);

    state.activeNote =
      note.id;

    save();

    renderNotes();
    loadNote();

    $("#noteTitle").focus();

  }
);


renderNotes();
loadNote();


/* =========================================
   QUIZ ME FROM NOTE
========================================= */

function createNoteQuestions(note) {

  const text =
    note.body
      .replace(/\s+/g, " ")
      .trim();


  if (!text) {
    return [];
  }


  let sentences =
    text
      .split(/[.!?]+/)
      .map(
        (sentence) =>
          sentence.trim()
      )
      .filter(
        (sentence) =>
          sentence.length >= 20
      );


  /*
    If the student wrote one large paragraph
    without punctuation, use it as a fallback.
  */

  if (!sentences.length) {

    sentences =
      text
        .split(/[,;]+/)
        .map(
          (sentence) =>
            sentence.trim()
        )
        .filter(
          (sentence) =>
            sentence.length >= 20
        );

  }


  sentences =
    sentences.slice(0, 6);


  const questions = [];


  sentences.forEach(
    (sentence) => {

      const words =
        sentence.split(/\s+/);


      const candidates =
        words.filter(
          (word) => {

            const clean =
              word.replace(
                /[^A-Za-z0-9-]/g,
                ""
              );

            return clean.length >= 5;

          }
        );


      if (!candidates.length) {
        return;
      }


      const answerWord =
        candidates[
          Math.floor(
            candidates.length / 2
          )
        ];


      const answer =
        answerWord.replace(
          /[^A-Za-z0-9-]/g,
          ""
        );


      if (!answer) {
        return;
      }


      const questionText =
        sentence.replace(
          answerWord,
          "________"
        );


      const alternatives = [];


      function addAlternative(word) {

        const clean =
          word.replace(
            /[^A-Za-z0-9-]/g,
            ""
          );


        if (
          clean.length < 4 ||
          clean.toLowerCase() ===
            answer.toLowerCase()
        ) {
          return;
        }


        if (
          alternatives.some(
            (item) =>
              item.toLowerCase() ===
              clean.toLowerCase()
          )
        ) {
          return;
        }


        alternatives.push(clean);
      }


      /*
        First use words from the same
        sentence.
      */

      words.forEach(addAlternative);


      /*
        Then use words from other
        sentences.
      */

      sentences.forEach(
        (otherSentence) => {

          otherSentence
            .split(/\s+/)
            .forEach(addAlternative);

        }
      );


      const choices = [
        answer,
        ...alternatives.slice(0, 3)
      ];


      if (choices.length < 2) {
        return;
      }


      choices.sort(
        () => Math.random() - 0.5
      );


      const correctIndex =
        choices.findIndex(
          (choice) =>
            choice.toLowerCase() ===
            answer.toLowerCase()
        );


      questions.push({

        topic:
          note.title ||
          "Your notes",

        question:
          "Complete the idea from your notes:\n\n" +
          questionText,

        answers:
          choices,

        correct:
          correctIndex,

        explanation:
          "This question was generated directly from your selected note."

      });

    }
  );


  return questions;
}


/* =========================================
   GENERAL QUIZ QUESTIONS
========================================= */

const generalQuestions = [

  {
    topic: "Science",

    question:
      "Which organelle is mainly responsible for producing ATP in a cell?",

    answers: [
      "Mitochondrion",
      "Ribosome",
      "Nucleus",
      "Cell wall"
    ],

    correct: 0,

    explanation:
      "Mitochondria are the main sites of aerobic cellular respiration and ATP production."
  },


  {
    topic: "Geography",

    question:
      "Which imaginary line divides Earth into the Northern and Southern Hemispheres?",

    answers: [
      "Prime Meridian",
      "Equator",
      "Tropic of Cancer",
      "Arctic Circle"
    ],

    correct: 1,

    explanation:
      "The Equator lies at 0° latitude and divides Earth into the Northern and Southern Hempheres."
  },


  {
    topic: "Mathematics",

    question:
      "If 3x + 5 = 20, what is the value of x?",

    answers: [
      "3",
      "4",
      "5",
      "6"
    ],

    correct: 2,

    explanation:
      "Subtract 5 from both sides to get 3x = 15, then divide by 3."
  },


  {
    topic: "English",

    question:
      "Which word is the adjective in this sentence: 'The bright moon lit the sky.'?",

    answers: [
      "moon",
      "lit",
      "bright",
      "sky"
    ],

    correct: 2,

    explanation:
      "'Bright' describes the noun 'moon', so it is an adjective."
  },


  {
    topic: "History",

    question:
      "The Indian Constitution came into effect on which date?",

    answers: [
      "15 August 1947",
      "26 January 1950",
      "26 November 1949",
      "2 October 1950"
    ],

    correct: 1,

    explanation:
      "The Constitution of India came into effect on 26 January 1950."
  }

];


/* =========================================
   QUIZ STATE
========================================= */

let quizQuestions =
  [...generalQuestions];

let questionIndex = 0;

let selectedConfidence = null;

let quizAnswered = false;

let currentQuizName =
  "General";


function startGeneralQuiz() {

  quizQuestions =
    [...generalQuestions]
      .sort(
        () => Math.random() - 0.5
      );

  questionIndex = 0;

  selectedConfidence = null;

  quizAnswered = false;

  currentQuizName =
    "General Quiz";

  showQuestion();

}


function startNoteQuiz(note) {

  const questions =
    createNoteQuestions(note);


  if (!questions.length) {

    alert(
      "I need a little more text to make a quiz. Add a few complete sentences to your note."
    );

    return;

  }


  quizQuestions =
    questions;

  questionIndex = 0;

  selectedConfidence = null;

  quizAnswered = false;

  currentQuizName =
    note.title ||
    "Your Notes";


  go("quiz");

  showQuestion();

}


function showQuestion() {

  if (!quizQuestions.length) {
    return;
  }


  const question =
    quizQuestions[
      questionIndex %
      quizQuestions.length
    ];


  $("#questionNumber").textContent =
    "Question " +
    (questionIndex + 1);


  $("#questionTopic").textContent =
    currentQuizName === "General Quiz"
      ? question.topic
      : currentQuizName;


  $("#question").textContent =
    question.question;


  $("#answers").innerHTML = "";

  $("#feedback").style.display =
    "none";

  $("#nextQuestion").hidden =
    true;


  selectedConfidence = null;

  quizAnswered = false;


  $$(".confidence-buttons button")
    .forEach(
      (button) =>
        button.classList.remove(
          "selected"
        )
    );


  question.answers.forEach(
    (answerText, index) => {

      const button =
        document.createElement("button");


      button.className =
        "answer";


      button.textContent =
        answerText;


      button.addEventListener(
        "click",
        () =>
          answerQuestion(
            index,
            button
          )
      );


      $("#answers").appendChild(
        button
      );

    }
  );


  $("#quizScore").textContent =
    state.quiz.correct;

}


/* =========================================
   CONFIDENCE
========================================= */

$$(
  ".confidence-buttons button"
).forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        if (quizAnswered) {
          return;
        }


        selectedConfidence =
          Number(
            button.dataset.confidence
          );


        $$(".confidence-buttons button")
          .forEach(
            (item) =>
              item.classList.remove(
                "selected"
              )
          );


        button.classList.add(
          "selected"
        );

      }
    );

  }
);


/* =========================================
   ANSWER QUESTION
========================================= */

function answerQuestion(
  selectedIndex,
  selectedButton
) {

  if (quizAnswered) {
    return;
  }


  if (selectedConfidence === null) {

    alert(
      "Choose your confidence first."
    );

    return;

  }


  quizAnswered = true;


  const question =
    quizQuestions[
      questionIndex %
      quizQuestions.length
    ];


  const correct =
    selectedIndex ===
    question.correct;


  $$(".answer").forEach(
    (button) => {

      button.disabled = true;

    }
  );


  /*
    Highlight the correct answer.
  */

  const answerButtons =
    $$(".answer");


  if (answerButtons[question.correct]) {

    answerButtons[
      question.correct
    ].classList.add("correct");

  }


  /*
    Highlight the user's wrong answer.
  */

  if (!correct) {

    selectedButton.classList.add(
      "wrong"
    );

  }


  if (correct) {

    state.quiz.correct++;

    state.xp += 10;

  } else {

    state.xp += 3;

  }


  state.quiz.total++;


  save();

  renderDashboard();


  $("#feedback").textContent =
    correct
      ? "Correct! " +
        question.explanation
      : "Not quite. " +
        question.explanation;


  $("#feedback").style.display =
    "block";


  $("#nextQuestion").hidden =
    false;


  $("#quizScore").textContent =
    state.quiz.correct;

}


/* =========================================
   NEXT QUESTION
========================================= */

$("#nextQuestion").addEventListener(
  "click",
  () => {

    questionIndex++;

    if (
      questionIndex >=
      quizQuestions.length
    ) {

      questionIndex = 0;

    }

    showQuestion();

  }
);


/* =========================================
   OPEN QUIZ
========================================= */

$$(
  '[data-page="quiz"]'
).forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        startGeneralQuiz();

      }
    );

  }
);


/* =========================================
   QUIZ ME BUTTON
========================================= */

$("#quizNote").addEventListener(
  "click",
  () => {

    const note =
      getActiveNote();


    if (!note || !note.body.trim()) {

      alert(
        "Write some notes first, then try the quiz."
      );

      return;

    }


    startNoteQuiz(note);

  }
);


/* =========================================
   FOCUS TIMER
========================================= */

let timerDuration =
  25 * 60;

let timerRemaining =
  timerDuration;

let timerRunning =
  false;

let timerInterval =
  null;


/*
  Prevents accidentally giving XP twice
  for the same completed timer.
*/

let timerCompleted =
  false;


function updateTimerDisplay() {

  const minutes =
    Math.floor(
      timerRemaining / 60
    );

  const seconds =
    timerRemaining % 60;


  $("#clock").textContent =
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");

}


function updateTimerUI() {

  const ring =
    $(".timer-ring");


  if (timerRunning) {

    ring.classList.add(
      "running"
    );

    $("#timerMode").textContent =
      "FOCUS";

    $("#timerHint").textContent =
      "Stay with the task.";

  } else {

    ring.classList.remove(
      "running"
    );


    if (
      timerRemaining ===
      timerDuration
    ) {

      $("#timerMode").textContent =
        "READY";

      $("#timerHint").textContent =
        "Choose a focus block.";

    } else {

      $("#timerMode").textContent =
        "PAUSED";

      $("#timerHint").textContent =
        "Take a breath, then continue.";

    }

  }

}


function stopTimer() {

  timerRunning =
    false;


  clearInterval(
    timerInterval
  );


  timerInterval =
    null;


  updateTimerUI();

}


function startTimer() {

  if (timerRunning) {
    return;
  }


  timerRunning =
    true;


  timerCompleted =
    false;


  updateTimerUI();


  timerInterval =
    setInterval(
      () => {

        timerRemaining--;

        updateTimerDisplay();


        if (
          timerRemaining <= 0
        ) {

          completeTimer();

        }

      },
      1000
    );

}


function pauseTimer() {

  if (!timerRunning) {
    return;
  }

  stopTimer();

}


function resetTimerBlock() {

  stopTimer();

  timerRemaining =
    timerDuration;

  timerCompleted =
    false;

  updateTimerDisplay();
  updateTimerUI();

}


function completeTimer() {

  if (timerCompleted) {
    return;
  }


  timerCompleted =
    true;


  stopTimer();


  const completedMinutes =
    Math.round(
      timerDuration / 60
    );


  state.minutes +=
    completedMinutes;


  state.xp += 20;


  /*
    A completed focus session
    counts as showing up today.
  */

  state.streak =
    Math.max(
      1,
      state.streak
    );


  save();

  renderDashboard();


  timerRemaining =
    timerDuration;


  updateTimerDisplay();
  updateTimerUI();


  alert(
    "Focus block complete! Nice work — take a real break."
  );

}


/* Timer buttons */

$("#startTimer").addEventListener(
  "click",
  startTimer
);


$("#pauseTimer").addEventListener(
  "click",
  pauseTimer
);


$("#skipTimer").addEventListener(
  "click",
  resetTimerBlock
);


/* Timer presets */

$$(
  ".timer-presets button"
).forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        stopTimer();


        timerDuration =
          Number(
            button.dataset.minutes
          ) * 60;


        timerRemaining =
          timerDuration;


        timerCompleted =
          false;


        $$(".timer-presets button")
          .forEach(
            (item) =>
              item.classList.remove(
                "selected"
              )
          );


        button.classList.add(
          "selected"
        );


        updateTimerDisplay();
        updateTimerUI();

      }
    );

  }
);


/*
  Select 25 minutes by default.
*/

$$(
  ".timer-presets button"
).forEach(
  (button) => {

    if (
      button.dataset.minutes ===
      "25"
    ) {

      button.classList.add(
        "selected"
      );

    }

  }
);


updateTimerDisplay();
updateTimerUI();


/* =========================================
   STUDY TECHNIQUES
========================================= */

const techniqueData = {

  retrieval: {

    title:
      "Retrieval Practice",

    text:
      "Close your notes. Pick one topic and write everything you remember for 2 minutes. Then open your notes and check what you missed."

  },


  spaced: {

    title:
      "Spaced Practice",

    text:
      "Pick one topic you studied today. Schedule a short review for tomorrow, another review a few days later, and another later in the week."

  },


  interleaving: {

    title:
      "Interleaving",

    text:
      "Take three different types of problems. Mix them together and solve them without being told which method to use. Your job is to identify the method first."

  },


  feynman: {

    title:
      "Feynman Check",

    text:
      "Choose one concept and explain it in simple words as if teaching a younger student. Whenever you get stuck or use vague words, check your notes and repair the gap."

  },


  elaboration: {

    title:
      "Elaboration",

    text:
      "Choose one fact and ask: Why is this true? How does it work? What is an example? What does it connect to?"

  },


  dual: {

    title:
      "Dual Coding",

    text:
      "Choose one topic and turn it into a useful visual. Try a timeline, flowchart, labelled diagram, table, or concept map."

  }

};


function openTechnique(
  technique
) {

  const data =
    techniqueData[technique];


  if (!data) {
    return;
  }


  $("#modalTitle").textContent =
    data.title;


  $("#modalText").textContent =
    data.text;


  $("#techniqueModal")
    .classList.remove(
      "hidden"
    );

}


function closeTechnique() {

  $("#techniqueModal")
    .classList.add(
      "hidden"
    );

}


$$(
  ".try-button"
).forEach(
  (button) => {

    button.addEventListener(
      "click",
      () => {

        openTechnique(
          button.dataset.technique
        );

      }
    );

  }
);


$("#closeModal").addEventListener(
  "click",
  closeTechnique
);


$("#modalDone").addEventListener(
  "click",
  closeTechnique
);


/*
  Clicking outside the popup closes it.
*/

$("#techniqueModal").addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      $("#techniqueModal")
    ) {

      closeTechnique();

    }

  }
);


/* =========================================
   RESET
========================================= */

$("#resetButton").addEventListener(
  "click",
  () => {

    const confirmed =
      confirm(
        "Reset all FocusIndia progress and notes?"
      );


    if (!confirmed) {
      return;
    }


    /*
      Stop timer before resetting.
    */

    clearInterval(
      timerInterval
    );


    localStorage.removeItem(
      KEY
    );


    state =
      structuredClone(
        defaultState
      );


    save();


    /*
      Reset quiz.
    */

    quizQuestions =
      [...generalQuestions];

    questionIndex =
      0;

    currentQuizName =
      "General Quiz";


    /*
      Reset timer.
    */

    timerDuration =
      25 * 60;

    timerRemaining =
      timerDuration;

    timerRunning =
      false;

    timerCompleted =
      false;


    /*
      Re-render everything.
    */

    renderDashboard();

    renderNotes();
    loadNote();

    updateTimerDisplay();
    updateTimerUI();


    $$(".timer-presets button")
      .forEach(
        (button) => {

          button.classList.toggle(
            "selected",
            button.dataset.minutes ===
              "25"
          );

        }
      );


    go("home");

    startGeneralQuiz();


    alert(
      "FocusIndia has been reset."
    );

  }
);


/* =========================================
   INITIAL QUIZ
========================================= */

startGeneralQuiz();
