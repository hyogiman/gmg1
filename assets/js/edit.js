const queryParams = new URLSearchParams(location.search);
const questionId = queryParams.get("id");

if (!questionId) {
  alert("문제 ID가 없습니다.");
  location.href = "admin.html";
}

async function loadFactories() {
  const snap = await db.collection("factories").get();
  const selector = document.getElementById("factorySelector");
  selector.innerHTML = '';
  snap.forEach(doc => {
    selector.innerHTML += `<option value="${doc.id}">${doc.id}</option>`;
  });
}

async function loadQuestion() {
  const doc = await db.collection("questions").doc(questionId).get();
  if (!doc.exists) return alert("문제를 찾을 수 없습니다.");

  const q = doc.data();
  document.getElementById("factorySelector").value = q.factory || "";
  document.getElementById("questionText").value = q.text || "";
  document.getElementById("timeLimit").value = q.timeLimit || 60;
  document.getElementById("optA").value = q.options?.A?.text || "";
  document.getElementById("costA").value = q.options?.A?.cost || 0;
  document.getElementById("optB").value = q.options?.B?.text || "";
  document.getElementById("costB").value = q.options?.B?.cost || 0;
  document.getElementById("optC").value = q.options?.C?.text || "";
  document.getElementById("costC").value = q.options?.C?.cost || 0;

  if (q.image) {
    const preview = document.getElementById("previewImage");
    preview.src = q.image;
    preview.style.display = "block";
  }
}

async function updateQuestion() {
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
    reader.onload = async () => {
      const image = reader.result;
      await saveUpdate({ factory, text, timeLimit, options, image });
    };
    reader.readAsDataURL(file);
  } else {
    await saveUpdate({ factory, text, timeLimit, options });
  }
}

async function saveUpdate(data) {
  await db.collection("questions").doc(questionId).set(data, { merge: true });
  alert("✅ 문제 수정 완료");
  location.href = "admin.html";
}

loadFactories().then(loadQuestion);
