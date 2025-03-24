document.addEventListener("DOMContentLoaded", () => {
  // 🔒 프로그램 오픈 여부 확인
  if (localStorage.getItem("programOpen") !== "true") {
    alert("🔒 아직 Program 시작 시간이 아닙니다.");
    window.location.href = "index.html";
    return;
  }

  // 팀 및 점수 표시
  const team = localStorage.getItem("currentTeam");
  const scores = JSON.parse(localStorage.getItem("scores") || {});
  document.getElementById("scoreDisplay").innerText = `내 점수: ${scores[team] || 0}원`;

  // 공장 리스트 불러오기
  const factories = JSON.parse(localStorage.getItem("factories") || ["NCC", "Utility"]);
  localStorage.setItem("factories", JSON.stringify(factories));
  const factoryList = document.getElementById("factoryList");

  factories.forEach(factory => {
    const btn = document.createElement("button");
    btn.innerText = `${factory} 공장 입장`;
    btn.onclick = () => {
      const code = prompt(`${factory} 입장 코드 4자리를 입력하세요`);
      if (code === "1234") {
        localStorage.setItem("currentFactory", factory);
        window.location.href = "trouble.html";
      } else {
        alert("코드가 올바르지 않습니다.");
      }
    };
    factoryList.appendChild(btn);
  });
});

// ✅ 순위보기 팝업
function showRanking() {
  const scores = JSON.parse(localStorage.getItem("scores") || "{}");
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);

  let html = "<h3>순위</h3><ol>";
  sorted.forEach(([team]) => html += `<li>${team}</li>`);
  html += "</ol>";

  const popup = window.open("", "Ranking", "width=300,height=400");
  popup.document.write(`<body style="font-family:sans-serif;padding:20px;">${html}</body>`);
}