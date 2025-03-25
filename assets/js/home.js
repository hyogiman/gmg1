const teamId = localStorage.getItem("currentTeam");
if (!teamId) location.href = "index.html";

async function loadTeamInfo() {
  const snap = await db.collection("teams").get();
  const sorted = [];
  snap.forEach(doc => {
    const score = doc.data().score || 0;
    sorted.push({ id: doc.id, score });
  });

  sorted.sort((a, b) => a.score - b.score);
  const rank = sorted.findIndex(t => t.id === teamId) + 1;

  document.getElementById("teamInfo").innerHTML = `
    <p><strong>팀:</strong> ${teamId}</p>
    <p><strong>현재 순위:</strong> ${rank}등</p>
  `;
}

function openCodeInput() {
  const code = prompt("입장 코드를 입력하세요:");
  if (!code) return;

  const factoryMap = {
    "1234": "BPA",
    "5678": "Utility"
  };

  const factory = factoryMap[code];
  if (!factory) return alert("❌ 올바르지 않은 코드입니다.");

  localStorage.setItem("currentFactory", factory);
  location.href = "gateway.html";
}

function logout() {
  localStorage.removeItem("currentTeam");
  location.href = "index.html";
}

loadTeamInfo();
