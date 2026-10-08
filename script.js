async function pay() {

  const nameInput = document.getElementById("name");
  const amountInput = document.getElementById("amount");
  const message = document.getElementById("message");

  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);


  // Validation
  if (!name) {
    alert("Name डालें");
    nameInput.focus();
    return;
  }

  if (!amount || amount <= 0) {
    alert("सही Amount डालें");
    amountInput.focus();
    return;
  }


  // Button
  const button = document.querySelector(".btn");

  if (button) {
    button.disabled = true;
    button.textContent = "Processing...";
  }


  try {

    // Backend को payment भेजना
    const response = await fetch("/api/payment", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        name: name,
        amount: amount
      })

    });


    const data = await response.json();


    // Backend error
    if (!response.ok || !data.success) {

      throw new Error(
        data.message || "Payment request failed"
      );

    }


    // Payment ID मिला
    const paymentId = data.payment.id;


    if (message) {

      message.textContent =
        "Payment request backend तक पहुँच गई।";

    }


    // Payment test page
    window.location.href =
      "payment-test.html?id=" +
      encodeURIComponent(paymentId);


  } catch (error) {

    console.error(error);

    alert(
      "Backend से connection नहीं हुआ। Server check करें।"
    );


    if (button) {
      button.disabled = false;
      button.textContent = "Pay Now";
    }

  }

}


// ------------------------------------
// WEBSITE NAME
// ------------------------------------

const savedName =
  localStorage.getItem("siteName");

if (savedName) {

  const title =
    document.getElementById("siteName");

  if (title) {
    title.textContent = savedName;
  }

}


// ------------------------------------
// DEFAULT AMOUNT
// ------------------------------------

const savedAmount =
  localStorage.getItem("defaultAmount");

if (savedAmount) {

  const amountInput =
    document.getElementById("amount");

  if (amountInput && !amountInput.value) {

    amountInput.value = savedAmount;

  }

}