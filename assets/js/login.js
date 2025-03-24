function login() {
  const teamId = document.getElementById("teamId").value;
  const password = document.getElementById("password").value;
  const teams = JSON.parse(localStorage.getItem("teams")) || {};

  if (teams[teamId] === password) {
    localStorage.setItem("currentTeam", teamId);
    alert("로그인 성공!");
    window.location.href = "main.html";
  } else {
    alert("팀 ID 또는 비밀번호가 올바르지 않습니다.");
  }
}