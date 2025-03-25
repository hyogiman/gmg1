async function loadResults() {
  const snap = await db.collection("teams").get();
  const teams = [];

  snap.forEach(doc => {
    const score = doc.data().score || 0;
    teams.push({ id: doc.id, score });
  });

  teams.sort((a, b) => a.score - b.score); // 오름차순: 점수 낮은 팀 우승

  let html = `<table>
    <thead><tr><th>순위</th><th>팀</th><th>총 비용</th></tr></thead>
    <tbody>`;

  teams.forEach((team, idx) => {
    html += `<tr>
      <td>${idx + 1}</td>
      <td>${team.id}</td>
      <td>${team.score}</td>
    </tr>`;
  });

  html += `</tbody></table>`;

  const winner = teams[0]?.id;
  html = `<h3>🏆 우승 팀: ${winner}</h3>` + html;

  document.getElementById("leaderboard").innerHTML = html;
}

function goHome() {
  location.href = "home.html";
}

loadResults();
