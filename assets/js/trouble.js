const teamId = localStorage.getItem("currentTeam");
const factory = localStorage.getItem("currentFactory");
let currentQuestion = null;
let timerInterval = null;

if (!teamId || !factory) {
  alert("접근 오류: 팀 또는 공장 정보가 없습니다.");
  location.href = "index.html";
}

async function checkProgramStatus() {
  const doc = await db.collection("config").doc("global").get();
  if (doc.exists && !doc.data().open) {
    alert("아직 프로그램 시작 시간이 아닙니다.");
    location.href = "index.html";
  } else {
    loadQuestion();
  }
}

async function loadQuestion() {
  const answerDoc = await db.collection("answers").doc(teamId).get();
  const answered = (answerDoc.exists ? answerDoc.data().records : []).map(r => r.questionId);

  const snap = await db.collection("questions").where("factory", "==", factory).get();
  const pool = [];
  snap.forEach(doc => {
    if (!answered.includes(doc.id)) pool.push({ id: doc.id, ...doc.data() });
  });

  if (pool.length === 0) {
    document.getElementById("questionArea").innerHTML = "<p>모든 문제를 해결했습니다.</p>";
    return;
  }

  const q = pool[Math.floor(Math.random() * pool.length)];
  currentQuestion = q;

  // 서버 상태 확인 또는 기록
  const statusRef = db.collection("status").doc(teamId);
  const statusDoc = await statusRef.get();
  let startTime = null;

  if (statusDoc.exists && statusDoc.data().questionId === q.id && statusDoc.data().startTime) {
    startTime = statusDoc.data().startTime;
  } else {
    startTime = Date.now();
    await statusRef.set({ questionId: q.id, startTime }, { merge: true });
  }

  renderQuestion(q, startTime);
}

function renderQuestion(q, startTime) {
  const area = document.getElementById("questionArea");
  let html = `<p>${q.text}</p>`;
  if (q.image) html += `<img src="${q.image}" style="max-width:100%; margin:10px 0;" />`;

  ["A", "B", "C"].forEach(opt => {
    html += `<button onclick="submitAnswer('${opt}', ${q.options[opt].cost}, false)">
      옵션 ${opt}: ${q.options[opt].text}
    </button><br/>`;
  });

  area.innerHTML = html;

  const now = Date.now();
  const elapsed = Math.floor((now - startTime) / 1000);
  const remaining = Math.max(0, (q.timeLimit || 60) - elapsed);

  startTimer(remaining);
}

function startTimer(seconds) {
  const countdown = document.getElementById("countdown");
  countdown.innerText = `⏳ ${seconds}초 남음`;

  timerInterval = setInterval(() => {
    seconds--;
    countdown.innerText = `⏳ ${seconds}초 남음`;
    if (seconds <= 0) {
      clearInterval(timerInterval);
      submitAnswer("시간초과", 0, true);
    }
  }, 1000);
}

async function submitAnswer(option, cost, timeout = false) {
  if (!currentQuestion) return;

  const ref = db.collection("answers").doc(teamId);
  const prev = await ref.get();
  const records = prev.exists ? prev.data().records || [] : [];

  records.push({
    factory,
    questionId: currentQuestion.id,
    option,
    cost,
    time: Date.now()
  });

  await ref.set({ records }, { merge: true });

  if (!timeout) {
    await db.collection("teams").doc(teamId).set({
      score: firebase.firestore.FieldValue.increment(cost)
    }, { merge: true });
  }

  // 타이머 상태 제거 (다음 문제 가능)
  await db.collection("status").doc(teamId).delete();

  alert(timeout ? "시간 초과!" : "제출 완료!");
  location.reload();
}

checkProgramStatus();
