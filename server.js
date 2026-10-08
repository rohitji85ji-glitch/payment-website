require("dotenv").config();

const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase environment variables missing.");
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));


// ==========================================
// TEST API
// ==========================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend is working"
  });
});


// ==========================================
// UPI SETTINGS - GET
// ==========================================

app.get("/api/settings", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("settings")
      .select("upi_id")
      .eq("id", 1)
      .single();

    if (error) {

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }

    res.json({
      success: true,
      upi_id: data?.upi_id || ""
    });

  } catch (error) {

    console.error("Settings GET error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});


// ==========================================
// UPI SETTINGS - SAVE
// ==========================================

app.post("/api/settings", async (req, res) => {
  try {

    const upiId =
      String(req.body.upi_id || "").trim();

    if (!upiId) {

      return res.status(400).json({
        success: false,
        message: "UPI ID is required"
      });

    }

    const { error } = await supabase
      .from("settings")
      .upsert(
        {
          id: 1,
          upi_id: upiId
        },
        {
          onConflict: "id"
        }
      );

    if (error) {

      console.error("UPI save error:", error);

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }

    res.json({
      success: true,
      message: "UPI ID saved successfully"
    });

  } catch (error) {

    console.error("UPI save error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});


// ==========================================
// CREATE CUSTOMER PAYMENT LINK
// ==========================================

app.post("/api/customer-link", async (req, res) => {
  try {

    const name =
      String(req.body.name || "").trim();

    const amount =
      Number(req.body.amount);

    if (!name) {

      return res.status(400).json({
        success: false,
        message: "Customer name is required"
      });

    }

    if (!amount || amount <= 0) {

      return res.status(400).json({
        success: false,
        message: "Valid amount is required"
      });

    }

    const { data, error } = await supabase
      .from("customer_links")
      .insert([
        {
          name: name,
          amount: amount
        }
      ])
      .select()
      .single();

    if (error) {

      console.error("Customer insert error:", error);

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }

    res.json({
      success: true,
      message: "Payment link created",
      customer: data
    });

  } catch (error) {

    console.error("Create customer error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});


// ==========================================
// GET ALL CUSTOMERS
// ==========================================

app.get("/api/customer-links", async (req, res) => {
  try {

    const { data, error } = await supabase
      .from("customer_links")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {

      console.error("Customer list error:", error);

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }

    res.json(data || []);

  } catch (error) {

    console.error("Customer list error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});


// ==========================================
// GET ONE CUSTOMER
// ==========================================

app.get("/api/customer-link/:id", async (req, res) => {
  try {

    const id =
      String(req.params.id);

    const { data, error } = await supabase
      .from("customer_links")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {

      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });

    }

    res.json({
      success: true,
      customer: data
    });

  } catch (error) {

    console.error("Get customer error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});


// ==========================================
// DELETE CUSTOMER
// ==========================================

app.delete("/api/customer-link/:id", async (req, res) => {
  try {

    const id =
      String(req.params.id);

    const { error } = await supabase
      .from("customer_links")
      .delete()
      .eq("id", id);

    if (error) {

      console.error("Delete error:", error);

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }

    res.json({
      success: true,
      message: "Customer deleted"
    });

  } catch (error) {

    console.error("Delete customer error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
});


// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {

  console.log("");
  console.log("================================");
  console.log("SERVER STARTED");
  console.log("PORT:", PORT);
  console.log("SUPABASE: CONNECTED");
  console.log("================================");
  console.log("");

});