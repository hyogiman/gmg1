document.addEventListener("DOMContentLoaded", async () => {
  const team = localStorage.getItem("currentTeam");
  if (!team) return;

  const teamDoc = await db.collection("teams").doc(team).get();
  const score = teamDoc.exists ? teamDoc.data().score : 0;
  document.getElementById("scoreDisplay").innerText = `내 점수: ${score}원`;

  const factoriesSnap = await db.collection("factories").get();
  const factoryList = document.getElementById("factoryList");

  factoriesSnap.forEach(doc => {
    const factory = doc.id;
    const btn = document.createElement("button");
    btn.innerText = `${factory} 공장 입장`;
    btn.onclick = () => {
      const code = prompt(`${factory} 입장 코드 4자리를 입력하세요`);
      if (code === "1234") {
        localStorage.setItem("currentFactory", factory);
        location.href = "trouble.html";
      } else {
        alert("코드가 틀렸습니다.");
      }
    };
    factoryList.appendChild(btn);
  });
});

function showRanking() {
  db.collection("teams").get().then(snapshot => {
    const scores = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      scores.push([doc.id, data.score || 0]);
    });

    scores.sort((a, b) => a[1] - b[1]);

    let html = "<h3>순위</h3><ol>";
    scores.forEach(([team]) => html += `<li>${team}</li>`);
    html += "</ol>";

    const popup = window.open("", "Ranking", "width=300,height=400");
    popup.document.write(`<body style="font-family:sans-serif;padding:20px;">${html}</body>`);
  });
}