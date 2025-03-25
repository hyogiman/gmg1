let teamId, factoryId, allQuestions = [], solvedIds = [], current = null;
let timer, remainingTime = 0;

document.addEventListener("DOMContentLoaded", async () => {
  teamId = localStorage.getItem("currentTeam");
  factoryId = localStorage.getItem("selectedFactory");

  if (!teamId || !factoryId) {
    alert("로그인 또는 공장 선택 정보가 없습니다.");
    location.href = "index.html";
    return;
  }

  document.getElementById("teamName").innerText = teamId;
  document.getElementById("factoryName").innerText = factoryId;

  await loadSolvedQuestions();
  await loadAllQuestions();
  showNextQuestion();
});

async function loadSolvedQuestions() {
  const answerDoc = await db.collection("answers").doc(teamId).get();
  if (answerDoc.exists) {
    const records = answerDoc.data().records || [];
    solvedIds = records.filter(r => r.factory === factoryId).map(r => r.questionId);
  }
}

async function loadAllQuestions() {
  const snap = await db.collection("questions")
    .where("factory", "==", factoryId).get();
  allQuestions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

function showNextQuestion() {
  const unsolved = allQuestions.filter(q => !solvedIds.includes(q.id));

  if (unsolved.length === 0) {
    document.getElementById("questionBox").style.display = "none";
    document.getElementById("completeBox").style.display = "block";
    return;
  }

  current = unsolved[Math.floor(Math.random() * unsolved.length)];
  document.getElementById("questionText").innerText = current.text;

  const image = document.getElementById("questionImage");
  if (current.image) {
    image.src = current.image;
    image.style.display = "block";
  } else {
    image.style.display = "none";
  }

  const optionsBox = document.getElementById("options");
  optionsBox.innerHTML = "";
  ["A", "B", "C"].forEach(key => {
    const opt = current.options[key];
    const btn = document.createElement("button");
    btn.innerText = opt.text;
    btn.onclick = () => submitAnswer(key, opt.cost);
    btn.style.display = "block";
    btn.style.margin = "5px 0";
    optionsBox.appendChild(btn);
  });

  startTimer(current.timeLimit || 60);
}

function startTimer(seconds) {
  clearInterval(timer);
  remainingTime = seconds;
  document.getElementById("timer").innerText = remainingTime;
  timer = setInterval(() => {
    remainingTime--;
    document.getElementById("timer").innerText = remainingTime;
    if (remainingTime <= 0) {
      clearInterval(timer);
      recordAnswer("timeout", 99999);
    }
  }, 1000);
}

function submitAnswer(option, cost) {
  clearInterval(timer);
  recordAnswer(option, cost);
}

async function recordAnswer(option, cost) {
  const answerRef = db.collection("answers").doc(teamId);
  const snap = await answerRef.get();
  const time = Date.now();

  let records = [];
  if (snap.exists) {
    records = snap.data().records || [];
  }

  records.push({
    questionId: current.id,
    factory: factoryId,
    option,
    cost,
    time
  });

  await answerRef.set({ records }, { merge: true });

  const teamRef = db.collection("teams").doc(teamId);
  await teamRef.set({
    score: firebase.firestore.FieldValue.increment(cost)
  }, { merge: true });

  solvedIds.push(current.id);
  showNextQuestion();
}

function goHome() {
  location.href = "home.html";
}
