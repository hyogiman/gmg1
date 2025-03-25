document.addEventListener("DOMContentLoaded", () => {
  loadProgramStatus();
  loadFactories();
  loadQuestions();
  document.getElementById("questionImage").addEventListener("change", previewImage);
});

// 🔌 프로그램 ON/OFF
async function toggleProgram() {
  const isOpen = document.getElementById("programSwitch").checked;
  await db.collection("config").doc("global").set({ open: isOpen });
}
async function loadProgramStatus() {
  const doc = await db.collection("config").doc("global").get();
  document.getElementById("programSwitch").checked = doc.exists ? doc.data().open : false;
}

// 🏭 공장 관리
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
  loadFactories();
}
async function loadFactories() {
  const snap = await db.collection("factories").get();
  const selector = document.getElementById("factorySelector");
  const list = document.getElementById("factoryList");
  selector.innerHTML = '';
  list.innerHTML = '';
  snap.forEach(doc => {
    selector.innerHTML += `<option value="${doc.id}">${doc.id}</option>`;
    list.innerHTML += `<li>${doc.id} <button onclick="deleteFactory('${doc.id}')">삭제</button></li>`;
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

// 🧩 문제 등록/수정
async function saveQuestion() {
  const factory = document.getElementById("factorySelector").value;
  const text = document.getElementById("questionText").value;
  const timeLimit = parseInt(document.getElementById("timeLimit").value) || 60;
  const id = document.getElementById("editQuestionId").value;

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
      submitQuestion(id, { factory, text, timeLimit, options, image });
    };
    reader.readAsDataURL(file);
  } else {
    submitQuestion(id, { factory, text, timeLimit, options });
  }
}

async function submitQuestion(id, data) {
  if (!data.factory) return alert("공장을 선택하세요.");
  if (id) {
    await db.collection("questions").doc(id).set(data, { merge: true });
  } else {
    await db.collection("questions").add(data);
  }
  alert("문제 저장 완료");
  clearForm();
  loadQuestions();
}

function clearForm() {
  document.getElementById("editQuestionId").value = "";
  document.getElementById("questionText").value = "";
  document.getElementById("timeLimit").value = "";
  ["A", "B", "C"].forEach(opt => {
    document.getElementById("opt" + opt).value = "";
    document.getElementById("cost" + opt).value = "";
  });
  document.getElementById("questionImage").value = "";
  document.getElementById("previewImage").style.display = "none";
}

// 문제 수정 버튼 → 필드 반영
async function editQuestion(id) {
  const doc = await db.collection("questions").doc(id).get();
  if (!doc.exists) return alert("문제를 찾을 수 없습니다.");
  const q = doc.data();

  document.getElementById("editQuestionId").value = id;
  document.getElementById("factorySelector").value = q.factory || "";
  document.getElementById("questionText").value = q.text || "";
  document.getElementById("timeLimit").value = q.timeLimit || 60;

  ["A", "B", "C"].forEach(opt => {
    document.getElementById("opt" + opt).value = q.options?.[opt]?.text || "";
    document.getElementById("cost" + opt).value = q.options?.[opt]?.cost || 0;
  });

  if (q.image) {
    const preview = document.getElementById("previewImage");
    preview.src = q.image;
    preview.style.display = "block";
  }
}

async function deleteQuestion(id) {
  if (!confirm("문제를 삭제할까요?")) return;
  await db.collection("questions").doc(id).delete();
  loadQuestions();
}

// 📋 문제 전체 목록 출력
async function loadQuestions() {
  const snap = await db.collection("questions").orderBy("factory").get();
  const container = document.getElementById("questionList");
  container.innerHTML = '';
  snap.forEach(doc => {
    const q = doc.data();
    container.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin:10px;">
        <strong>[${q.factory}]</strong> ${q.text}<br/>
        A: ${q.options?.A?.text} (${q.options?.A?.cost})<br/>
        B: ${q.options?.B?.text} (${q.options?.B?.cost})<br/>
        C: ${q.options?.C?.text} (${q.options?.C?.cost})<br/>
        제한시간: ${q.timeLimit || 60}초<br/>
        ${q.image ? `<img src="${q.image}" style="max-width:200px;"><br/>` : ""}
        <button onclick="editQuestion('${doc.id}')">수정</button>
        <button onclick="deleteQuestion('${doc.id}')">삭제</button>
      </div>
    `;
  });
}
