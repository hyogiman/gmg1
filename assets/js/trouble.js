document.addEventListener("DOMContentLoaded", async () => {
  const team = localStorage.getItem("currentTeam");
  const factory = localStorage.getItem("currentFactory");
  document.getElementById("factoryName").innerText = `${factory} 공장 문제`;

  const solvedSnap = await db.collection("answers").doc(team).get();
  const solvedIds = solvedSnap.exists ? solvedSnap.data().solved || [] : [];

  const snapshot = await db.collection("questions").where("factory", "==", factory).get();
  const questions = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(q => !solvedIds.includes(q.id));

  if (questions.length === 0) {
    alert(`${factory} 공장에 남은 문제가 없습니다.`);
    return location.href = "main.html";
  }

  const q = questions[Math.floor(Math.random() * questions.length)];
  renderQuestion(q, team);
});

function renderQuestion(q, team) {
  const container = document.getElementById("questionContainer");

  const p = document.createElement("p");
  p.innerText = q.text;
  container.appendChild(p);

  if (q.image) {
    const img = document.createElement("img");
    img.src = q.image;
    img.style.maxWidth = "100%";
    container.appendChild(img);
  }

  ["A", "B", "C"].forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = `옵션 ${opt}: ${q.options[opt].text} (${q.options[opt].cost}원)`;
    btn.onclick = () => submitAnswer(team, q, opt);
    container.appendChild(btn);
  });

  startCountdown(q.timeLimit || 60, () => {
    alert("⏰ 시간 초과! 이 문제는 실패 처리됩니다.");
    submitAnswer(team, q, "실패", 0, true);
  });
}

function startCountdown(time, onTimeout) {
  let remaining = time;
  updateTimerUI(remaining);

  const timer = setInterval(() => {
    remaining--;
    updateTimerUI(remaining);

    if (remaining <= 0) {
      clearInterval(timer);
      onTimeout();
    }
  }, 1000);
}

function updateTimerUI(seconds) {
  const el = document.getElementById("timerDisplay");
  if (el) el.innerText = `⏳ 남은 시간: ${seconds}초`;
}

async function submitAnswer(team, q, option, cost = 0, isFail = false) {
  const selectedCost = isFail ? 0 : q.options[option].cost;

  // 기록 저장
  const ref = db.collection("answers").doc(team);
  const snap = await ref.get();
  const prev = snap.exists ? snap.data().records || [] : [];
  const solved = snap.exists ? snap.data().solved || [] : [];

  prev.push({ questionId: q.id, factory: q.factory, option, cost: selectedCost });
  solved.push(q.id);

  await ref.set({ records: prev, solved }, { merge: true });

  // 점수 갱신
  const total = prev.reduce((sum, r) => sum + r.cost, 0);
  await db.collection("teams").doc(team).set({ score: total }, { merge: true });

  alert(`제출 완료! 내 누적 비용: ${total}원`);
  location.href = "main.html";
}