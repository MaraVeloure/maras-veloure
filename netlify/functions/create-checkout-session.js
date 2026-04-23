const Stripe = require('stripe');
const { STRIPE_CATALOG } = require('../../stripe-catalog');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

function buildImageUrl(origin, imagePath) {
  if (!imagePath) return undefined;
  try {
    return new URL(imagePath, origin).toString();
  } catch {
    return undefined;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  if (!stripeSecretKey) {
  return json(500, { error: 'Missing STRIPE_SECRET_KEY environment variable.' });
}

 
const stripe = new Stripe(stripeSecretKey);
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const cartItems = Array.isArray(payload.items) ? payload.items : [];
  const origin = payload.origin || process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL;

  if (!origin) {
    return json(400, { error: 'Missing site origin.' });
  }

  if (!cartItems.length) {
    return json(400, { error: 'Your cart is empty.' });
  }

  try {
    const line_items = cartItems.map((item) => {
      const catalogItem = STRIPE_CATALOG[item.id];
      if (!catalogItem) {
        throw new Error(`Unknown product: ${item.id}`);
      }

      const size = item.size;
      const color = item.color;
      const quantity = Number(item.quantity || 1);
      const unitPrice = catalogItem.priceBySize[size];

      if (!unitPrice) {
        throw new Error(`Invalid size for ${catalogItem.name}: ${size}`);
      }

      if (!catalogItem.images[color]) {
        throw new Error(`Invalid color for ${catalogItem.name}: ${color}`);
      }

      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        throw new Error(`Invalid quantity for ${catalogItem.name}`);
      }

      const descriptionBits = [catalogItem.subtitle, `Color: ${color}`, `Size: ${size}`].filter(Boolean);
      const imageUrl = buildImageUrl(origin, catalogItem.images[color]);

      return {
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(unitPrice * 100),
          product_data: {
            name: catalogItem.name,
            description: descriptionBits.join(' • '),
            images: imageUrl ? [imageUrl] : undefined,
            metadata: {
              product_id: item.id,
              color,
              size
            }
          }
        }
      };
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['US']
      },
      phone_number_collection: {
        enabled: true
      },
      automatic_tax: {
        enabled: false
      },
      allow_promotion_codes: true
    });

    return json(200, { url: session.url });
  } catch (error) {
    return json(400, { error: error.message || 'Unable to create checkout session.' });
  }
};
