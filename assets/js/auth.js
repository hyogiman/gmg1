async function login() {
  const teamId = document.getElementById("teamId").value.trim();
  const pw = document.getElementById("teamPw").value.trim();

  if (!teamId || !pw) return alert("ID와 비밀번호를 입력하세요.");

  const doc = await db.collection("teams").doc(teamId).get();
  if (!doc.exists) return alert("존재하지 않는 팀입니다.");

  const data = doc.data();
  if (data.password !== pw) return alert("비밀번호가 틀렸습니다.");

  localStorage.setItem("currentTeam", teamId);
  location.href = "home.html";
}
