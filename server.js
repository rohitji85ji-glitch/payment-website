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

// TEST API
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend is working"
  });
});

// GET SETTINGS
app.get("/api/settings", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("id, upi_id, site_name, customer_name, default_amount")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    res.json({
      success: true,
      upiId: data?.upi_id || "",
      upi_id: data?.upi_id || "",
      siteName: data?.site_name || "Payment",
      site_name: data?.site_name || "Payment",
      customerName: data?.customer_name || "",
      defaultAmount: Number(data?.default_amount || 100)
    });
  } catch (error) {
    console.error("Settings GET:", error.message);

    res.status(500).json({
      success: false,
      message: "Settings load failed"
    });
  }
});

// SAVE SETTINGS
app.post("/api/settings", async (req, res) => {
  try {
    const upiId = String(
      req.body.upiId || req.body.upi_id || ""
    ).trim();

    const siteName = String(
      req.body.siteName || req.body.site_name || "Payment"
    ).trim();

    const customerName = String(
      req.body.customerName || req.body.customer_name || ""
    ).trim();

    const defaultAmount = Number(req.body.defaultAmount);

    if (!upiId || !siteName) {
      return res.status(400).json({
        success: false,
        message: "Website name and UPI ID are required"
      });
    }

    if (!Number.isFinite(defaultAmount) || defaultAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required"
      });
    }

    const { error } = await supabase
      .from("settings")
      .upsert({
        id: 1,
        upi_id: upiId,
        site_name: siteName,
        customer_name: customerName,
        default_amount: defaultAmount
      }, {
        onConflict: "id"
      });

    if (error) throw error;

    res.json({
      success: true,
      message: "Settings saved successfully"
    });
  } catch (error) {
    console.error("Settings SAVE:", error.message);

    res.status(500).json({
      success: false,
      message: "Settings save failed"
    });
  }
});

// CREATE CUSTOMER PAYMENT LINK
app.post("/api/customer-link", async (req, res) => {
  try {
    const name = String(
      req.body.name ||
      req.body.customerName ||
      req.body.customer_name ||
      ""
    ).trim();

    const amount = Number(req.body.amount);

    if (!name || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid customer name and amount required"
      });
    }

    const { data, error } = await supabase
      .from("customer_links")
      .insert([{ name, amount }])
      .select("*")
      .single();

    if (error) throw error;

    if (!data || data.id === undefined || data.id === null) {
      throw new Error("Customer ID was not returned by database");
    }

    // FIXED: Create the URL without a broken template string.
    const paymentUrl =
      req.protocol + "://" +
      req.get("host") +
      "/payment.html?id=" +
      encodeURIComponent(String(data.id));

    res.status(201).json({
      success: true,
      message: "Payment link created",
      customer: data,
      paymentUrl: paymentUrl,
      paymentLink: paymentUrl
    });
  } catch (error) {
    console.error("Create customer:", error.message);

    res.status(500).json({
      success: false,
      message: "Customer link creation failed"
    });
  }
});

// GET ALL CUSTOMERS
app.get("/api/customer-links", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("customer_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error("Customer list:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not load customers"
    });
  }
});

// GET ONE CUSTOMER BY ID
app.get("/api/customer-link/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID required"
      });
    }

    const { data, error } = await supabase
      .from("customer_links")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Payment link not found. Create a fresh link in Admin Panel."
      });
    }

    res.set("Cache-Control", "no-store");

    res.json({
      success: true,
      customer: data
    });
  } catch (error) {
    console.error("Get customer:", error.message);

    res.status(500).json({
      success: false,
      message: "Could not load customer"
    });
  }
});

// DELETE CUSTOMER
app.delete("/api/customer-link/:id", async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID required"
      });
    }

    const { data, error } = await supabase
      .from("customer_links")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    res.json({
      success: true,
      message: "Customer deleted"
    });
  } catch (error) {
    console.error("Delete customer:", error.message);

    res.status(500).json({
      success: false,
      message: "Delete failed"
    });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log("==============================");
  console.log("SERVER STARTED ON PORT " + PORT);
  console.log("==============================");
});
