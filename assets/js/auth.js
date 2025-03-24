// ✅ 팀 등록
async function registerTeam() {
  const id = document.getElementById("registerId").value.trim();
  const pw = document.getElementById("registerPw").value.trim();

  if (!id || !pw) return alert("ID와 비밀번호를 모두 입력하세요.");

  const doc = await db.collection("teams").doc(id).get();
  if (doc.exists) return alert("이미 존재하는 팀입니다.");

  await db.collection("teams").doc(id).set({
    password: pw,
    score: 0
  });

  alert("팀 등록 완료 ✅");
  location.href = "index.html";
}

// ✅ 팀 로그인
async function loginTeam() {
  const id = document.getElementById("loginId").value.trim();
  const pw = document.getElementById("loginPw").value.trim();

  const doc = await db.collection("teams").doc(id).get();
  if (!doc.exists) return alert("존재하지 않는 팀입니다.");
  if (doc.data().password !== pw) return alert("비밀번호가 틀렸습니다.");

  localStorage.setItem("currentTeam", id);
  alert("로그인 성공 ✅");
  location.href = "main.html";
}