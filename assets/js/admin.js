document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("adminLoggedIn") !== "true") {
    alert("로그인이 필요합니다.");
    window.location.href = "admin-login.html";
    return;
  }

  ensureDefaultFactories();
  loadFactories();
  loadProgramStatus();
  renderTeams();
});

// ✅ 로그인 로그아웃 토글
function toggleProgram() {
  const open = document.getElementById("programSwitch").checked;
  localStorage.setItem("programOpen", open ? "true" : "false");
}

function loadProgramStatus() {
  const status = localStorage.getItem("programOpen") === "true";
  const switchEl = document.getElementById("programSwitch");
  if (switchEl) switchEl.checked = status;
}

// ✅ 공장 보장
function ensureDefaultFactories() {
  let factories = JSON.parse(localStorage.getItem("factories")) || [];
  if (!factories.includes("NCC")) factories.push("NCC");
  if (!factories.includes("Utility")) factories.push("Utility");
  localStorage.setItem("factories", JSON.stringify([...new Set(factories)]));
}

// ✅ 공장 목록 로딩
function loadFactories() {
  const factories = JSON.parse(localStorage.getItem("factories") || "[]");
  const selector = document.getElementById("factorySelector");
  if (selector) {
    selector.innerHTML = '';
    factories.forEach(f => {
      const option = document.createElement("option");
      option.value = f;
      option.textContent = f;
      selector.appendChild(option);
    });
  }
  renderFactoryProblems(factories);
}

// ✅ 공장 추가
function addFactory() {
  const name = document.getElementById("newFactory").value.trim();
  if (!name) return alert("공장명을 입력해주세요.");
  let factories = JSON.parse(localStorage.getItem("factories") || "[]");
  if (!factories.includes(name)) {
    factories.push(name);
    localStorage.setItem("factories", JSON.stringify(factories));
    alert("공장 추가 완료 ✅");
    loadFactories();
  } else {
    alert("이미 존재하는 공장입니다.");
  }
}

// ✅ 문제 저장
function saveQuestion() {
  const factory = document.getElementById("factorySelector").value;
  const text = document.getElementById("questionText").value;
  const timeLimit = parseInt(document.getElementById("timeLimit").value) || 60;

  const options = {
    A: { text: document.getElementById("optA").value, cost: parseInt(document.getElementById("costA").value) },
    B: { text: document.getElementById("optB").value, cost: parseInt(document.getElementById("costB").value) },
    C: { text: document.getElementById("optC").value, cost: parseInt(document.getElementById("costC").value) }
  };

  const imageInput = document.getElementById("questionImage");
  if (imageInput.files.length > 0) {
    const file = imageInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result;
      saveQuestionToStorage(factory, text, options, imageData, timeLimit);
    };
    reader.readAsDataURL(file);
  } else {
    saveQuestionToStorage(factory, text, options, null, timeLimit);
  }
}

function saveQuestionToStorage(factory, text, options, image, timeLimit) {
  const question = {
    id: generateId(),
    text,
    options,
    image,
    timeLimit
  };

  let all = JSON.parse(localStorage.getItem("questions") || "{}");
  if (!all[factory]) all[factory] = [];
  all[factory].push(question);
  localStorage.setItem("questions", JSON.stringify(all));

  alert("문제 저장 완료 ✅");
  renderFactoryProblems(JSON.parse(localStorage.getItem("factories") || "[]"));

  document.getElementById("questionText").value = "";
  ["A", "B", "C"].forEach(k => {
    document.getElementById(`opt${k}`).value = "";
    document.getElementById(`cost${k}`).value = "";
  });
  document.getElementById("timeLimit").value = "";
  document.getElementById("questionImage").value = null;
}

// ✅ ID 생성 (Edge 호환)
function generateId() {
  return (window.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'id-' + Math.random().toString(36).substr(2, 9);
}

// ✅ 문제 출력
function renderFactoryProblems(factories) {
  const container = document.getElementById("factoryProblems");
  const questions = JSON.parse(localStorage.getItem("questions") || "{}");
  if (!container) return;
  container.innerHTML = "";

  factories.forEach(factory => {
    container.innerHTML += `<h3>${factory}</h3>`;
    const list = questions[factory] || [];
    if (list.length === 0) {
      container.innerHTML += `<p>등록된 문제가 없습니다.</p>`;
      return;
    }

    list.forEach(q => {
      container.innerHTML += `
        <div style="border:1px solid #ccc; margin:5px; padding:10px;">
          <strong>${q.text}</strong>
          <ul>
            <li>A: ${q.options.A.text} (${q.options.A.cost}원)</li>
            <li>B: ${q.options.B.text} (${q.options.B.cost}원)</li>
            <li>C: ${q.options.C.text} (${q.options.C.cost}원)</li>
          </ul>
          제한시간: ${q.timeLimit || 60}초<br>
          ${q.image ? `<img src="${q.image}" style="max-width: 200px;" />` : ""}
          <button onclick="deleteQuestion('${factory}', '${q.id}')">삭제</button>
        </div>
      `;
    });
  });
}

// ✅ 문제 삭제
function deleteQuestion(factory, id) {
  let all = JSON.parse(localStorage.getItem("questions") || "{}");
  all[factory] = all[factory].filter(q => q.id !== id);
  localStorage.setItem("questions", JSON.stringify(all));
  alert("문제 삭제 완료 ✅");
  renderFactoryProblems(JSON.parse(localStorage.getItem("factories") || "[]"));
}

// ✅ 팀 점수/답안 출력
function renderTeams() {
  const teams = JSON.parse(localStorage.getItem("teams") || "{}");
  const scores = JSON.parse(localStorage.getItem("scores") || "{}");
  const answers = JSON.parse(localStorage.getItem("troubleRecords") || "{}");

  const statusDiv = document.getElementById("teamStatus");
  const answerDiv = document.getElementById("teamAnswers");
  if (!statusDiv || !answerDiv) return;
  statusDiv.innerHTML = "";
  answerDiv.innerHTML = "";

  const sortDesc = document.getElementById("sortDescending")?.checked;
  const sorted = Object.entries(scores).sort((a, b) =>
    sortDesc ? b[1] - a[1] : a[1] - b[1]
  );

  const sortedTeams = sorted.map(([t]) => t);
  Object.keys(teams).forEach(team => {
    const score = scores[team] !== undefined ? `${scores[team]}원` : "(미계산)";
    const rank = sortedTeams.indexOf(team) + 1;
    statusDiv.innerHTML += `<p><strong>${team}</strong>: ${score} (${rank}위)</p>`;

    if (answers[team]) {
      answerDiv.innerHTML += `<h4>${team}</h4>`;
      answers[team].forEach((a, i) => {
        answerDiv.innerHTML += `<p>${i + 1}. [${a.factory}] 옵션 ${a.option} → ${a.cost}원</p>`;
      });
    }
  });
}

// ✅ 팀 삭제
function deleteTeam() {
  const teamId = document.getElementById("deleteTeamId").value;
  if (!teamId) return alert("삭제할 팀 ID를 입력하세요.");

  const teams = JSON.parse(localStorage.getItem("teams") || "{}");
  const scores = JSON.parse(localStorage.getItem("scores") || "{}");
  const records = JSON.parse(localStorage.getItem("troubleRecords") || "{}");
  const solved = JSON.parse(localStorage.getItem("solvedQuestionIds") || "{}");

  delete teams[teamId];
  delete scores[teamId];
  delete records[teamId];
  delete solved[teamId];

  localStorage.setItem("teams", JSON.stringify(teams));
  localStorage.setItem("scores", JSON.stringify(scores));
  localStorage.setItem("troubleRecords", JSON.stringify(records));
  localStorage.setItem("solvedQuestionIds", JSON.stringify(solved));

  alert(`팀 '${teamId}' 삭제 완료 ✅`);
  renderTeams();
}

// ✅ 결과 테이블 출력
function exportToTable() {
  const scores = JSON.parse(localStorage.getItem("scores") || "{}");
  const records = JSON.parse(localStorage.getItem("troubleRecords") || "{}");

  let html = `<table border="1" style="border-collapse: collapse;"><tr><th>팀</th><th>총점</th><th>문제 기록</th></tr>`;
  Object.keys(scores).forEach(team => {
    const logs = records[team] || [];
    const detail = logs.map(l => `[${l.factory}] ${l.option} (${l.cost}원)`).join("<br>");
    html += `<tr><td>${team}</td><td>${scores[team]}</td><td>${detail}</td></tr>`;
  });
  html += `</table>`;

  document.getElementById("resultTableContainer").innerHTML = html;
}