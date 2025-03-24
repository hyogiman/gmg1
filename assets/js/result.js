document.addEventListener("DOMContentLoaded", () => {
  const team = localStorage.getItem("currentTeam");
  const scores = JSON.parse(localStorage.getItem("scores")) || {};
  document.getElementById("scoreDisplay").innerText = `내 점수: ${scores[team] || 0}원`;
});