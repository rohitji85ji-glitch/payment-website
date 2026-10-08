const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const paymentsFile = path.join(__dirname, "payments.json");
const customersFile = path.join(__dirname, "customers.json");


/* FILES CREATE */

if (!fs.existsSync(paymentsFile)) {
  fs.writeFileSync(
    paymentsFile,
    "[]",
    "utf8"
  );
}

if (!fs.existsSync(customersFile)) {
  fs.writeFileSync(
    customersFile,
    "[]",
    "utf8"
  );
}


/* CUSTOMER FUNCTIONS */

function getCustomers() {

  try {

    const data =
      fs.readFileSync(
        customersFile,
        "utf8"
      );

    return JSON.parse(
      data || "[]"
    );

  } catch (error) {

    console.log(
      "Customer file error:",
      error.message
    );

    return [];

  }
}


function saveCustomers(customers) {

  fs.writeFileSync(
    customersFile,
    JSON.stringify(
      customers,
      null,
      2
    ),
    "utf8"
  );

}


/* TEST */

app.get("/api/test", (req, res) => {

  res.json({
    success: true,
    message: "Backend is working"
  });

});


/* CREATE CUSTOMER PAYMENT LINK */

app.post(
  "/api/customer-link",
  (req, res) => {

    const name =
      String(
        req.body.name || ""
      ).trim();


    const amount =
      Number(
        req.body.amount
      );


    if (!name) {

      return res.status(400).json({
        success: false,
        message:
          "Customer name is required"
      });

    }


    if (!amount || amount <= 0) {

      return res.status(400).json({
        success: false,
        message:
          "Valid amount is required"
      });

    }


    const customers =
      getCustomers();


    /*
      UNIQUE ID
    */

    const id =
      crypto.randomUUID();


    const customer = {

      id: id,

      name: name,

      amount: amount,

      createdAt:
        new Date().toISOString()

    };


    customers.push(
      customer
    );


    saveCustomers(
      customers
    );


    res.json({

      success: true,

      message:
        "Payment link created",

      customer: customer

    });

  }
);


/* GET ALL CUSTOMERS */

app.get(
  "/api/customer-links",
  (req, res) => {

    const customers =
      getCustomers();

    res.json(
      customers
    );

  }
);


/* GET ONE CUSTOMER */

app.get(
  "/api/customer-link/:id",
  (req, res) => {

    const id =
      String(
        req.params.id
      );


    const customers =
      getCustomers();


    const customer =
      customers.find(
        function(item) {

          return String(
            item.id
          ) === id;

        }
      );


    if (!customer) {

      return res.status(404).json({

        success: false,

        message:
          "Customer not found"

      });

    }


    res.json({

      success: true,

      customer: customer

    });

  }
);


/* DELETE CUSTOMER */

app.delete(
  "/api/customer-link/:id",
  (req, res) => {

    const id =
      String(
        req.params.id
      );


    const customers =
      getCustomers();


    const newCustomers =
      customers.filter(
        function(item) {

          return String(
            item.id
          ) !== id;

        }
      );


    if (
      newCustomers.length ===
      customers.length
    ) {

      return res.status(404).json({

        success: false,

        message:
          "Customer not found"

      });

    }


    saveCustomers(
      newCustomers
    );


    res.json({

      success: true,

      message:
        "Customer deleted"

    });

  }
);


/* PAYMENT FUNCTIONS */

function getPayments() {

  try {

    const data =
      fs.readFileSync(
        paymentsFile,
        "utf8"
      );

    return JSON.parse(
      data || "[]"
    );

  } catch {

    return [];

  }

}


function savePayments(payments) {

  fs.writeFileSync(
    paymentsFile,
    JSON.stringify(
      payments,
      null,
      2
    ),
    "utf8"
  );

}


/* CREATE PAYMENT */

app.post(
  "/api/payment",
  (req, res) => {

    const name =
      String(
        req.body.name || ""
      ).trim();


    const amount =
      Number(
        req.body.amount
      );


    if (
      !name ||
      !amount ||
      amount <= 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid payment data"

      });

    }


    const payments =
      getPayments();


    const payment = {

      id: Date.now(),

      name: name,

      amount: amount,

      status: "Pending",

      date:
        new Date()
          .toLocaleString("en-IN")

    };


    payments.push(
      payment
    );


    savePayments(
      payments
    );


    res.json({

      success: true,

      message:
        "Payment request received",

      payment: payment

    });

  }
);


/* GET PAYMENTS */

app.get(
  "/api/payments",
  (req, res) => {

    res.json(
      getPayments()
    );

  }
);


/* GET PAYMENT */

app.get(
  "/api/payment/:id",
  (req, res) => {

    const id =
      String(
        req.params.id
      );


    const payment =
      getPayments().find(
        function(item) {

          return String(
            item.id
          ) === id;

        }
      );


    if (!payment) {

      return res.status(404).json({

        success: false,

        message:
          "Payment not found"

      });

    }


    res.json({

      success: true,

      payment: payment

    });

  }
);


/* UPDATE PAYMENT */

app.put(
  "/api/payment/:id",
  (req, res) => {

    const id =
      String(
        req.params.id
      );


    const status =
      req.body.status;


    if (
      status !== "Pending" &&
      status !== "Success" &&
      status !== "Failed"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Invalid payment status"

      });

    }


    const payments =
      getPayments();


    const payment =
      payments.find(
        function(item) {

          return String(
            item.id
          ) === id;

        }
      );


    if (!payment) {

      return res.status(404).json({

        success: false,

        message:
          "Payment not found"

      });

    }


    payment.status =
      status;


    savePayments(
      payments
    );


    res.json({

      success: true,

      payment: payment

    });

  }
);


/* DELETE PAYMENT */

app.delete(
  "/api/payment/:id",
  (req, res) => {

    const id =
      String(
        req.params.id
      );


    const payments =
      getPayments();


    const newPayments =
      payments.filter(
        function(item) {

          return String(
            item.id
          ) !== id;

        }
      );


    if (
      newPayments.length ===
      payments.length
    ) {

      return res.status(404).json({

        success: false,

        message:
          "Payment not found"

      });

    }


    savePayments(
      newPayments
    );


    res.json({

      success: true,

      message:
        "Payment deleted"

    });

  }
);


/* START SERVER */

app.listen(
  PORT,
  () => {

    console.log("");
    console.log(
      "================================"
    );
    console.log(
      "SERVER STARTED"
    );
    console.log(
      "PORT:",
      PORT
    );
    console.log(
      "================================"
    );
    console.log("");

  }
);