document.addEventListener("DOMContentLoaded", async () => {
  const team = localStorage.getItem("currentTeam");
  const factory = localStorage.getItem("currentFactory");
  document.getElementById("factoryName").innerText = `${factory} 공장 문제`;

  // 1. 푼 문제 목록 가져오기
  const solvedSnap = await db.collection("answers").doc(team).get();
  const solvedIds = solvedSnap.exists ? solvedSnap.data().solved || [] : [];

  // 2. 해당 공장 문제 가져오기
  const snapshot = await db.collection("questions")
    .where("factory", "==", factory)
    .get();

  const available = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(q => !solvedIds.includes(q.id));

  if (available.length === 0) {
    alert("남은 문제가 없습니다. 메인으로 돌아갑니다.");
    return location.href = "main.html";
  }

  const q = available[Math.floor(Math.random() * available.length)];
  renderQuestion(q, team);
});

function renderQuestion(q, team) {
  const container = document.getElementById("questionContainer");
  container.innerHTML = '';

  container.innerHTML += `<p>${q.text}</p>`;
  if (q.image) {
    container.innerHTML += `<img src="${q.image}" style="max-width:100%; margin:10px 0;" />`;
  }

  ["A", "B", "C"].forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = `옵션 ${opt}: ${q.options[opt].text} (${q.options[opt].cost}원)`;
    btn.onclick = () => submitAnswer(team, q, opt, q.options[opt].cost);
    container.appendChild(btn);
  });

  startCountdown(q.timeLimit || 60, () => {
    alert("⏰ 시간 초과! 문제 실패로 처리됩니다.");
    submitAnswer(team, q, "시간초과", 0, true);
  });
}

function startCountdown(seconds, onTimeout) {
  let remain = seconds;
  const timerEl = document.getElementById("timerDisplay");

  const countdown = setInterval(() => {
    timerEl.innerText = `남은 시간: ${remain--}초`;
    if (remain < 0) {
      clearInterval(countdown);
      onTimeout();
    }
  }, 1000);
}

async function submitAnswer(team, q, option, cost = 0, isFail = false) {
  const ref = db.collection("answers").doc(team);
  const snap = await ref.get();
  const records = snap.exists ? snap.data().records || [] : [];
  const solved = snap.exists ? snap.data().solved || [] : [];

  records.push({ questionId: q.id, factory: q.factory, option, cost });
  solved.push(q.id);

  await ref.set({ records, solved }, { merge: true });

  const total = records.reduce((sum, r) => sum + r.cost, 0);
  await db.collection("teams").doc(team).set({ score: total }, { merge: true });

  alert(isFail ? "문제 실패 처리됨." : `제출 완료! 누적 비용: ${total}원`);
  location.href = "main.html";
}