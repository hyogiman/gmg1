function calculateScore() {
  const team = localStorage.getItem("currentTeam");
  const records = JSON.parse(localStorage.getItem("troubleRecords")) || {};
  let totalCost = 0;

  if (records[team]) {
    records[team].forEach(r => totalCost += r.cost);
  }

  let scores = JSON.parse(localStorage.getItem("scores")) || {};
  scores[team] = totalCost;
  localStorage.setItem("scores", JSON.stringify(scores));

  alert(`총 유지보수 비용: ${totalCost}원`);
  window.location.href = "result.html";
}