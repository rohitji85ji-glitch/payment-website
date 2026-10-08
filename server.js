const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// JSON request पढ़ने के लिए
app.use(express.json());

// Website की HTML, CSS, JS files चलाने के लिए
app.use(express.static(__dirname));

// ------------------------------------
// PAYMENT DATA FILE
// ------------------------------------

const paymentsFile = path.join(__dirname, "payments.json");

// अगर payments.json नहीं है तो अपने आप बनेगा
if (!fs.existsSync(paymentsFile)) {
  fs.writeFileSync(
    paymentsFile,
    JSON.stringify([], null, 2),
    "utf8"
  );
}


// ------------------------------------
// DATA READ
// ------------------------------------

function getPayments() {
  try {
    const data = fs.readFileSync(
      paymentsFile,
      "utf8"
    );

    return JSON.parse(data || "[]");

  } catch (error) {

    console.log("payments.json read error:", error.message);

    return [];
  }
}


// ------------------------------------
// DATA SAVE
// ------------------------------------

function savePayments(payments) {

  fs.writeFileSync(
    paymentsFile,
    JSON.stringify(payments, null, 2),
    "utf8"
  );
}


// ------------------------------------
// TEST API
// ------------------------------------

app.get("/api/test", (req, res) => {

  res.json({
    success: true,
    message: "Backend is working"
  });

});


// ------------------------------------
// CREATE PAYMENT
// ------------------------------------

app.post("/api/payment", (req, res) => {

  const name = String(req.body.name || "").trim();
  const amount = Number(req.body.amount);


  // Validation
  if (!name || !amount || amount <= 0) {

    return res.status(400).json({
      success: false,
      message: "Invalid payment data"
    });

  }


  const payments = getPayments();


  const payment = {

    id: Date.now(),

    name: name,

    amount: amount,

    status: "Pending",

    date: new Date().toLocaleString("en-IN")

  };


  payments.push(payment);

  savePayments(payments);


  res.json({

    success: true,

    message: "Payment request received",

    payment: payment

  });

});


// ------------------------------------
// GET ALL PAYMENTS
// ------------------------------------

app.get("/api/payments", (req, res) => {

  const payments = getPayments();

  res.json(payments);

});


// ------------------------------------
// GET SINGLE PAYMENT
// ------------------------------------

app.get("/api/payment/:id", (req, res) => {

  const id = String(req.params.id);

  const payments = getPayments();


  const payment = payments.find(
    p => String(p.id) === id
  );


  if (!payment) {

    return res.status(404).json({

      success: false,

      message: "Payment not found"

    });

  }


  res.json({

    success: true,

    payment: payment

  });

});


// ------------------------------------
// UPDATE PAYMENT STATUS
// ------------------------------------

app.put("/api/payment/:id", (req, res) => {

  const id = String(req.params.id);

  const status = req.body.status;


  // केवल ये तीन status allowed हैं
  if (
    status !== "Pending" &&
    status !== "Success" &&
    status !== "Failed"
  ) {

    return res.status(400).json({

      success: false,

      message: "Invalid payment status"

    });

  }


  const payments = getPayments();


  const payment = payments.find(
    p => String(p.id) === id
  );


  if (!payment) {

    return res.status(404).json({

      success: false,

      message: "Payment not found"

    });

  }


  payment.status = status;

  savePayments(payments);


  res.json({

    success: true,

    message: "Payment status updated",

    payment: payment

  });

});


// ------------------------------------
// DELETE PAYMENT
// ------------------------------------

app.delete("/api/payment/:id", (req, res) => {

  const id = String(req.params.id);

  const payments = getPayments();


  const newPayments = payments.filter(
    p => String(p.id) !== id
  );


  if (newPayments.length === payments.length) {

    return res.status(404).json({

      success: false,

      message: "Payment not found"

    });

  }


  savePayments(newPayments);


  res.json({

    success: true,

    message: "Payment deleted"

  });

});


// ------------------------------------
// SERVER START
// ------------------------------------

app.listen(PORT, () => {

  console.log("");
  console.log("================================");
  console.log("SERVER STARTED");
  console.log("http://localhost:" + PORT);
  console.log("================================");
  console.log("");

});