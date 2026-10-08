function saveSettings() {
  const siteName = document.getElementById("siteName").value.trim();
  const upiId = document.getElementById("upiId").value.trim();
  const defaultAmount =
    document.getElementById("defaultAmount").value.trim();

  if (!siteName || !upiId) {
    alert("Website Name और UPI ID डालें");
    return;
  }

  localStorage.setItem("siteName", siteName);
  localStorage.setItem("upiId", upiId);
  localStorage.setItem("defaultAmount", defaultAmount);

  document.getElementById("message").innerText =
    "Settings saved successfully!";
}


// पहले से saved settings वापस दिखाएँ
document.getElementById("siteName").value =
  localStorage.getItem("siteName") || "";

document.getElementById("upiId").value =
  localStorage.getItem("upiId") || "";

document.getElementById("defaultAmount").value =
  localStorage.getItem("defaultAmount") || "";