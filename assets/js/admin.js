// 🔌 프로그램 제어
async function toggleProgram() {
  const state = document.getElementById("programSwitch").checked;
  await db.collection("config").doc("global").set({ open: state }, { merge: true });
  document.getElementById("programStatusText").innerText = state ? "실행 중" : "중단됨";
}
async function loadProgramStatus() {
  const doc = await db.collection("config").doc("global").get();
  const open = doc.exists && doc.data().open === true;
  document.getElementById("programSwitch").checked = open;
  document.getElementById("programStatusText").innerText = open ? "실행 중" : "중단됨";
}

// 🏭 공장 관리
async function addFactory() {
  const name = document.getElementById("newFactoryName").value.trim();
  const code = document.getElementById("newFactoryCode").value.trim();
  if (!name || !code || code.length !== 4 || isNaN(code)) return alert("공장명과 4자리 숫자 코드를 입력하세요.");
  const exists = await db.collection("factories").doc(name).get();
  const codeUsed = await db.collection("factories").where("code", "==", code).get();
  if (exists.exists) return alert("이미 존재하는 공장명입니다.");
  if (!codeUsed.empty) return alert("이미 사용 중인 코드입니다.");
  await db.collection("factories").doc(name).set({ name, code });
  document.getElementById("newFactoryName").value = "";
  document.getElementById("newFactoryCode").value = "";
  loadFactories();
}
async function loadFactories() {
  const snap = await db.collection("factories").get();
  const list = document.getElementById("factoryList");
  const selector = document.getElementById("factorySelector");
  list.innerHTML = "";
  selector.innerHTML = "";
  snap.forEach(doc => {
    const f = doc.data();
    list.innerHTML += `<li><b>${f.name}</b> (코드: ${f.code})</li>`;
    selector.innerHTML += `<option value="${doc.id}">${f.name}</option>`;
  });
}

// 🧩 문제 등록
async function saveQuestion() {
  const factoryId = document.getElementById("factorySelector").value;
  const text = document.getElementById("questionText").value.trim();
  const timeLimit = parseInt(document.getElementById("timeLimit").value || "60");
  const imageInput = document.getElementById("questionImage");
  let imageData = null;
  if (imageInput.files.length > 0) {
    const file = imageInput.files[0];
    imageData = await toBase64(file);
  }
  const options = {
    A: { text: document.getElementById("optA").value, cost: parseInt(document.getElementById("costA").value) },
    B: { text: document.getElementById("optB").value, cost: parseInt(document.getElementById("costB").value) },
    C: { text: document.getElementById("optC").value, cost: parseInt(document.getElementById("costC").value) }
  };
  await db.collection("questions").add({
    factory: factoryId,
    text,
    timeLimit,
    image: imageData,
    options
  });
  alert("문제가 등록되었습니다.");
  clearQuestionForm();
  loadQuestions();
}
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}
function clearQuestionForm() {
  ["questionText", "optA", "optB", "optC", "costA", "costB", "costC", "timeLimit"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("questionImage").value = "";
  document.getElementById("previewImage").style.display = "none";
}
document.getElementById("questionImage").addEventListener("change", (e) => {
  const img = document.getElementById("previewImage");
  if (e.target.files.length > 0) {
    const reader = new FileReader();
    reader.onload = evt => {
      img.src = evt.target.result;
      img.style.display = "block";
    };
    reader.readAsDataURL(e.target.files[0]);
  } else {
    img.style.display = "none";
  }
});

// 📦 문제 목록
async function loadQuestions() {
  const snap = await db.collection("questions").get();
  const div = document.getElementById("questionList");
  div.innerHTML = "";
  snap.forEach(doc => {
    const q = doc.data();
    div.innerHTML += `<div><b>${q.text}</b> (공장: ${q.factory})</div>`;
  });
}

// 👥 팀 관리
async function loadTeams() {
  const snap = await db.collection("teams").get();
  const list = document.getElementById("teamList");
  list.innerHTML = "";
  snap.forEach(doc => {
    const t = doc.data();
    list.innerHTML += `<div><b>${doc.id}</b> 점수: ${t.score || 0}</div>`;
  });
}

// 📋 응답 기록
async function loadAnswerRecords() {
  const snap = await db.collection("answers").get();
  const table = document.getElementById("answerTable");
  table.innerHTML = "<table><tr><th>팀</th><th>문제ID</th><th>선택</th><th>비용</th><th>시간</th></tr>";
  snap.forEach(doc => {
    const teamId = doc.id;
    const records = doc.data().records || [];
    records.forEach(r => {
      const date = new Date(r.time).toLocaleString();
      table.innerHTML += `
        <tr>
          <td>${teamId}</td>
          <td>${r.questionId}</td>
          <td>${r.option}</td>
          <td>${r.cost}</td>
          <td>${date}</td>
        </tr>
      `;
    });
  });
  table.innerHTML += "</table>";
}

// ✅ 초기 실행
document.addEventListener("DOMContentLoaded", () => {
  loadProgramStatus();
  loadFactories();
  loadQuestions();
  loadTeams();
});
