const teamId = localStorage.getItem("currentTeam");
const factory = localStorage.getItem("currentFactory");
let currentQuestion = null;
let timerInterval = null;

if (!teamId || !factory) {
  alert("접근 오류: 팀 또는 공장 정보가 없습니다.");
  location.href = "home.html";
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
  const startKey = `start_${teamId}_${q.id}`;

  if (!localStorage.getItem(startKey)) {
    localStorage.setItem(startKey, Date.now());
  }

  renderQuestion(q, startKey);
}

function renderQuestion(q, startKey) {
  const area = document.getElementById("questionArea");
  let html = `<p>${q.text}</p>`;
  if (q.image) html += `<img src="${q.image}" style="max-width:100%; margin:10px 0;" />`;

  ["A", "B", "C"].forEach(opt => {
    html += `<button onclick="submitAnswer('${opt}', ${q.options[opt].cost}, false, '${startKey}')">
      옵션 ${opt}: ${q.options[opt].text}
    </button><br/>`;
  });

  area.innerHTML = html;

  const startTime = parseInt(localStorage.getItem(startKey));
  const now = Date.now();
  const elapsed = Math.floor((now - startTime) / 1000);
  const remaining = Math.max(0, (q.timeLimit || 60) - elapsed);

  startTimer(remaining, startKey);
}

function startTimer(seconds, startKey) {
  const countdown = document.getElementById("countdown");
  countdown.innerText = `⏳ ${seconds}초 남음`;

  timerInterval = setInterval(() => {
    seconds--;
    countdown.innerText = `⏳ ${seconds}초 남음`;
    if (seconds <= 0) {
      clearInterval(timerInterval);
      submitAnswer("시간초과", 0, true, startKey);
    }
  }, 1000);
}

async function submitAnswer(option, cost, timeout = false, startKey) {
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

  localStorage.removeItem(startKey);
  alert(timeout ? "시간 초과!" : "제출 완료!");
  location.reload();
}

loadQuestion();
