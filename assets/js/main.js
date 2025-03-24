document.addEventListener("DOMContentLoaded", async () => {
  const teamId = localStorage.getItem("currentTeam");
  if (!teamId) return;

  // 점수 표시
  const teamDoc = await db.collection("teams").doc(teamId).get();
  const score = teamDoc.exists ? teamDoc.data().score || 0 : 0;
  document.getElementById("scoreDisplay").innerText = `내 점수: ${score}원`;

  // 공장 목록 불러오기
  const factorySnap = await db.collection("factories").get();
  const factoryList = document.getElementById("factoryList");

  factorySnap.forEach(doc => {
    const name = doc.id;
    const btn = document.createElement("button");
    btn.innerText = `${name} 공장 입장`;
    btn.onclick = () => {
      const code = prompt(`${name} 입장 코드 (예: 1234)`);
      if (code === "1234") {
        localStorage.setItem("currentFactory", name);
        location.href = "trouble.html";
      } else {
        alert("입장 코드가 틀렸습니다.");
      }
    };
    factoryList.appendChild(btn);
  });
});