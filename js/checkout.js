const PRODUCT_MAP = {
  trial: { name: 'Trial Pack', meta: '50g • Just Try It First', amount: 99 },
  bundle: { name: '3 Pack Bundle', meta: 'Most Popular', amount: 249 },
  mega: { name: '250g VALUE PACK', meta: 'Best Value • MRP ₹499', amount: 399 }
};
const KEY_ID = 'rzp_live_Sit8oWhnvbVjX9';

const params = new URLSearchParams(window.location.search);
const productKey = params.get('product') || 'trial';
const product = PRODUCT_MAP[productKey];

const nameEl = document.getElementById('productName');
const metaEl = document.getElementById('productMeta');
const priceEl = document.getElementById('finalPrice');
const couponEl = document.getElementById('coupon');
const couponMsg = document.getElementById('couponMsg');
const statusEl = document.getElementById('status');

if (!product) {
  statusEl.textContent = 'Invalid product selected. Please go back.';
} else {
  nameEl.textContent = product.name;
  metaEl.textContent = product.meta;
  priceEl.textContent = `₹${product.amount}`;
}

couponEl.addEventListener('input', () => {
  const code = couponEl.value.trim();
  couponMsg.textContent = code ? `Order tagged to ${code}` : '';
});

document.getElementById('payBtn').addEventListener('click', async () => {
  try {
    if (!product) throw new Error('Invalid product.');
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const coupon = couponEl.value.trim();
    if (!name || !phone || !address) throw new Error('Please fill all required fields.');
    if (!/^\d{10}$/.test(phone)) throw new Error('Phone must be 10 digits.');

    statusEl.textContent = 'Creating order...';
    const createRes = await fetch('/.netlify/functions/create-order', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: productKey, amount: product.amount })
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.order_id) throw new Error(createData.message || 'Order creation failed.');

    const rz = new Razorpay({
      key: KEY_ID,
      order_id: createData.order_id,
      amount: createData.amount,
      currency: 'INR',
      name: 'Nutritop',
      description: product.name,
      prefill: { name, contact: phone },
      theme: { color: '#1a6b3c' },
      handler: async function (resp) {
        statusEl.textContent = 'Verifying payment...';
        const verifyRes = await fetch('/.netlify/functions/verify-payment', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...resp, name, phone, address, product: productKey, amount: product.amount, coupon,
            timestamp: new Date().toISOString()
          })
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.message || 'Verification failed.');
        statusEl.textContent = 'Payment success! Order placed.';
      }
    });
    rz.open();
  } catch (e) { statusEl.textContent = e.message; }
});
