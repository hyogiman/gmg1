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
  await checkSessionOrStartNew();
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

async function checkSessionOrStartNew() {
  const sessionRef = db.collection("session").doc(`${teamId}_${factoryId}`);
  const snap = await sessionRef.get();

  const unsolved = allQuestions.filter(q => !solvedIds.includes(q.id));
  if (unsolved.length === 0) {
    document.getElementById("questionBox").style.display = "none";
    document.getElementById("completeBox").style.display = "block";
    return;
  }

  if (snap.exists && snap.data().current) {
    const currentId = snap.data().current.id;
    const startedAt = snap.data().current.startedAt;

    current = allQuestions.find(q => q.id === currentId);
    if (!current) {
      await sessionRef.delete();
      return checkSessionOrStartNew();
    }

    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    remainingTime = Math.max((current.timeLimit || 60) - elapsed, 0);

    if (remainingTime <= 0) {
      await recordAnswer("timeout", 99999);
    } else {
      showQuestion(current, remainingTime);
    }
  } else {
    current = unsolved[Math.floor(Math.random() * unsolved.length)];
    await sessionRef.set({ current: { id: current.id, startedAt: Date.now() } });
    showQuestion(current, current.timeLimit || 60);
  }
}

function showQuestion(q, startTime) {
  document.getElementById("questionText").innerText = q.text;

  const image = document.getElementById("questionImage");
  if (q.image) {
    image.src = q.image;
    image.style.display = "block";
  } else {
    image.style.display = "none";
  }

  const optionsBox = document.getElementById("options");
  optionsBox.innerHTML = "";
  ["A", "B", "C"].forEach(key => {
    const opt = q.options[key];
    const btn = document.createElement("button");
    btn.innerText = opt.text;
    btn.onclick = () => submitAnswer(key, opt.cost);
    btn.style.display = "block";
    btn.style.margin = "5px 0";
    optionsBox.appendChild(btn);
  });

  startTimer(startTime);
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

  // 점수 누적
  await db.collection("teams").doc(teamId).set({
    score: firebase.firestore.FieldValue.increment(cost)
  }, { merge: true });

  // 세션 삭제
  await db.collection("session").doc(`${teamId}_${factoryId}`).delete();

  solvedIds.push(current.id);
  await checkSessionOrStartNew();
}

function goHome() {
  location.href = "home.html";
}
