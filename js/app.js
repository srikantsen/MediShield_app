/* ─────────────────────────────────────────────────
   MediShield — app.js
   Author: srikant_
───────────────────────────────────────────────── */

// ─── STATE ──
let currentStep = 0;
let selectedConditions = [];
let selectedPlan = null;
let selectedAddons = [];
let cart = [];

// ─── PLAN DEFINITIONS ────────────────────────────
const planDefs = [
  {
    id: 'basic',
    icon: '🌿',
    name: 'Essential Care',
    tag: 'Core coverage, everyday peace of mind',
    base: 799,
    features: [
      'Hospitalisation Cover',
      'Emergency ambulance',
      'Day care procedures',
      'Cashless at 3000+ hospitals',
      'Maternity (basic)',
    ],
    noFeatures: ['OPD Cover', 'Critical illness rider', 'Mental wellness'],
  },
  {
    id: 'standard',
    icon: '⭐',
    name: 'Shield Plus',
    tag: 'Best value for families',
    popular: true,
    base: 1499,
    features: [
      'All Essential benefits',
      'OPD Cover ₹5000/yr',
      'Critical illness ₹5L',
      'Mental wellness',
      'Dental & vision (basic)',
      'Restore benefit',
    ],
    noFeatures: ['Overseas coverage'],
  },
  {
    id: 'premium',
    icon: '💎',
    name: 'Platinum 360°',
    tag: 'Comprehensive, no compromises',
    base: 2899,
    features: [
      'All Shield Plus benefits',
      'OPD Cover ₹15000/yr',
      'Critical illness ₹25L',
      'Overseas emergency',
      'Dental & vision (full)',
      'No room rent limit',
      'Personal health coach',
    ],
    noFeatures: [],
  },
];

// ─── ADD-ON DEFINITIONS ──────────────────────────
const addonList = [
  { id: 'maternity', icon: '🤰', name: 'Maternity Plus',  desc: 'Enhanced maternity cover up to ₹1L', price: 299 },
  { id: 'opd',      icon: '🩺', name: 'OPD Boost',       desc: 'Add ₹10,000 extra OPD per year',    price: 199 },
  { id: 'dental',   icon: '🦷', name: 'Dental Shield',    desc: 'Comprehensive dental care',          price: 149 },
  { id: 'wellness', icon: '🧘', name: 'Wellness Pack',    desc: 'Gym, nutrition & mental health',    price: 99  },
  { id: 'overseas', icon: '✈️', name: 'Global Cover',     desc: 'Emergency cover while abroad',      price: 399 },
  { id: 'accident', icon: '🦺', name: 'Accident Guard',   desc: 'Personal accident ₹10L cover',      price: 129 },
];

// ─── STEP NAVIGATION ─────────────────────────────
function goStep(n) {
  if (n === 1 && !validateStep0()) return;
  if (n === 2) {
    if (!selectedPlan) { showToast('Please select a plan first'); return; }
    buildOrderSummary();
  }

  document.querySelectorAll('.step-section').forEach(s => s.classList.remove('active'));
  document.getElementById('step' + n).classList.add('active');
  currentStep = n;
  updateDots();

  if (n === 1) buildPlans();
  if (n === 2) buildAddons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateDots() {
  [0, 1, 2].forEach(i => {
    const d = document.getElementById('dot' + i);
    d.className = 'step-dot' + (i < currentStep ? ' done' : i === currentStep ? ' active' : '');
  });
  document.getElementById('stepLabel').textContent = `Step ${currentStep + 1} of 3`;
}

// ─── FORM VALIDATION ─────────────────────────────
function validateStep0() {
  const name   = document.getElementById('fname').value.trim();
  const age    = parseInt(document.getElementById('age').value);
  const gender = document.querySelector('input[name=gender]:checked');
  const family = document.querySelector('input[name=family]:checked');
  const sum    = document.getElementById('sumInsured').value;

  if (!name)                        { showToast('Please enter your name');           return false; }
  if (!age || age < 18 || age > 80) { showToast('Enter a valid age (18–80)');        return false; }
  if (!gender)                      { showToast('Please select your gender');        return false; }
  if (!family)                      { showToast('Please select family size');        return false; }
  if (!sum)                         { showToast('Please select sum insured');        return false; }
  return true;
}

// ─── CONDITION CHIPS ─────────────────────────────
function toggleChip(el, val) {
  if (val === 'None') {
    selectedConditions = [];
    document.querySelectorAll('#conditionsGroup .checkbox-pill').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedConditions = ['None'];
    return;
  }

  // Remove 'None' if another condition is chosen
  const noneIdx = selectedConditions.indexOf('None');
  if (noneIdx > -1) {
    selectedConditions.splice(noneIdx, 1);
    document.querySelectorAll('#conditionsGroup .checkbox-pill').forEach(c => {
      if (c.textContent === 'None') c.classList.remove('selected');
    });
  }

  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    selectedConditions = selectedConditions.filter(v => v !== val);
  } else {
    el.classList.add('selected');
    selectedConditions.push(val);
  }
}

// ─── PREMIUM CALCULATION ─────────────────────────
function calcPremium(base) {
  const age  = parseInt(document.getElementById('age').value) || 30;
  const fam  = parseInt(document.querySelector('input[name=family]:checked')?.value || 1);
  const sum  = parseInt(document.getElementById('sumInsured').value || 5);
  const cond = selectedConditions.filter(c => c !== 'None').length;

  let p = base;
  if (age > 45) p *= 1.3;
  if (age > 60) p *= 1.5;
  p *= (1 + (fam - 1) * 0.35);
  p *= (1 + cond * 0.12);
  p *= (sum / 5);
  return Math.round(p / 100) * 100;
}

// ─── BUILD PLANS ─────────────────────────────────
function buildPlans() {
  const name   = document.getElementById('fname').value;
  const age    = document.getElementById('age').value;
  const gender = document.querySelector('input[name=gender]:checked')?.value || '—';
  const city   = document.getElementById('city').value || '—';
  const fam    = document.querySelector('input[name=family]:checked')?.value || 1;
  const sum    = document.getElementById('sumInsured').value;
  const conds  = selectedConditions.length ? selectedConditions.join(', ') : 'None';

  document.getElementById('profileSummary').innerHTML = [
    `👤 ${name}`, `🎂 Age ${age}`, `⚧ ${gender}`, `📍 ${city}`,
    `👨‍👩‍👧 ${fam} member(s)`, `🏥 ₹${sum}L coverage`, `📋 ${conds}`
  ].map(t => `<span style="background:#fff;border-radius:50px;padding:6px 16px;border:1px solid rgba(74,124,111,0.2)">${t}</span>`).join('');

  const grid = document.getElementById('plansGrid');
  grid.innerHTML = planDefs.map(p => {
    const price = calcPremium(p.base);
    const sel   = selectedPlan?.id === p.id;
    return `
    <div class="plan-card ${p.popular ? 'popular' : ''} ${sel ? 'selected' : ''}" onclick="selectPlan('${p.id}',${price})" id="planCard_${p.id}">
      ${p.popular ? `<div class="popular-badge">⭐ Most Popular</div>` : ''}
      <div class="plan-icon">${p.icon}</div>
      <div class="plan-name">${p.name}</div>
      <div class="plan-tagline">${p.tag}</div>
      <div class="plan-price">₹${price.toLocaleString('en-IN')}<span>/mo</span></div>
      <ul class="plan-features">
        ${p.features.map(f => `<li>${f}</li>`).join('')}
        ${p.noFeatures.map(f => `<li class="no">${f}</li>`).join('')}
      </ul>
      <button class="select-plan-btn">${sel ? '✓ Selected' : 'Select Plan'}</button>
    </div>`;
  }).join('');
}

function selectPlan(id, price) {
  selectedPlan  = { ...planDefs.find(p => p.id === id), price };
  selectedAddons = [];

  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('planCard_' + id);
  card.classList.add('selected');
  card.querySelector('.select-plan-btn').textContent = '✓ Selected';
  document.querySelectorAll('.plan-card:not(.selected) .select-plan-btn').forEach(b => b.textContent = 'Select Plan');

  setTimeout(() => goStep(2), 280);
}

// ─── BUILD ADD-ONS ───────────────────────────────
function buildAddons() {
  document.getElementById('addonGrid').innerHTML = addonList.map(a => {
    const sel = selectedAddons.find(x => x.id === a.id);
    return `
    <div style="border:2px solid ${sel ? 'var(--sage)' : '#e5ebe9'};border-radius:16px;padding:18px;cursor:pointer;transition:var(--transition);background:${sel ? 'var(--sage-pale)' : 'var(--cream)'}"
         onclick="toggleAddon('${a.id}')" id="addon_${a.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <span style="font-size:1.4rem">${a.icon}</span>
        <span style="font-weight:700;color:var(--sage);font-size:0.95rem">+₹${a.price}/mo</span>
      </div>
      <div style="font-weight:600;font-size:0.92rem;margin-bottom:4px">${a.name}</div>
      <div style="font-size:0.8rem;color:var(--warm-gray)">${a.desc}</div>
    </div>`;
  }).join('');
  buildOrderSummary();
}

function toggleAddon(id) {
  const a   = addonList.find(x => x.id === id);
  const idx = selectedAddons.findIndex(x => x.id === id);
  if (idx > -1) selectedAddons.splice(idx, 1);
  else selectedAddons.push(a);
  buildAddons();
}

// ─── ORDER SUMMARY ───────────────────────────────
function buildOrderSummary() {
  if (!selectedPlan) return;
  const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const total      = selectedPlan.price + addonTotal;

  document.getElementById('orderSummary').innerHTML = `
    <div class="summary-box">
      <div class="summary-row"><span class="key">Plan</span><span class="val">${selectedPlan.name}</span></div>
      <div class="summary-row"><span class="key">Base Premium</span><span class="val">₹${selectedPlan.price.toLocaleString('en-IN')}/mo</span></div>
      ${selectedAddons.map(a => `<div class="summary-row"><span class="key">${a.icon} ${a.name}</span><span class="val">+₹${a.price}/mo</span></div>`).join('')}
      <hr style="border:none;border-top:1px dashed rgba(74,124,111,0.3);margin:12px 0">
      <div class="summary-row" style="font-size:1.05rem">
        <span class="key" style="font-weight:700">Monthly Total</span>
        <span class="val" style="color:var(--sage);font-size:1.15rem">₹${total.toLocaleString('en-IN')}</span>
      </div>
      <div class="summary-row">
        <span class="key" style="font-size:0.8rem">Annual Estimate</span>
        <span class="val" style="font-size:0.8rem;color:var(--warm-gray)">₹${(total * 12).toLocaleString('en-IN')}</span>
      </div>
    </div>`;
}

// ─── CART ────────────────────────────────────────
function addToCart() {
  if (!selectedPlan) { showToast('No plan selected'); return; }

  const name       = document.getElementById('fname').value;
  const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
  const total      = selectedPlan.price + addonTotal;

  const item = {
    id:       Date.now(),
    planName: selectedPlan.name,
    planIcon: selectedPlan.icon,
    holder:   name,
    monthly:  total,
    addons:   [...selectedAddons],
    coverage: document.getElementById('sumInsured').value + 'L',
    family:   document.querySelector('input[name=family]:checked')?.value || 1,
  };

  cart.push(item);
  updateCartUI();
  showToast(`${selectedPlan.icon} ${selectedPlan.name} added to cart!`);
  toggleCart();
  resetForm();
}

function resetForm() {
  selectedPlan   = null;
  selectedAddons = [];
  selectedConditions = [];
  goStep(0);
  ['fname','age','city','occupation','sumInsured'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.querySelectorAll('input[type=radio]').forEach(r => r.checked = false);
  document.querySelectorAll('.checkbox-pill,.radio-pill').forEach(p => p.classList.remove('selected'));
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  updateCartUI();
  showToast('Item removed');
}

function updateCartUI() {
  document.getElementById('cartBadge').textContent = cart.length;
  const body   = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');

  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty"><div class="big-icon">🛒</div>Your cart is empty.<br>Find a plan to get started!</div>`;
    footer.style.display = 'none';
    return;
  }

  const total = cart.reduce((s, c) => s + c.monthly, 0);
  body.innerHTML = cart.map(c => `
    <div class="cart-item">
      <button class="cart-item-remove" onclick="removeFromCart(${c.id})">✕</button>
      <div class="cart-item-header">
        <div class="cart-item-name">${c.planIcon} ${c.planName}</div>
        <div class="cart-item-price">₹${c.monthly.toLocaleString('en-IN')}/mo</div>
      </div>
      <div class="cart-item-detail">
        <span>👤 ${c.holder}</span>
        <span>👨‍👩‍👧 ${c.family} member(s)</span>
        <span>🏥 ₹${c.coverage}</span>
        ${c.addons.map(a => `<span>${a.icon} ${a.name}</span>`).join('')}
      </div>
    </div>`).join('');

  document.getElementById('cartTotalAmt').textContent = '₹' + total.toLocaleString('en-IN');
  footer.style.display = 'block';
}

// ─── CART TOGGLE ─────────────────────────────────
function toggleCart() {
  document.getElementById('cartOverlay').classList.toggle('open');
}
function closeCartOutside(e) {
  if (e.target === document.getElementById('cartOverlay')) toggleCart();
}
function checkout() {
  showToast('🎉 Redirecting to payment...');
  setTimeout(() => toggleCart(), 1500);
}

// ─── TOAST ───────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── RADIO PILL VISUAL ───────────────────────────
document.addEventListener('change', e => {
  if (e.target.type !== 'radio') return;
  const grp = e.target.closest('.radio-group');
  if (!grp) return;
  grp.querySelectorAll('.radio-pill').forEach(p => p.classList.remove('selected'));
  e.target.closest('.radio-pill').classList.add('selected');
});
