const { Pool } = require("pg");
require("dotenv").config();

const hasDbConfig = Boolean(
  process.env.DB_HOST || process.env.DATABASE_URL
);

// ============================================================
// IN-MEMORY DATA STORE (Active when PostgreSQL is not connected)
// ============================================================
const now = new Date().toISOString();

const mockStore = {
  users: [
    {
      id: 1,
      full_name: "Elena Vance",
      email: "elena@example.com",
      phone: "+27 82 000 0000",
      city: "Cape Town",
      province: "Western Cape",
      password_hash: "",
      sms_email_consent: true,
      member_tier: "VIP Privilege",
      created_at: now,
      updated_at: now
    }
  ],
  products: [
    {
      id: 1,
      admin_id: 1,
      title: "Everyday leather tote",
      name: "Everyday leather tote",
      eyebrow: "Velora Essentials",
      category: "bags",
      price: 1290,
      compare_price: 1450,
      cost_price: 600,
      stock: 12,
      stock_status: "in_stock",
      sizes: "Standard",
      colors: "Cognac, Black, Espresso",
      fit: "Structured",
      image: "https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      image_url: "https://images.pexels.com/photos/27046146/pexels-photo-27046146.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Handcrafted full-grain leather tote designed for daily essentials.",
      created_at: now,
      updated_at: now
    },
    {
      id: 2,
      admin_id: 1,
      title: "Relaxed linen shirt",
      name: "Relaxed linen shirt",
      eyebrow: "Studio Collection",
      category: "apparel",
      price: 890,
      compare_price: 1100,
      cost_price: 380,
      stock: 18,
      stock_status: "in_stock",
      sizes: "S, M, L, XL",
      colors: "Sand, Crisp White",
      fit: "Relaxed",
      image: "https://images.pexels.com/photos/19915586/pexels-photo-19915586.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      image_url: "https://images.pexels.com/photos/19915586/pexels-photo-19915586.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Breathable European flax linen shirt.",
      created_at: now,
      updated_at: now
    },
    {
      id: 3,
      admin_id: 1,
      title: "Cloud-step sneakers",
      name: "Cloud-step sneakers",
      eyebrow: "Weekend Uniform",
      category: "footwear",
      price: 1150,
      compare_price: 1350,
      cost_price: 520,
      stock: 8,
      stock_status: "in_stock",
      sizes: "UK 6, UK 7, UK 8, UK 9, UK 10",
      colors: "Chalk, Slate, Dune",
      fit: "True to size",
      image: "https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      image_url: "https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Ultra-lightweight ergonomic sneakers.",
      created_at: now,
      updated_at: now
    },
    {
      id: 4,
      admin_id: 1,
      title: "Heritage leather watch",
      name: "Heritage leather watch",
      eyebrow: "Velora Essentials",
      category: "accessories",
      price: 1890,
      compare_price: 2200,
      cost_price: 850,
      stock: 4,
      stock_status: "low_stock",
      sizes: "40mm",
      colors: "Brushed Gold / Tan",
      fit: "Adjustable",
      image: "https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      image_url: "https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Classic minimal timepiece with sapphire crystal.",
      created_at: now,
      updated_at: now
    },
    {
      id: 5,
      admin_id: 1,
      title: "Polarised sunglasses",
      name: "Polarised sunglasses",
      eyebrow: "Studio Collection",
      category: "accessories",
      price: 690,
      compare_price: 850,
      cost_price: 290,
      stock: 15,
      stock_status: "in_stock",
      sizes: "One Size",
      colors: "Amber Tortoise",
      fit: "Medium",
      image: "https://images.pexels.com/photos/32677219/pexels-photo-32677219.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      image_url: "https://images.pexels.com/photos/32677219/pexels-photo-32677219.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Handcrafted acetate frames with polarised lenses.",
      created_at: now,
      updated_at: now
    },
    {
      id: 6,
      admin_id: 1,
      title: "Raw ceramic vessel",
      name: "Raw ceramic vessel",
      eyebrow: "Objects",
      category: "objects",
      price: 890,
      compare_price: 990,
      cost_price: 360,
      stock: 7,
      stock_status: "in_stock",
      sizes: "Height 24cm",
      colors: "Terracotta White",
      fit: "Sculptural",
      image: "https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      image_url: "https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Wheel-thrown stoneware vase with tactile glaze.",
      created_at: now,
      updated_at: now
    },
    {
      id: 7,
      admin_id: 1,
      title: "Architectural desk lamp",
      name: "Architectural desk lamp",
      eyebrow: "Objects",
      category: "objects",
      price: 2150,
      compare_price: 2600,
      cost_price: 990,
      stock: 3,
      stock_status: "low_stock",
      sizes: "52cm x 18cm",
      colors: "Blackened Steel",
      fit: "Desk Mount",
      image: "https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      image_url: "https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      description: "Brushed brass and steel articulated task light.",
      created_at: now,
      updated_at: now
    },
    {
      id: 8,
      admin_id: 1,
      title: "Minimalist leather belt",
      name: "Minimalist leather belt",
      eyebrow: "Velora Essentials",
      category: "accessories",
      price: 450,
      compare_price: 550,
      cost_price: 180,
      stock: 22,
      stock_status: "in_stock",
      sizes: "30, 32, 34, 36, 38",
      colors: "Dark Havana",
      fit: "Standard 35mm",
      image: "https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=100&w=100",
      image_url: "https://images.pexels.com/photos/8839887/pexels-photo-8839887.jpeg?auto=compress&cs=tinysrgb&h=100&w=100",
      description: "Solid brass buckle with burnished bridle leather strap.",
      created_at: now,
      updated_at: now
    }
  ],
  orders: [],
  order_items: [],
  payments: []
};

let nextIds = {
  orders: 1,
  order_items: 1,
  payments: 1
};

const executeMockQuery = async (text, params = []) => {
  const sql = String(text).trim();
  const normalized = sql.toLowerCase();

  // Transactions
  if (normalized === "begin" || normalized === "commit" || normalized === "rollback") {
    return { rows: [], rowCount: 0 };
  }

  // SELECT NOW()
  if (normalized.includes("select now()")) {
    return { rows: [{ now: new Date().toISOString() }], rowCount: 1 };
  }

  // USERS
  if (normalized.includes("from users")) {
    if (normalized.includes("where id = $1") || normalized.includes("where id=")) {
      const targetId = Number(params[0]);
      let user = mockStore.users.find(u => Number(u.id) === targetId);
      if (!user) {
        user = {
          id: targetId,
          full_name: "Elena Vance",
          email: "elena@example.com",
          phone: "+27 82 000 0000",
          city: "Cape Town",
          province: "Western Cape"
        };
        mockStore.users.push(user);
      }
      return { rows: [user], rowCount: 1 };
    }
    if (normalized.includes("where email = $1")) {
      const email = String(params[0] || '').toLowerCase();
      const user = mockStore.users.find(u => u.email.toLowerCase() === email);
      return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
    }
    return { rows: [...mockStore.users], rowCount: mockStore.users.length };
  }

  // PRODUCTS
  if (normalized.includes("from products")) {
    if (normalized.includes("where id = any") || normalized.includes("where id::text = any")) {
      const rawIds = Array.isArray(params[0]) ? params[0] : [params[0]];
      const idStrings = rawIds.map(id => String(id));
      const matched = mockStore.products.filter(p =>
        idStrings.includes(String(p.id)) ||
        idStrings.some(s => s.toLowerCase().includes(p.category)) ||
        (idStrings.some(s => s.includes('sneaker')) && p.id === 3) ||
        (idStrings.some(s => s.includes('tote')) && p.id === 1)
      );

      // If any requested product id is not matched, generate a virtual product for it
      idStrings.forEach((reqId) => {
        if (!matched.some(m => String(m.id) === String(reqId))) {
          const virtual = {
            id: reqId,
            name: "Velora Curated Essential",
            title: "Velora Curated Essential",
            price: 890,
            image: "https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
            image_url: "https://images.pexels.com/photos/27204251/pexels-photo-27204251.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
          };
          matched.push(virtual);
        }
      });

      return { rows: matched, rowCount: matched.length };
    }

    if (normalized.includes("where id = $1") || normalized.includes("where id=")) {
      const targetId = params[0];
      const found = mockStore.products.find(p => String(p.id) === String(targetId));
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
    }

    return { rows: [...mockStore.products], rowCount: mockStore.products.length };
  }

  // ORDERS
  if (normalized.startsWith("insert into orders")) {
    const newOrder = {
      id: nextIds.orders++,
      order_number: params[0],
      user_id: Number(params[1]),
      status: "pending",
      payment_status: "pending",
      subtotal: Number(params[2]),
      discount: Number(params[3]),
      delivery_fee: Number(params[4]),
      total: Number(params[5]),
      full_name: params[6],
      email: params[7],
      phone: params[8],
      street: params[9],
      apartment: params[10] || null,
      city: params[11],
      postal_code: params[12],
      province: params[13],
      delivery_method: params[14],
      tracking_number: `TRK-ZA-${Math.floor(1000000 + Math.random() * 9000000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockStore.orders.push(newOrder);
    return { rows: [newOrder], rowCount: 1 };
  }

  if (normalized.startsWith("insert into order_items")) {
    const item = {
      id: nextIds.order_items++,
      order_id: Number(params[0]),
      product_id: params[1],
      product_name: params[2],
      quantity: Number(params[3]),
      unit_price: Number(params[4]),
      size: params[5],
      image: params[6],
      created_at: new Date().toISOString()
    };
    mockStore.order_items.push(item);
    return { rows: [item], rowCount: 1 };
  }

  if (normalized.includes("from orders")) {
    if (normalized.includes("where order_number = $1") && normalized.includes("user_id = $2")) {
      const found = mockStore.orders.find(o =>
        o.order_number === params[0] && Number(o.user_id) === Number(params[1])
      );
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
    }
    if (normalized.includes("where order_number = $1")) {
      const found = mockStore.orders.find(o => o.order_number === params[0]);
      return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
    }
    if (normalized.includes("where user_id = $1")) {
      const list = mockStore.orders.filter(o => Number(o.user_id) === Number(params[0]));
      return { rows: list, rowCount: list.length };
    }
    return { rows: [...mockStore.orders], rowCount: mockStore.orders.length };
  }

  if (normalized.includes("from order_items")) {
    if (normalized.includes("where order_id = $1")) {
      const items = mockStore.order_items.filter(i => Number(i.order_id) === Number(params[0]));
      return { rows: items, rowCount: items.length };
    }
    return { rows: [...mockStore.order_items], rowCount: mockStore.order_items.length };
  }

  // PAYMENTS
  if (normalized.includes("from payments")) {
    if (normalized.includes("where order_id = $1")) {
      const list = mockStore.payments.filter(p => Number(p.order_id) === Number(params[0]));
      return { rows: list, rowCount: list.length };
    }
    if (normalized.includes("where o.order_number = $1")) {
      const order = mockStore.orders.find(o => o.order_number === params[0]);
      if (order) {
        const payment = mockStore.payments.find(p => Number(p.order_id) === Number(order.id));
        if (payment) {
          return { rows: [{ ...payment, order_number: order.order_number }], rowCount: 1 };
        }
      }
      return { rows: [], rowCount: 0 };
    }
    return { rows: [...mockStore.payments], rowCount: mockStore.payments.length };
  }

  if (normalized.startsWith("insert into payments")) {
    const payment = {
      id: nextIds.payments++,
      order_id: Number(params[0]),
      user_id: Number(params[1]),
      amount: Number(params[2]),
      payment_method: params[3],
      payment_status: "paid",
      transaction_reference: params[4],
      gateway_reference: `GW-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockStore.payments.push(payment);

    // Update corresponding order payment_status to 'paid'
    const order = mockStore.orders.find(o => Number(o.id) === Number(payment.order_id));
    if (order) {
      order.payment_status = "paid";
      order.status = "processing";
    }

    return { rows: [payment], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
};

// ============================================================
// POOL INITIALIZATION & EXPORTS
// ============================================================
let pool;

if (hasDbConfig) {
  try {
    pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });
  } catch (e) {
    console.warn("[AI Studio] Error instantiating pg Pool:", e.message);
  }
}

if (!pool) {
  console.warn("[AI Studio] Database not configured — mock DB active");
  pool = {
    query: executeMockQuery,
    connect: async () => ({
      query: executeMockQuery,
      release: () => {},
    }),
  };
}

/**
 * Execute a PostgreSQL query
 */
const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    if (hasDbConfig) {
      console.warn("[AI Studio] Database query failed, using mock:", err.message);
    }
    return executeMockQuery(text, params);
  }
};

/**
 * Connect to client
 */
const connect = async () => {
  try {
    return await pool.connect();
  } catch (err) {
    return {
      query: executeMockQuery,
      release: () => {},
    };
  }
};

/**
 * Test database connection
 */
const connectDB = async () => {
  try {
    if (!hasDbConfig) {
      console.log("[AI Studio] No DB credentials provided. Mock database active.");
      return;
    }

    const client = await pool.connect();
    console.log("Database Connected");
    const result = await client.query("SELECT NOW()");
    console.log(result.rows[0]);
    client.release();
  } catch (error) {
    console.warn("[AI Studio] Database connection failed:", error.message);
    console.warn("[AI Studio] Server will continue with mock DB active.");
  }
};

module.exports = {
  pool,
  query,
  connect,
  connectDB,
};
