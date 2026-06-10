const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

// ⭐ ALLOW YOUR WEBSITE DOMAIN
app.use(cors({
  origin: "https://theaetherclothing.com",
  methods: ["POST", "GET"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.post("/order", async (req, res) => {
  const { name, email, address, items, total, payment_method } = req.body;

  console.log("Received order:", req.body);

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

  console.log("Inserted:", data);
  res.json({ success: true, orderId: data[0].id });
});

app.listen(3000, () => console.log("Backend running on port 3000"));
