// A stand-in for the Tebex Headless API for end-to-end tests. The app points
// every Tebex call here via TEBEX_API_BASE (see lib/tebex/client.ts) so the
// suite runs deterministically, offline, and with no real store token.
//
// Response envelopes mirror what lib/tebex/index.ts expects:
//   - account-scoped reads return `{ data: ... }`
//   - the basket-package mutations return the Basket object directly
// Field shapes only need to satisfy lib/tebex/mapper.ts.

import { createServer } from "node:http";

const PORT = Number(process.env.FIXTURE_PORT ?? 4599);

const CATEGORY_RANKS = 1;
const CATEGORY_KEYS = 2;

function pkg(overrides) {
  return {
    id: 0,
    name: "",
    description: "<p>A fixture package.</p>",
    image: null,
    media: [],
    type: "single",
    base_price: 10,
    discount: 0,
    total_price: 10,
    expiration_date: null,
    category: { id: CATEGORY_RANKS, name: "Ranks" },
    variables: [],
    disable_quantity: false,
    disable_gifting: false,
    ...overrides,
  };
}

const PACKAGES = {
  100: pkg({ id: 100, name: "VIP Rank", base_price: 10, total_price: 10 }),
  101: pkg({
    id: 101,
    name: "MVP Rank",
    base_price: 20,
    discount: 5,
    total_price: 15,
  }),
  200: pkg({
    id: 200,
    name: "Crate Key",
    base_price: 5,
    total_price: 5,
    category: { id: CATEGORY_KEYS, name: "Keys" },
  }),
};

const CATEGORIES = {
  [CATEGORY_RANKS]: {
    id: CATEGORY_RANKS,
    name: "Ranks",
    description: "<p>Permanent rank upgrades.</p>",
    image_url: null,
    display_type: "grid",
    packages: [PACKAGES[100], PACKAGES[101]],
  },
  [CATEGORY_KEYS]: {
    id: CATEGORY_KEYS,
    name: "Keys",
    description: "<p>Crate keys.</p>",
    image_url: null,
    display_type: "list",
    packages: [PACKAGES[200]],
  },
};

const WEBSTORE = {
  id: 1,
  name: "Fixture Store",
  description: "<p>An end-to-end test storefront.</p>",
  logo: null,
  currency: "USD",
  lang: "en",
  disabled: false,
  platform_type: "Minecraft: Java Edition",
  supports_usernames: false,
  supports_gifting: false,
};

/** ident -> basket object (mapBasket shape). */
const baskets = new Map();

function makeBasket(ident, username) {
  return {
    id: Math.floor(Math.random() * 1e6),
    ident,
    complete: false,
    packages: [],
    coupons: [],
    giftcards: [],
    creator_code: null,
    base_price: 0,
    total_price: 0,
    currency: "USD",
    username: username ?? null,
  };
}

function recalc(basket) {
  const total = basket.packages.reduce(
    (sum, p) => sum + p.in_basket.price * p.in_basket.quantity,
    0,
  );
  basket.base_price = total;
  basket.total_price = total;
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method ?? "GET";

  // --- account-scoped endpoints: /api/accounts/<token>/... ----------------
  // Everything except the basket-package mutations is scoped under the token
  // (see lib/tebex/client.ts).
  const account = path.match(/^\/api\/accounts\/[^/]+(\/.*)?$/);
  if (account) {
    const rest = account[1] ?? "/";

    if (method === "GET" && rest === "/") {
      return send(res, 200, { data: WEBSTORE });
    }
    if (method === "GET" && rest === "/categories") {
      return send(res, 200, { data: Object.values(CATEGORIES) });
    }
    const catMatch = rest.match(/^\/categories\/(\d+)$/);
    if (method === "GET" && catMatch) {
      const cat = CATEGORIES[Number(catMatch[1])];
      return cat ? send(res, 200, { data: cat }) : send(res, 404, {});
    }
    const pkgMatch = rest.match(/^\/packages\/(\d+)$/);
    if (method === "GET" && pkgMatch) {
      const found = PACKAGES[Number(pkgMatch[1])];
      return found ? send(res, 200, { data: found }) : send(res, 404, {});
    }

    // Basket create + read are account-scoped and wrapped in `{ data }`.
    if (method === "POST" && rest === "/baskets") {
      const body = await readJson(req);
      const ident = `fixture-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
      const basket = makeBasket(ident, body.username);
      baskets.set(ident, basket);
      return send(res, 200, { data: basket });
    }
    const basketRead = rest.match(/^\/baskets\/([^/]+)$/);
    if (method === "GET" && basketRead) {
      const basket = baskets.get(decodeURIComponent(basketRead[1]));
      return basket ? send(res, 200, { data: basket }) : send(res, 404, {});
    }

    return send(res, 404, {});
  }

  // --- basket-package mutations: NOT account-scoped, return the Basket
  //     object directly (no `{ data }` envelope) ------------------------
  const addMatch = path.match(/^\/api\/baskets\/([^/]+)\/packages$/);
  if (method === "POST" && addMatch) {
    const basket = baskets.get(decodeURIComponent(addMatch[1]));
    if (!basket) return send(res, 404, {});
    const body = await readJson(req);
    const source = PACKAGES[Number(body.package_id)];
    if (!source) return send(res, 422, { detail: "Invalid product provided." });
    const quantity = Number(body.quantity) || 1;
    basket.packages.push({
      id: source.id,
      name: source.name,
      image: source.image,
      in_basket: { quantity, price: source.total_price },
    });
    recalc(basket);
    return send(res, 200, basket);
  }

  // --- remove package -------------------------------------------------
  const removeMatch = path.match(/^\/api\/baskets\/([^/]+)\/packages\/remove$/);
  if (method === "POST" && removeMatch) {
    const basket = baskets.get(decodeURIComponent(removeMatch[1]));
    if (!basket) return send(res, 404, {});
    const body = await readJson(req);
    basket.packages = basket.packages.filter(
      (p) => p.id !== Number(body.package_id),
    );
    recalc(basket);
    return send(res, 200, basket);
  }

  return send(res, 404, {});
});

server.listen(PORT);
