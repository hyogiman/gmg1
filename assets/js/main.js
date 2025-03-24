document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("programOpen") !== "true") {
    alert("🔒 아직 Program 시작 시간이 아닙니다.");
    window.location.href = "index.html";
    return;
  }

  const factories = JSON.parse(localStorage.getItem("factories") || ["NCC", "Utility"]);
  localStorage.setItem("factories", JSON.stringify(factories));

  const scores = JSON.parse(localStorage.getItem("scores") || {});
  const team = localStorage.getItem("currentTeam");
  document.getElementById("scoreDisplay").innerText = `내 점수: ${scores[team] || 0}원`;

  const container = document.querySelector(".container");

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
    container.appendChild(btn);
  });
});