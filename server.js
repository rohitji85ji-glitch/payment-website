const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const paymentsFile = path.join(__dirname, "payments.json");
const settingsFile = path.join(__dirname, "settings.json");

if (!fs.existsSync(paymentsFile)) {
  fs.writeFileSync(paymentsFile, "[]", "utf8");
}

if (!fs.existsSync(settingsFile)) {
  fs.writeFileSync(
    settingsFile,
    JSON.stringify({
      customerName: "",
      defaultAmount: "",
      upiId: "",
      siteName: "Make Payment"
    }, null, 2),
    "utf8"
  );
}

/* SETTINGS */

app.get("/api/settings", (req, res) => {
  try {
    const data = fs.readFileSync(settingsFile, "utf8");
    res.json(JSON.parse(data || "{}"));
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Settings read error"
    });
  }
});

app.post("/api/settings", (req, res) => {
  const customerName = String(
    req.body.customerName || ""
  ).trim();

  const defaultAmount = Number(
    req.body.defaultAmount
  );

  const upiId = String(
    req.body.upiId || ""
  ).trim();

  const siteName = String(
    req.body.siteName || "Make Payment"
  ).trim();

  if (!customerName) {
    return res.status(400).json({
      success: false,
      message: "Customer name is required"
    });
  }

  if (!defaultAmount || defaultAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid amount is required"
    });
  }

  if (!upiId) {
    return res.status(400).json({
      success: false,
      message: "UPI ID is required"
    });
  }

  const settings = {
    customerName,
    defaultAmount,
    upiId,
    siteName
  };

  fs.writeFileSync(
    settingsFile,
    JSON.stringify(settings, null, 2),
    "utf8"
  );

  res.json({
    success: true,
    message: "Settings saved successfully",
    settings
  });
});


/* TEST */

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend is working"
  });
});


/* PAYMENTS */

function getPayments() {
  try {
    const data = fs.readFileSync(
      paymentsFile,
      "utf8"
    );

    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function savePayments(payments) {
  fs.writeFileSync(
    paymentsFile,
    JSON.stringify(payments, null, 2),
    "utf8"
  );
}


app.post("/api/payment", (req, res) => {
  const name = String(
    req.body.name || ""
  ).trim();

  const amount = Number(
    req.body.amount
  );

  if (!name || !amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment data"
    });
  }

  const payments = getPayments();

  const payment = {
    id: Date.now(),
    name,
    amount,
    status: "Pending",
    date: new Date().toLocaleString("en-IN")
  };

  payments.push(payment);

  savePayments(payments);

  res.json({
    success: true,
    message: "Payment request received",
    payment
  });
});


app.get("/api/payments", (req, res) => {
  res.json(getPayments());
});


app.get("/api/payment/:id", (req, res) => {
  const id = String(req.params.id);

  const payment = getPayments().find(
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
    payment
  });
});


app.put("/api/payment/:id", (req, res) => {
  const id = String(req.params.id);
  const status = req.body.status;

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
    payment
  });
});


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


app.listen(PORT, () => {
  console.log("");
  console.log("================================");
  console.log("SERVER STARTED");
  console.log("PORT:", PORT);
  console.log("================================");
});