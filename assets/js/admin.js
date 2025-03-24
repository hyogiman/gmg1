document.addEventListener("DOMContentLoaded", () => {
  loadFactories();
  loadQuestions();
  loadProgramStatus();
});

// 🔌 프로그램 오픈
function toggleProgram() {
  const open = document.getElementById("programSwitch").checked;
  db.collection("config").doc("global").set({ open }, { merge: true });
}

async function loadProgramStatus() {
  const doc = await db.collection("config").doc("global").get();
  document.getElementById("programSwitch").checked = doc.exists ? doc.data().open : false;
}

// 🏭 공장
async function addFactory() {
  const name = document.getElementById("newFactory").value.trim();
  if (!name) return alert("공장명을 입력하세요.");
  await db.collection("factories").doc(name).set({ createdAt: new Date() });
  alert("공장 등록 완료");
  loadFactories();
}

async function deleteFactory(name) {
  if (!confirm(`${name} 공장을 삭제할까요?`)) return;
  await db.collection("factories").doc(name).delete();
  alert("공장 삭제 완료");
  loadFactories();
}

async function loadFactories() {
  const snap = await db.collection("factories").get();
  const selector = document.getElementById("factorySelector");
  const list = document.getElementById("factoryList");
  selector.innerHTML = '';
  list.innerHTML = '';

  snap.forEach(doc => {
    const name = doc.id;

    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    selector.appendChild(opt);

    const li = document.createElement("li");
    li.innerHTML = `${name} <button onclick="deleteFactory('${name}')">삭제</button>`;
    list.appendChild(li);
  });
}

// 🧩 문제 저장 / 수정
async function saveQuestion() {
  const factory = document.getElementById("factorySelector").value;
  const text = document.getElementById("questionText").value;
  const timeLimit = parseInt(document.getElementById("timeLimit").value) || 60;
  const id = document.getElementById("editQuestionId").value;

  const options = {
    A: { text: document.getElementById("optA").value, cost: parseInt(document.getElementById("costA").value) },
    B: { text: document.getElementById("optB").value, cost: parseInt(document.getElementById("costB").value) },
    C: { text: document.getElementById("optC").value, cost: parseInt(document.getElementById("costC").value) }
  };

  const file = document.getElementById("questionImage").files[0];
  let imageBase64 = null;

  if (file) {
    const reader = new FileReader();
    reader.onload = async () => {
      imageBase64 = reader.result;
      if (id) {
        await db.collection("questions").doc(id).set({ factory, text, options, timeLimit, image: imageBase64 });
      } else {
        await db.collection("questions").add({ factory, text, options, timeLimit, image: imageBase64 });
      }
      alert("저장 완료 ✅");
      document.getElementById("editQuestionId").value = "";
      loadQuestions();
    };
    reader.readAsDataURL(file);
  } else {
    if (id) {
      await db.collection("questions").doc(id).set({ factory, text, options, timeLimit }, { merge: true });
    } else {
      await db.collection("questions").add({ factory, text, options, timeLimit });
    }
    alert("저장 완료 ✅");
    document.getElementById("editQuestionId").value = "";
    loadQuestions();
  }
}

// 📦 문제 목록
async function loadQuestions() {
  const snap = await db.collection("questions").orderBy("factory").get();
  const container = document.getElementById("questionList");
  container.innerHTML = '';

  snap.forEach(doc => {
    const q = doc.data();
    container.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
        <strong>[${q.factory}]</strong> ${q.text}<br/>
        A: ${q.options.A.text} (${q.options.A.cost})<br/>
        B: ${q.options.B.text} (${q.options.B.cost})<br/>
        C: ${q.options.C.text} (${q.options.C.cost})<br/>
        제한시간: ${q.timeLimit || 60}초<br/>
        ${q.image ? `<img src="${q.image}" style="max-width:200px;"><br/>` : ""}
        <button onclick="editQuestion('${doc.id}')">수정</button>
        <button onclick="deleteQuestion('${doc.id}')">삭제</button>
      </div>
    `;
  });
}

async function deleteQuestion(id) {
  if (!confirm("정말 삭제할까요?")) return;
  await db.collection("questions").doc(id).delete();
  alert("삭제 완료");
  loadQuestions();
}

async function editQuestion(id) {
  const doc = await db.collection("questions").doc(id).get();
  const q = doc.data();
  document.getElementById("factorySelector").value = q.factory;
  document.getElementById("questionText").value = q.text;
  document.getElementById("timeLimit").value = q.timeLimit;
  document.getElementById("optA").value = q.options.A.text;
  document.getElementById("costA").value = q.options.A.cost;
  document.getElementById("optB").value = q.options.B.text;
  document.getElementById("costB").value = q.options.B.cost;
  document.getElementById("optC").value = q.options.C.text;
  document.getElementById("costC").value = q.options.C.cost;
  document.getElementById("editQuestionId").value = id;
}

// 👥 팀 관리
async function loadTeams() {
  const container = document.getElementById("teamList");
  container.innerHTML = '';
  const snap = await db.collection("teams").get();

  snap.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.style = "border:1px solid #ccc; padding:10px; margin:5px 0;";
    div.innerHTML = `
      <strong>${doc.id}</strong><br/>
      점수: ${data.score || 0}원<br/>
      <button onclick="resetTeam('${doc.id}')">초기화</button>
      <button onclick="deleteTeam('${doc.id}')">삭제</button>
    `;
    container.appendChild(div);
  });
}

async function resetTeam(teamId) {
  if (!confirm(`${teamId} 팀을 초기화할까요?`)) return;
  await db.collection("teams").doc(teamId).set({ score: 0 }, { merge: true });
  await db.collection("answers").doc(teamId).delete();
  alert("초기화 완료");
  loadTeams();
}

async function deleteTeam(teamId) {
  if (!confirm(`${teamId} 팀을 삭제할까요?`)) return;
  await db.collection("teams").doc(teamId).delete();
  await db.collection("answers").doc(teamId).delete();
  alert("삭제 완료");
  loadTeams();
}