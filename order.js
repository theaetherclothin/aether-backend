const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

// ⭐ ALLOW ONLY YOUR DOMAIN
app.use(cors({
  origin: "https://theaetherclothing.com",
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ⭐ SUPABASE CLIENT (SERVICE ROLE KEY)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ⭐ EMAIL SENDER FUNCTION
async function sendOrderEmail(order) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: "orders@aether.com",
    to: order.email,
    subject: `Your Aether Order #${order.id}`,
    text: `
Hi ${order.name},

Thank you for your order with AETHER.

Order ID: ${order.id}
Total: $${order.total}
Payment Method: ${order.payment_method}

We will notify you when your order ships.

— AETHER Team
    `
  };

  await transporter.sendMail(mailOptions);
}

// ⭐ ORDER ENDPOINT
app.post("/order", async (req, res) => {
  const { name, email, address, items, total, payment_method } = req.body;

  console.log("Received order:", req.body);

  // Save order to Supabase
  const { data, error } = await supabase
    .from("orders")
    .insert([
      {
        name,
        email,
        address,
        item: items,
        total,
        payment_method,
        status: "pending"
      }
    ])
    .select();

  if (error) {
    console.log("SUPABASE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }

  const order = data[0];

  // ⭐ SEND EMAIL AFTER ORDER IS SAVED
  try {
    await sendOrderEmail(order);
    console.log("Email sent for order:", order.id);
  } catch (emailError) {
    console.log("EMAIL ERROR:", emailError);
  }

  res.json({ success: true, orderId: order.id });
});

// ⭐ START SERVER
app.listen(3000, () => console.log("Backend running on port 3000"));
