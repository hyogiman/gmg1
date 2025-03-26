let currentFactory = "";
let editingHintId = null;

// 공장 목록 로딩
async function loadFactories() {
  const snap = await db.collection("factories").get();
  const selector = document.getElementById("factorySelector");
  selector.innerHTML = "<option value=''>-- 공장 선택 --</option>";
  snap.forEach(doc => {
    selector.innerHTML += `<option value="${doc.id}">${doc.id}</option>`;
  });
}

// 힌트 목록 불러오기
async function loadHintList() {
  currentFactory = document.getElementById("factorySelector").value;
  const list = document.getElementById("hintList");
  list.innerHTML = "";

  if (!currentFactory) return;

  const snap = await db.collection("hints").doc(currentFactory).collection("items").get();
  snap.forEach(doc => {
    const hint = doc.data();
    list.innerHTML += `
      <li>
        ${hint.text?.slice(0, 40)}
        <button onclick="editHint('${doc.id}')">수정</button>
        <button onclick="deleteHint('${doc.id}')">삭제</button>
      </li>`;
  });
}

// 힌트 수정
async function editHint(id) {
  editingHintId = id;
  document.getElementById("editTitle").innerText = "✏️ 힌트 수정";

  const doc = await db.collection("hints").doc(currentFactory).collection("items").doc(id).get();
  const data = doc.data();

  document.getElementById("hintText").value = data.text || "";
  document.getElementById("timeLimit").value = data.timeLimit || "";
  if (data.image) {
    const preview = document.getElementById("previewImage");
    preview.src = data.image;
    preview.style.display = "block";
  }
}

// 힌트 저장
async function saveHint() {
  const text = document.getElementById("hintText").value.trim();
  const file = document.getElementById("hintImage").files[0];
  const timeLimit = parseInt(document.getElementById("timeLimit").value || "0");
  let imageData = null;

  if (!currentFactory) return alert("공장을 선택하세요.");
  if (file) imageData = await toBase64(file);
  else {
    const current = document.getElementById("previewImage").src;
    if (current && current.startsWith("data:")) imageData = current;
  }

  const hintData = { text, image: imageData };
  if (timeLimit > 0) hintData.timeLimit = timeLimit;

  const ref = db.collection("hints").doc(currentFactory).collection("items");
  if (editingHintId) {
    await ref.doc(editingHintId).set(hintData);
    alert("수정 완료");
  } else {
    await ref.add(hintData);
    alert("등록 완료");
  }

  loadHintList();
  resetForm();
}

// 힌트 삭제
async function deleteHint(id) {
  const ok = confirm("삭제하시겠습니까?");
  if (!ok) return;
  await db.collection("hints").doc(currentFactory).collection("items").doc(id).delete();
  loadHintList();
  resetForm();
}

// 힌트 초기화
function resetForm() {
  editingHintId = null;
  document.getElementById("editTitle").innerText = "➕ 새 힌트 등록";
  document.getElementById("hintText").value = "";
  document.getElementById("hintImage").value = "";
  document.getElementById("previewImage").style.display = "none";
  document.getElementById("timeLimit").value = "";
}

// base64 변환
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 이미지 프리뷰
document.getElementById("hintImage").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    document.getElementById("previewImage").src = evt.target.result;
    document.getElementById("previewImage").style.display = "block";
  };
  reader.readAsDataURL(file);
});

// 타이머 토글 불러오기
async function loadHintTimerToggle() {
  const doc = await db.collection("config").doc("hintTimer").get();
  const enabled = doc.exists && doc.data().enabled === true;
  document.getElementById("hintTimerSwitch").checked = enabled;
  document.getElementById("hintTimerStatus").innerText = enabled ? "활성화됨" : "비활성화됨";
}

// 토글 변경 저장
async function toggleHintTimer() {
  const enabled = document.getElementById("hintTimerSwitch").checked;
  await db.collection("config").doc("hintTimer").set({ enabled });
  document.getElementById("hintTimerStatus").innerText = enabled ? "활성화됨" : "비활성화됨";
}

// 📊 팀별 힌트 열람 통계 출력
async function loadHintStats() {
  const table = document.getElementById("hintStatsTable");
  table.innerHTML = "<p>불러오는 중...</p>";

  const snap = await db.collection("hint_views").get();
  let html = "<table><tr><th>팀 ID</th><th>공장</th><th>힌트 ID</th></tr>";

  snap.forEach(doc => {
    const teamId = doc.id;
    const data = doc.data();
    for (let factory in data) {
      for (let hintId in data[factory]) {
        html += `<tr><td>${teamId}</td><td>${factory}</td><td>${hintId}</td></tr>`;
      }
    }
  });

  html += "</table>";
  table.innerHTML = html;
}

// 초기 실행
document.addEventListener("DOMContentLoaded", () => {
  loadFactories();
  loadHintTimerToggle();
});
