document.addEventListener("DOMContentLoaded", () => {
  loadProgramStatus();
  loadFactories();
  loadQuestions();

  // 이미지 파일 선택 시 미리보기 및 용량 체크
  const imageInput = document.getElementById("questionImage");
  const preview = document.getElementById("previewImage");

  imageInput.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return (preview.style.display = "none");

    if (file.size > 2 * 1024 * 1024) {
      alert("❌ 이미지 용량은 2MB 이하만 가능합니다.");
      this.value = "";
      preview.style.display = "none";
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
});

// 🔌 프로그램 제어
async function toggleProgram() {
  const open = document.getElementById("programSwitch").checked;
  await db.collection("config").doc("global").set({ open }, { merge: true });
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

// 🧩 문제 저장
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

  if (file) {
    const reader = new FileReader();
    reader.onload = async () => {
      const imageBase64 = reader.result;
      await saveOrUpdateQuestion(id, { factory, text, options, timeLimit, image: imageBase64 });
    };
    reader.readAsDataURL(file);
  } else {
    await saveOrUpdateQuestion(id, { factory, text, options, timeLimit });
  }
}

async function saveOrUpdateQuestion(id, data) {
  if (id) {
    await db.collection("questions").doc(id).set(data, { merge: true });
  } else {
    await db.collection("questions").add(data);
  }
  alert("문제 저장 완료 ✅");
  document.getElementById("editQuestionId").value = "";
  loadQuestions();
}

// 문제 수정 & 삭제
async function editQuestion(id) {
  const doc = await db.collection("questions").doc(id).get();
  const q = doc.data();

  document.getElementById("editQuestionId").value = id;
  document.getElementById("factorySelector").value = q.factory;
  document.getElementById("questionText").value = q.text;
  document.getElementById("timeLimit").value = q.timeLimit;
  document.getElementById("optA").value = q.options.A.text;
  document.getElementById("costA").value = q.options.A.cost;
  document.getElementById("optB").value = q.options.B.text;
  document.getElementById("costB").value = q.options.B.cost;
  document.getElementById("optC").value = q.options.C.text;
  document.getElementById("costC").value = q.options.C.cost;
}

async function deleteQuestion(id) {
  if (!confirm("문제를 삭제할까요?")) return;
  await db.collection("questions").doc(id).delete();
  alert("삭제 완료");
  loadQuestions();
}

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
