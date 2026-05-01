const PRICE_MAP = { trial: 99, bundle: 249, mega: 399 };

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  try {
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) return { statusCode: 500, body: JSON.stringify({ message: 'Razorpay keys missing' }) };

    const body = JSON.parse(event.body || '{}');
    const product = String(body.product || '').trim();
    const amount = Number(body.amount);
    if (!PRICE_MAP[product] || PRICE_MAP[product] !== amount) return { statusCode: 400, body: JSON.stringify({ message: 'Invalid product or amount' }) };

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount * 100, currency: 'INR', receipt: `nutritop_${Date.now()}` })
    });
    const data = await response.json();
    if (!response.ok) return { statusCode: 500, body: JSON.stringify({ message: data.error?.description || 'Razorpay order failed' }) };

    return { statusCode: 200, body: JSON.stringify({ order_id: data.id, amount: data.amount, key_id: RAZORPAY_KEY_ID }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ message: e.message }) };
  }
};
