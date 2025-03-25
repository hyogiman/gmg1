async function login() {
  const teamId = document.getElementById("teamId").value.trim();
  const pw = document.getElementById("teamPw").value.trim();

  if (!teamId || !pw) {
    alert("ID와 비밀번호를 입력하세요.");
    return;
  }

  const ref = db.collection("teams").doc(teamId);
  const doc = await ref.get();

  if (!doc.exists) {
    alert("존재하지 않는 팀입니다.");
    return;
  }

  const data = doc.data();
  if (data.password !== pw) {
    alert("비밀번호가 틀렸습니다.");
    return;
  }

  localStorage.setItem("currentTeam", teamId);
  alert("✅ 로그인 성공!");
  location.href = "home.html";
}
