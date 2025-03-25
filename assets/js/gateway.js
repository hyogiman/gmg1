const teamId = localStorage.getItem("currentTeam");
const factory = localStorage.getItem("currentFactory");

if (!teamId || !factory) {
  alert("접근 오류: 팀 또는 공장 정보가 없습니다.");
  location.href = "home.html";
}

document.getElementById("factoryName").innerText = `🏭 ${factory} 공장`;

function startProblem() {
  location.href = "trouble.html";
}

function goHome() {
  location.href = "home.html";
}
