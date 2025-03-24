document.addEventListener("DOMContentLoaded", () => {
  loadFactories();
  loadQuestions();
  loadProgramStatus();
});

// ✅ Firestore에서 공장 목록 불러오기
async function loadFactories() {
  const snapshot = await db.collection("factories").get();
  const selector = document.getElementById("factorySelector");
  selector.innerHTML = '';
  snapshot.forEach(doc => {
    const opt = document.createElement("option");
    opt.value = doc.id;
    opt.textContent = doc.id;
    selector.appendChild(opt);
  });
}

// ✅ 공장 등록
async function addFactory() {
  const name = document.getElementById("newFactory").value.trim();
  if (!name) return alert("공장명을 입력하세요.");

  await db.collection("factories").doc(name).set({ createdAt: new Date() });
  alert("공장 등록 완료 ✅");
  loadFactories();
}

// ✅ 문제 저장
async function saveQuestion() {
  const factory = document.getElementById("factorySelector").value;
  const text = document.getElementById("questionText").value;
  const timeLimit = parseInt(document.getElementById("timeLimit").value) || 60;
  const options = {
    A: { text: document.getElementById("optA").value, cost: parseInt(document.getElementById("costA").value) },
    B: { text: document.getElementById("optB").value, cost: parseInt(document.getElementById("costB").value) },
    C: { text: document.getElementById("optC").value, cost: parseInt(document.getElementById("costC").value) }
  };

  let imageBase64 = null;
  const imageFile = document.getElementById("questionImage").files[0];
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = async () => {
      imageBase64 = reader.result;
      await db.collection("questions").add({ factory, text, options, image: imageBase64, timeLimit });
      alert("문제 저장 완료 ✅");
      loadQuestions();
    };
    reader.readAsDataURL(imageFile);
  } else {
    await db.collection("questions").add({ factory, text, options, image: null, timeLimit });
    alert("문제 저장 완료 ✅");
    loadQuestions();
  }
}

// ✅ 문제 리스트 출력
async function loadQuestions() {
  const snapshot = await db.collection("questions").orderBy("factory").get();
  const container = document.getElementById("questionList");
  container.innerHTML = '';
  snapshot.forEach(doc => {
    const q = doc.data();
    container.innerHTML += `
      <div style="border:1px solid #ccc; padding:10px; margin:10px 0;">
        <strong>[${q.factory}] ${q.text}</strong><br />
        A: ${q.options.A.text} (${q.options.A.cost})<br />
        B: ${q.options.B.text} (${q.options.B.cost})<br />
        C: ${q.options.C.text} (${q.options.C.cost})<br />
        제한시간: ${q.timeLimit || 60}초<br />
        ${q.image ? `<img src="${q.image}" style="max-width:200px; margin-top:10px;" />` : ""}
      </div>
    `;
  });
}

// ✅ 프로그램 오픈 여부 저장
function toggleProgram() {
  const open = document.getElementById("programSwitch").checked;
  localStorage.setItem("programOpen", open ? "true" : "false");
}

function loadProgramStatus() {
  const open = localStorage.getItem("programOpen") === "true";
  document.getElementById("programSwitch").checked = open;
}