const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");
require("dotenv").config();

const app = express();

// -----------------------------
// CORS (allow your website)
// -----------------------------
app.use(cors({
  origin: "https://theaetherclothing.com",
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// -----------------------------
// SUPABASE
// -----------------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// -----------------------------
// RESEND EMAIL CLIENT
// -----------------------------
const resend = new Resend(process.env.RESEND_API_KEY);

// -----------------------------
// SEND EMAILS
// -----------------------------
async function sendOrderEmails(order) {
  // CUSTOMER EMAIL
  await resend.emails.send({
    from: "Aether <orders@aether.com>",
    to: order.email,
    subject: `Your Aether Order #${order.orderId}`,
    html: `
      <h2>Thank you for your order, ${order.name}!</h2>
      <p>Your order has been received and is now being processed.</p>
      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <p><strong>Total:</strong> $${order.total}</p>
      <p>We will notify you once it ships.</p>
    `
  });

  // ADMIN EMAIL (YOU)
  await resend.emails.send({
    from: "Aether <orders@aether.com>",
    to: theaetherclothing@gmail.com, // <-- replace with your real email
    subject: `New Order Received #${order.orderId}`,
    html: `
      <h2>New Order Received</h2>
      <p><strong>Name:</strong> ${order.name}</p>
      <p><strong>Email:</strong> ${order.email}</p>
      <p><strong>Address:</strong> ${order.address}</p>
      <p><strong>Total:</strong> $${order.total}</p>
      <p><strong>Payment Method:</strong> ${order.payment_method}</p>

      <h3>Items:</h3>
      <pre>${JSON.stringify(order.items, null, 2)}</pre>
    `
  });
}

// -----------------------------
// ORDER ENDPOINT
// -----------------------------
app.post("/order", async (req, res) => {
  const { name, email, address, items, total, payment_method, discount } = req.body;

  console.log("Received order:", req.body);

  // Save to Supabase
  const { data, error } = await supabase
    .from("orders")
    .insert([
      {
        name,
        email,
        address,
        item: items,
        total,
        discount,
        payment_method,
        status: "pending"
      }
    ])
    .select();

  if (error) {
    console.log("SUPABASE ERROR:", error);
    return res.status(500).json({ error: error.message });
  }

  const orderId = data[0].id;
  console.log("Inserted:", data);

  // Send emails
  try {
    await sendOrderEmails({
      orderId,
      name,
      email,
      address,
      items,
      total,
      payment_method
    });
  } catch (emailErr) {
    console.log("EMAIL ERROR:", emailErr);
  }

  res.json({ success: true, orderId });
});

// -----------------------------
// START SERVER
// -----------------------------
app.listen(3000, () => console.log("Backend running on port 3000"));

