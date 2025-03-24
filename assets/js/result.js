async function loadResults() {
  const teamsSnap = await db.collection("teams").get();
  const answersSnap = await db.collection("answers").get();

  const answersMap = {};
  answersSnap.forEach(doc => {
    answersMap[doc.id] = doc.data().records || [];
  });

  const rows = [];
  teamsSnap.forEach(doc => {
    const id = doc.id;
    const score = doc.data().score || 0;
    const answers = answersMap[id] || [];
    rows.push({ id, score, answers });
  });

  rows.sort((a, b) => a.score - b.score);

  let html = `
    <table>
      <thead>
        <tr>
          <th>순위</th>
          <th>팀 ID</th>
          <th>총 비용</th>
          <th>풀이 기록</th>
        </tr>
      </thead>
      <tbody>
  `;

  rows.forEach((row, idx) => {
    const recordHtml = row.answers.map(r =>
      `[${r.factory}] ${r.option} (${r.cost}원)`
    ).join("<br>");

    html += `
      <tr>
        <td>${idx + 1}</td>
        <td>${row.id}</td>
        <td>${row.score}원</td>
        <td>${recordHtml}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";

  document.getElementById("resultTableContainer").innerHTML = html;
}