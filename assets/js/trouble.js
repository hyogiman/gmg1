const teamId = localStorage.getItem("currentTeam");
const factory = localStorage.getItem("currentFactory");

if (!teamId || !factory) {
  alert("접근 오류: 팀 또는 공장 정보가 없습니다.");
  location.href = "home.html";
}

let currentQuestion = null;

async function loadQuestion() {
  const answerDoc = await db.collection("answers").doc(teamId).get();
  const answeredIds = (answerDoc.exists ? answerDoc.data().records : []).map(r => r.questionId);

  const snap = await db.collection("questions")
    .where("factory", "==", factory)
    .get();

  const all = [];
  snap.forEach(doc => {
    if (!answeredIds.includes(doc.id)) {
      all.push({ id: doc.id, ...doc.data() });
    }
  });

  if (all.length === 0) {
    document.getElementById("questionArea").innerHTML = "<p>모든 문제를 해결했습니다.</p>";
    return;
  }

  currentQuestion = all[Math.floor(Math.random() * all.length)];
  renderQuestion(currentQuestion);
}

function renderQuestion(q) {
  const area = document.getElementById("questionArea");
  let html = `<p>${q.text}</p>`;
  if (q.image) html += `<img src="${q.image}" style="max-width:100%; margin:10px 0;" />`;

  ["A", "B", "C"].forEach(opt => {
    html += `<button onclick="submitAnswer('${opt}', ${q.options[opt].cost})">
      옵션 ${opt}: ${q.options[opt].text}
    </button><br/>`;
  });

  area.innerHTML = html;

  startTimer(q.timeLimit || 60);
}

function startTimer(seconds) {
  const countdown = document.getElementById("countdown");
  let remaining = seconds;
  countdown.innerText = `⏳ ${remaining}초 남음`;

  const interval = setInterval(() => {
    remaining--;
    countdown.innerText = `⏳ ${remaining}초 남음`;
    if (remaining <= 0) {
      clearInterval(interval);
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

  alert(timeout ? "시간 초과!" : "제출 완료!");
  location.reload();
}

loadQuestion();
