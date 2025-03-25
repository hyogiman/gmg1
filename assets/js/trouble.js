document.addEventListener("DOMContentLoaded", async () => {
  const teamId = localStorage.getItem("currentTeam");
  const factory = localStorage.getItem("currentFactory");
  document.getElementById("factoryName").innerText = `${factory} 공장 문제`;

  const answerRef = db.collection("answers").doc(teamId);
  const answerDoc = await answerRef.get();
  const solved = answerDoc.exists ? answerDoc.data().solved || [] : [];

  // 현재 진행 중 문제 확인
  const active = answerDoc.exists ? answerDoc.data().active : null;

  let q = null;

  if (active && !solved.includes(active.questionId)) {
    const qDoc = await db.collection("questions").doc(active.questionId).get();
    q = { id: qDoc.id, ...qDoc.data(), startAt: active.startAt.toMillis() };
  } else {
    // 새 문제 랜덤 추출
    const qSnap = await db.collection("questions").where("factory", "==", factory).get();
    const available = qSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(q => !solved.includes(q.id));

    if (available.length === 0) {
      alert("남은 문제가 없습니다.");
      return location.href = "main.html";
    }

    q = available[Math.floor(Math.random() * available.length)];
    q.startAt = Date.now();

    // Firestore에 시작시간 기록
    await answerRef.set({
      active: {
        questionId: q.id,
        factory,
        startAt: new Date()
      }
    }, { merge: true });
  }

  renderQuestion(teamId, q);
});

function renderQuestion(teamId, q) {
  const container = document.getElementById("questionContainer");
  container.innerHTML = `<p>${q.text}</p>`;
  if (q.image) {
    container.innerHTML += `<img src="${q.image}" style="max-width:100%; margin:10px 0;" />`;
  }

  for (let opt of ["A", "B", "C"]) {
    const btn = document.createElement("button");
    btn.innerText = `옵션 ${opt}: ${q.options[opt].text}`; // ✅ 비용 제거
    btn.onclick = () => submitAnswer(teamId, q, opt, q.options[opt].cost);
    container.appendChild(btn);
  }

  const timeLimit = q.timeLimit || 60;
  const remain = Math.max(0, timeLimit - Math.floor((Date.now() - q.startAt) / 1000));
  startCountdown(remain, () => {
    alert("⏰ 시간 초과! 문제 실패로 처리됩니다.");
    submitAnswer(teamId, q, "시간초과", 0, true);
  });
}
function startCountdown(seconds, onTimeout) {
  const timerEl = document.getElementById("timerDisplay");
  let remain = seconds;

  const timer = setInterval(() => {
    timerEl.innerText = `남은 시간: ${remain--}초`;
    if (remain < 0) {
      clearInterval(timer);
      onTimeout();
    }
  }, 1000);
}

async function submitAnswer(teamId, q, option, cost = 0, isFail = false) {
  const answerRef = db.collection("answers").doc(teamId);
  const doc = await answerRef.get();
  const records = doc.exists ? doc.data().records || [] : [];
  const solved = doc.exists ? doc.data().solved || [] : [];

  records.push({ questionId: q.id, factory: q.factory, option, cost });
  solved.push(q.id);

  await answerRef.set({ records, solved, active: null }, { merge: true });

  const total = records.reduce((sum, r) => sum + r.cost, 0);
  await db.collection("teams").doc(teamId).set({ score: total }, { merge: true });

  alert(isFail ? "문제 실패 처리됨." : `제출 완료! 누적 비용: ${total}원`);
  location.href = "main.html";
}
