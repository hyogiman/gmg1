function registerTeam() {
  const teamId = document.getElementById("newTeamId").value;
  const password = document.getElementById("newPassword").value;

  let teams = JSON.parse(localStorage.getItem("teams")) || {};

  if (teams[teamId]) {
    alert("이미 존재하는 팀 ID입니다.");
    return;
  }

  teams[teamId] = password;
  localStorage.setItem("teams", JSON.stringify(teams));
  alert("등록 완료! 로그인 페이지로 이동합니다.");
  window.location.href = "login.html";
}