document.addEventListener("DOMContentLoaded", () => {
  loadProgramStatus();
  loadFactories();
  loadQuestions();
  document.getElementById("questionImage")?.addEventListener("change", previewImage);
});

// 🔌 프로그램 ON/OFF
async function toggleProgram() {
  const open = document.getElementById("programSwitch").checked;
  await db.collection("config").doc("global").set({ open }, { merge: true });
  updateProgramStatusText(open);
}
async function loadProgramStatus() {
  const doc = await db.collection("config").doc("global").get();
  const open = doc.exists ? doc.data().open : false;
  document.getElementById("programSwitch").checked = open;
  updateProgramStatusText(open);
}
function updateProgramStatusText(open) {
  const status = document.getElementById("programStatusText");
  status.innerText = open ? "현재 상태: ✅ 오픈됨" : "현재 상태: ❌ 닫힘";
  status.style.color = open ? "#28a745" : "#dc3545";
}

// 🏭 공장 관리
async function addFactory() {
  const name = document.getElementById("newFactory").value.trim();
  if (!name) return alert("공장명을 입력하세요.");
  await db.collection("factories").doc(name).set({ createdAt: new Date() });
  loadFactories();
}
async function deleteFactory(name) {
  if (!confirm(`${name} 공장을 삭제할까요?`)) return;
  await db.collection("factories").doc(name).delete();
  loadFactories();
}
async function loadFactories() {
  const snap = await db.collection("factories").get();
  const selector = document.getElementById("factorySelector");
  const list = document.getElementById("factoryList");
  if (selector) selector.innerHTML = '';
  if (list) list.innerHTML = '';
  snap.forEach(doc => {
    if (selector) selector.innerHTML += `<option value="${doc.id}">${doc.id}</option>`;
    if (list) list.innerHTML += `<li>${doc.id} <button onclick="deleteFactory('${doc.id}')">삭제</button></li>`;
  });
}

// 🖼️ 이미지 미리보기
function previewImage() {
  const file = this.files[0];
  const preview = document.getElementById("previewImage");
  if (!file) return (preview.style.display = "none");
  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
}

// 🧩 문제 등록
async function saveQuestion() {
  const factory = document.getElementById("factorySelector").value;
  const text = document.getElementById("questionText").value;
  const timeLimit = parseInt(document.getElementById("timeLimit").value) || 60;
  const options = {
    A: { text: document.getElementById("optA").value, cost: parseInt(document.getElementById("costA").value) || 0 },
    B: { text: document.getElementById("optB").value, cost: parseInt(document.getElementById("costB").value) || 0 },
    C: { text: document.getElementById("optC").value, cost: parseInt(document.getElementById("costC").value) || 0 }
  };

  const file = document.getElementById("questionImage").files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      const image = reader.result;
      submitQuestion({ factory, text, timeLimit, options, image });
    };
    reader.readAsDataURL(file);
  } else {
    submitQuestion({ factory, text, timeLimit, options });
  }
}
async function submitQuestion(data) {
  await db.collection("questions").add(data);
  alert("✅ 문제 등록 완료");
  loadQuestions();
}

// 📦 문제 목록
async function loadQuestions() {
  const snap = await db.collection("questions").orderBy("factory").get();
  const container = document.getElementById("questionList");
  if (!container) return;
  container.innerHTML = '';
  snap.forEach(doc => {
    const q = doc.data();
    container.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
        <strong>[${q.factory}]</strong> ${q.text}<br/>
        <button onclick="location.href='edit.html?id=${doc.id}'">✏️ 수정</button>
      </div>
    `;
  });
}

// 👥 팀 관리
async function loadTeams() {
  const snap = await db.collection("teams").get();
  const container = document.getElementById("teamList");
  if (!container) return;
  container.innerHTML = '';
  snap.forEach(doc => {
    const data = doc.data();
    container.innerHTML += `
      <div style="border:1px solid #aaa; padding:8px; margin:8px;">
        <strong>${doc.id}</strong><br/>
        점수: ${data.score || 0}원<br/>
        <button onclick="resetTeam('${doc.id}')">초기화</button>
        <button onclick="deleteTeam('${doc.id}')">삭제</button>
      </div>
    `;
  });
}
async function resetTeam(teamId) {
  if (!confirm(`${teamId} 팀을 초기화할까요?`)) return;
  await db.collection("teams").doc(teamId).set({ score: 0 }, { merge: true });
  await db.collection("answers").doc(teamId).delete();
  loadTeams();
}
async function deleteTeam(teamId) {
  if (!confirm(`${teamId} 팀을 삭제할까요?`)) return;
  await db.collection("teams").doc(teamId).delete();
  await db.collection("answers").doc(teamId).delete();
  loadTeams();
}

// 📋 응답 기록
async function loadAnswerRecords() {
  const snap = await db.collection("answers").get();
  const container = document.getElementById("answerTable");
  if (!container) return;

  let html = '<table><thead><tr><th>팀</th><th>공장</th><th>문제</th><th>선택</th><th>비용</th></tr></thead><tbody>';
  for (const doc of snap.docs) {
    const records = doc.data().records || [];
    for (const r of records) {
      let questionText = r.questionId;
      try {
        const qDoc = await db.collection("questions").doc(r.questionId).get();
        if (qDoc.exists) {
          questionText = qDoc.data().text.slice(0, 50) + '...';
        }
      } catch (e) {}
      html += `<tr>
        <td>${doc.id}</td>
        <td>${r.factory}</td>
        <td>${questionText}</td>
        <td>${r.option}</td>
        <td>${r.cost}</td>
      </tr>`;
    }
  }

  html += '</tbody></table>';
  container.innerHTML = html;
}
