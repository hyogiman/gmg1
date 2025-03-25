async function registerTeam() {
  const teamId = document.getElementById("newTeamId").value.trim();
  const password = document.getElementById("newTeamPw").value.trim();

  if (!teamId || !password) {
    alert("모든 항목을 입력하세요.");
    return;
  }

  const ref = db.collection("teams").doc(teamId);
  const snap = await ref.get();

  if (snap.exists) {
    alert("이미 존재하는 팀 ID입니다.");
    return;
  }

  await ref.set({
    password: password,
    score: 0,
    createdAt: new Date()
  });

  alert("✅ 팀 등록 완료");
  location.href = "index.html";
}
