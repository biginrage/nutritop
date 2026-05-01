const crypto = require('crypto');

const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScitYhW6eHwJLcmTkhyiIidhXxFJw2wx9qG7SEP2CgtyDZ_lw/formResponse';
const ENTRY = {
  name: 'entry.1111111111',
  phone: 'entry.2222222222',
  product: 'entry.3333333333',
  amount: 'entry.4444444444',
  coupon: 'entry.5555555555',
  timestamp: 'entry.6666666666'
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method not allowed' }) };
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Razorpay secret missing' }) };
    const p = JSON.parse(event.body || '{}');

    const expected = crypto.createHmac('sha256', secret)
      .update(`${p.razorpay_order_id}|${p.razorpay_payment_id}`).digest('hex');
    if (expected !== p.razorpay_signature) return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid payment signature' }) };

    const formData = new URLSearchParams();
    formData.set(ENTRY.name, p.name || '');
    formData.set(ENTRY.phone, p.phone || '');
    formData.set(ENTRY.product, p.product || '');
    formData.set(ENTRY.amount, String(p.amount || ''));
    formData.set(ENTRY.coupon, p.coupon || '');
    formData.set(ENTRY.timestamp, p.timestamp || new Date().toISOString());

    await fetch(GOOGLE_FORM_URL, { method: 'POST', mode: 'no-cors', body: formData });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: e.message }) };
  }
};
