document.addEventListener("DOMContentLoaded", () => {
  const factory = localStorage.getItem("currentFactory");
  const questions = JSON.parse(localStorage.getItem("questions") || "{}");
  const team = localStorage.getItem("currentTeam");

  const solvedRecords = JSON.parse(localStorage.getItem("solvedQuestionIds") || "{}");
  if (!solvedRecords[team]) solvedRecords[team] = [];

  const factoryQuestions = questions[factory] || [];
  const unsolved = factoryQuestions.filter(q => !solvedRecords[team].includes(q.id));

  if (unsolved.length === 0) {
    alert(`${factory} 공장에 남은 문제가 없습니다.`);
    window.location.href = "main.html";
    return;
  }

  const q = unsolved[Math.floor(Math.random() * unsolved.length)];
  localStorage.setItem("currentQuestionId", q.id);

  const container = document.querySelector('.container');
  container.innerHTML += `<h2>${factory} 공장 문제</h2>`;

  // 타이머 표시
  const timerDiv = document.createElement("div");
  timerDiv.id = "timerDisplay";
  timerDiv.style = "font-weight:bold; font-size:1.2rem; margin-bottom:10px; color:#d6336c;";
  container.appendChild(timerDiv);

  container.innerHTML += `<p>${q.text}</p>`;

  if (q.image) {
    container.innerHTML += `<img src="${q.image}" style="max-width: 100%; margin-bottom: 20px;" />`;
  }

  ["A", "B", "C"].forEach(opt => {
    const b = document.createElement("button");
    b.innerText = `옵션 ${opt}: ${q.options[opt].text} (${q.options[opt].cost}원)`;
    b.onclick = () => submitAnswer(opt, q.options[opt].cost, q.id);
    container.appendChild(b);
  });

  // 타이머 카운트다운
  const time = q.timeLimit || 60;
  let remaining = time;
  updateTimerUI(remaining);

  const countdown = setInterval(() => {
    remaining--;
    updateTimerUI(remaining);

    if (remaining <= 0) {
      clearInterval(countdown);
      alert("⏰ 시간 초과! 이 문제는 실패로 기록됩니다.");
      markQuestionAsFailed(q.id);
      window.location.href = "main.html";
    }
  }, 1000);
});

function updateTimerUI(seconds) {
  const el = document.getElementById("timerDisplay");
  if (el) el.innerText = `⏳ 남은 시간: ${seconds}초`;
}

function submitAnswer(option, cost, questionId) {
  const team = localStorage.getItem("currentTeam");
  let records = JSON.parse(localStorage.getItem("troubleRecords") || "{}");
  if (!records[team]) records[team] = [];
  records[team].push({ factory: localStorage.getItem("currentFactory"), option, cost, qid: questionId });
  localStorage.setItem("troubleRecords", JSON.stringify(records));

  let solved = JSON.parse(localStorage.getItem("solvedQuestionIds") || "{}");
  if (!solved[team]) solved[team] = [];
  solved[team].push(questionId);
  localStorage.setItem("solvedQuestionIds", JSON.stringify(solved));

  let scores = JSON.parse(localStorage.getItem("scores") || "{}");
  scores[team] = records[team].reduce((sum, r) => sum + r.cost, 0);
  localStorage.setItem("scores", JSON.stringify(scores));

  window.location.href = "main.html";
}

function markQuestionAsFailed(questionId) {
  const team = localStorage.getItem("currentTeam");
  let solved = JSON.parse(localStorage.getItem("solvedQuestionIds") || "{}");
  if (!solved[team]) solved[team] = [];
  solved[team].push(questionId);
  localStorage.setItem("solvedQuestionIds", JSON.stringify(solved));
}