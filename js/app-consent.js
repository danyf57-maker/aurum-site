document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("rgpdBanner");
  const btn = document.getElementById("rgpdAccept");

  if (!window.localStorage.getItem("rgpdAccepted")) {
    if (banner) banner.style.display = "flex";
  }

  if (btn && banner) {
    btn.addEventListener("click", () => {
      window.localStorage.setItem("rgpdAccepted", "true");
      banner.style.display = "none";
    });
  }
});
