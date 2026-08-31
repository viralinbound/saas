/* ==========================================================================
   SuperShowroom Engine (2026 Edition)
   Dynamic Plan & Template Selection, Channel Routing & Real Storefront Demo Engine
   Real-Time Dynamic Calendar Engine & Domain Search Engine
   ========================================================================== */

// Real Current Date Initialization
const REAL_TODAY = new Date();
let calendarYear = REAL_TODAY.getFullYear();
let calendarMonth = REAL_TODAY.getMonth();
let calendarSelectedDay = REAL_TODAY.getDate();

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatFullDate(dateObj) {
  const weekday = DAYS_OF_WEEK[dateObj.getDay()];
  const monthName = MONTH_NAMES[dateObj.getMonth()].substring(0, 3);
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  return `${weekday}, ${monthName} ${day}, ${year}`;
}

let selectedPlanName = 'Pro Showroom (₹25,000/yr)';
let selectedTemplateName = '';
let selectedConsultChannel = 'whatsapp'; // 'whatsapp' | 'email'
let selectedModalDate = formatFullDate(REAL_TODAY);
let selectedModalTime = '10:00am';

let selectedMeetingDate = formatFullDate(REAL_TODAY);
let selectedMeetingTime = '10:00am';

/* ==========================================================================
   AUTHENTIC 6-STORE DEMO DATABASE WITH REAL PRODUCTS, REVIEWS & HERO DATA
   ========================================================================== */
const STORES_DATABASE = {
  fashion: {
    key: 'fashion',
    name: '1. Luxe Apparel & Fashion',
    logo: 'LUXE APPAREL',
    announcement: '✨ SPECIAL LAUNCH OFFER: GET FLAT 15% OFF WITH CODE: LAUNCH15 • FREE SHIPPING OVER ₹999',
    heroBadge: 'FESTIVE DROP 2026',
    heroTitle: 'Designer Ethnic & Modern Fashion',
    heroSub: 'Handcrafted premium silks, linen shirts, and royal anarkalis tailored for pure elegance.',
    heroImg: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&auto=format&fit=crop',
    categories: [
      { id: 'all', name: 'All Collection' },
      { id: 'ethnic', name: 'Ethnic Silks' },
      { id: 'casual', name: 'Casual Linens' },
      { id: 'bestsellers', name: 'Bestsellers' }
    ],
    products: [
      { id: 101, name: 'Embroidered Silk Kurta Set with Dupatta', price: '₹3,499', mrp: '₹4,999', discount: '30% OFF', rating: '4.9', reviews: 142, img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop', category: 'ethnic', variants: ['S', 'M', 'L', 'XL'] },
      { id: 102, name: 'Pure Linen Relaxed Fit Cuban Shirt', price: '₹1,899', mrp: '₹2,499', discount: '24% OFF', rating: '4.8', reviews: 89, img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop', category: 'casual', variants: ['M', 'L', 'XL'] },
      { id: 103, name: 'Royal Emerald Georgette Anarkali Gown', price: '₹4,299', mrp: '₹5,999', discount: '28% OFF', rating: '5.0', reviews: 67, img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&auto=format&fit=crop', category: 'ethnic', variants: ['S', 'M', 'L'] },
      { id: 104, name: 'Tailored Slim Fit Stretch Chinos (Khaki)', price: '₹1,599', mrp: '₹2,199', discount: '27% OFF', rating: '4.7', reviews: 110, img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&auto=format&fit=crop', category: 'casual', variants: ['30', '32', '34', '36'] },
      { id: 105, name: 'Handblock Printed Chanderi Saree', price: '₹2,799', mrp: '₹3,899', discount: '28% OFF', rating: '4.9', reviews: 95, img: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop', category: 'ethnic', variants: ['Free Size'] },
      { id: 106, name: 'Merino Wool Structured Knit Blazer', price: '₹5,499', mrp: '₹7,999', discount: '31% OFF', rating: '4.9', reviews: 54, img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop', category: 'casual', variants: ['38', '40', '42'] }
    ],
    reviews: [
      { name: 'Ananya Deshmukh', rating: '★★★★★', comment: 'The fabric quality of the Silk Kurta set is breathtaking! Delivered in 2 days.', date: 'Verified Buyer • Mumbai' },
      { name: 'Rahul Varma', rating: '★★★★★', comment: 'Linen shirt fits perfectly true to size. Great checkout experience.', date: 'Verified Buyer • Bengaluru' }
    ]
  },

  bakery: {
    key: 'bakery',
    name: '2. Artisan Bakery & Café',
    logo: 'CRUST & CRUMB BAKES',
    announcement: '🥐 FRESH BATCH OUT OF OVEN! ORDER BEFORE 4 PM FOR SAME DAY DELIVERY',
    heroBadge: 'DAILY BAKED FRESH',
    heroTitle: 'Artisan Sourdough & Gourmet Cakes',
    heroSub: '100% Belgian chocolate, french butter pastries & sourdough made with organic unbleached flour.',
    heroImg: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop',
    categories: [
      { id: 'all', name: 'All Bakes' },
      { id: 'cakes', name: 'Gourmet Cakes' },
      { id: 'pastries', name: 'Pastries & Breads' },
      { id: 'bestsellers', name: 'Bestsellers' }
    ],
    products: [
      { id: 201, name: 'Belgian Dark Truffle Cake (500g)', price: '₹650', mrp: '₹850', discount: '24% OFF', rating: '5.0', reviews: 210, img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop', category: 'cakes', variants: ['500g', '1kg', 'Eggless'] },
      { id: 202, name: 'French Butter Croissants (Box of 4)', price: '₹380', mrp: '₹450', discount: '15% OFF', rating: '4.9', reviews: 165, img: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop', category: 'pastries', variants: ['Box of 4', 'Box of 8'] },
      { id: 203, name: 'Rustic Wild Sourdough Boule (750g)', price: '₹220', mrp: '₹280', discount: '21% OFF', rating: '4.8', reviews: 92, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop', category: 'pastries', variants: ['Sliced', 'Whole Boule'] },
      { id: 204, name: 'Parisian Macarons Assortment (Box of 6)', price: '₹490', mrp: '₹600', discount: '18% OFF', rating: '4.9', reviews: 140, img: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=500&auto=format&fit=crop', category: 'cakes', variants: ['Box of 6', 'Box of 12'] },
      { id: 205, name: 'New York Baked Blueberry Cheesecake', price: '₹750', mrp: '₹950', discount: '21% OFF', rating: '5.0', reviews: 88, img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop', category: 'cakes', variants: ['500g', '1kg'] },
      { id: 206, name: 'Gourmet Cinnamon Rolls with Cream Glaze', price: '₹290', mrp: '₹360', discount: '19% OFF', rating: '4.8', reviews: 75, img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop', category: 'pastries', variants: ['Pack of 2', 'Pack of 4'] }
    ],
    reviews: [
      { name: 'Meera Kulkarni', rating: '★★★★★', comment: 'The truffle cake was so decadent and moist! Arrived right on time for birthday.', date: 'Verified Buyer • Pune' },
      { name: 'Sameer Sen', rating: '★★★★★', comment: 'True sourdough crumb and crisp crust. Best bakery in the city!', date: 'Verified Buyer • Hyderabad' }
    ]
  },

  skincare: {
    key: 'skincare',
    name: '3. Glow Organic Skincare',
    logo: 'BOTANICA PURE',
    announcement: '🌿 100% DERMATOLOGIST-FORMULATED • DERMA-TESTED & TOXIN-FREE',
    heroBadge: 'CLEAN BEAUTY FORMULATION',
    heroTitle: 'Botanical Clinical Skin Nutrition',
    heroSub: 'Potent vitamin C serums, ceramide barrier repair creams & gentle mineral sunscreens.',
    heroImg: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200&auto=format&fit=crop',
    categories: [
      { id: 'all', name: 'All Products' },
      { id: 'serums', name: 'Serums & Boosters' },
      { id: 'creams', name: 'Moisturizers & SPF' },
      { id: 'bestsellers', name: 'Bestsellers' }
    ],
    products: [
      { id: 301, name: '20% Vitamin C + Ferulic Glow Serum (30ml)', price: '₹799', mrp: '₹1,199', discount: '33% OFF', rating: '4.9', reviews: 310, img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop', category: 'serums', variants: ['30ml', '50ml'] },
      { id: 302, name: 'Hydrating 5-Ceramide Barrier Cream (50g)', price: '₹649', mrp: '₹899', discount: '28% OFF', rating: '4.8', reviews: 180, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop', category: 'creams', variants: ['50g', '100g'] },
      { id: 303, name: 'Gentle Rose & Aloe Deep Cleansing Face Wash', price: '₹450', mrp: '₹599', discount: '25% OFF', rating: '4.8', reviews: 145, img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop', category: 'creams', variants: ['150ml'] },
      { id: 304, name: 'Mineral Ultra-Light Sunscreen SPF 50 PA++++', price: '₹599', mrp: '₹799', discount: '25% OFF', rating: '5.0', reviews: 260, img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=500&auto=format&fit=crop', category: 'creams', variants: ['50ml', '100ml'] }
    ],
    reviews: [
      { name: 'Dr. Tanya Roy', rating: '★★★★★', comment: 'Non-comedogenic and zero white cast sunscreen. Brilliant formulation.', date: 'Verified Buyer • New Delhi' }
    ]
  },

  kirana: {
    key: 'kirana',
    name: '4. Fresh Mart & Kirana',
    logo: 'GREEN BASKET',
    announcement: '🥦 DIRECT FARM TO TABLE • 3-HOUR INSTANT DELIVERY AVAILABLE',
    heroBadge: 'FARM FRESH PRODUCE',
    heroTitle: 'Organic Daily Staples & Fresh Harvest',
    heroSub: 'Cold-pressed pure oils, organic royal kashmiri apples, and direct farm pulses.',
    heroImg: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop',
    categories: [
      { id: 'all', name: 'All Staples' },
      { id: 'fruits', name: 'Fresh Fruits' },
      { id: 'oils', name: 'Oils & Grains' },
      { id: 'bestsellers', name: 'Bestsellers' }
    ],
    products: [
      { id: 401, name: 'Organic Royal Kashmiri Apples (1kg)', price: '₹180', mrp: '₹240', discount: '25% OFF', rating: '4.9', reviews: 420, img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop', category: 'fruits', variants: ['1kg', '2kg', '5kg Crate'] },
      { id: 402, name: 'Cold-Pressed Extra Virgin Olive Oil (1L)', price: '₹890', mrp: '₹1,200', discount: '26% OFF', rating: '4.9', reviews: 190, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop', category: 'oils', variants: ['500ml', '1L', '5L Tin'] },
      { id: 403, name: 'California Whole Jumbo Almonds (500g)', price: '₹480', mrp: '₹650', discount: '26% OFF', rating: '4.8', reviews: 155, img: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=500&auto=format&fit=crop', category: 'oils', variants: ['250g', '500g', '1kg'] },
      { id: 404, name: 'Farm Fresh Organic Free-Range Eggs (12 pcs)', price: '₹130', mrp: '₹160', discount: '19% OFF', rating: '4.9', reviews: 310, img: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop', category: 'fruits', variants: ['Pack of 6', 'Pack of 12'] }
    ],
    reviews: [
      { name: 'Kavita Nair', rating: '★★★★★', comment: 'Super fresh apples and quick delivery! Highly recommend Green Basket.', date: 'Verified Buyer • Chennai' }
    ]
  },

  tech: {
    key: 'tech',
    name: '5. Cyber Tech & Gadgets',
    logo: 'VOLTRIX CYBER',
    announcement: '⚡ OFFICIAL BRAND WARRANTY • NO COST EMI & INSTANT CASHBACK',
    heroBadge: 'NEXT GEN SMART GEAR',
    heroTitle: 'Studio Audio & Cyber Gear',
    heroSub: 'High-performance ANC headphones, mechanical gaming boards, and fast GaN chargers.',
    heroImg: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop',
    categories: [
      { id: 'all', name: 'All Gadgets' },
      { id: 'audio', name: 'Audio' },
      { id: 'wearables', name: 'Smart Watches' },
      { id: 'bestsellers', name: 'Bestsellers' }
    ],
    products: [
      { id: 501, name: 'Pro Wireless ANC Studio Headphones (40h Battery)', price: '₹4,999', mrp: '₹7,999', discount: '38% OFF', rating: '4.9', reviews: 290, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop', category: 'audio', variants: ['Matte Black', 'Space Gray'] },
      { id: 502, name: 'Titanium Smart Watch Series 5 (AMOLED & ECG)', price: '₹3,499', mrp: '₹5,999', discount: '42% OFF', rating: '4.8', reviews: 195, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop', category: 'wearables', variants: ['Midnight Black', 'Ocean Blue'] },
      { id: 503, name: 'Mechanical RGB Hot-Swappable Gaming Keyboard', price: '₹2,899', mrp: '₹4,299', discount: '33% OFF', rating: '4.9', reviews: 140, img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop', category: 'audio', variants: ['Red Linear', 'Blue Clicky'] },
      { id: 504, name: '100W GaN 4-Port Fast Travel Charger', price: '₹1,299', mrp: '₹1,899', discount: '32% OFF', rating: '4.8', reviews: 180, img: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop', category: 'wearables', variants: ['100W', '65W'] }
    ],
    reviews: [
      { name: 'Vikram Seth', rating: '★★★★★', comment: 'Active Noise Cancellation is unbeatable at this price point. Clean bass.', date: 'Verified Buyer • Noida' }
    ]
  },

  jewels: {
    key: 'jewels',
    name: '6. Royal Gold & Jewellery',
    logo: 'AURA FINE JEWELS',
    announcement: '💎 BIS HALLMARKED 100% CERTIFIED FINE GOLD & DIAMONDS • INSURED TRANSIT',
    heroBadge: 'ROYAL HERITAGE COLLECTION',
    heroTitle: 'BIS Hallmarked Fine Gold & Diamonds',
    heroSub: 'Handcrafted solitaires, heritage kundan chokers & 925 sterling silver luxury.',
    heroImg: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop',
    categories: [
      { id: 'all', name: 'All Jewels' },
      { id: 'gold', name: 'Gold & Kundan' },
      { id: 'silver', name: 'Silver & Rose Gold' },
      { id: 'bestsellers', name: 'Bestsellers' }
    ],
    products: [
      { id: 601, name: '18K Yellow Gold Solitaire Diamond Ring (VVS1)', price: '₹24,999', mrp: '₹32,000', discount: '22% OFF', rating: '5.0', reviews: 78, img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&auto=format&fit=crop', category: 'gold', variants: ['Size 12', 'Size 14', 'Size 16'] },
      { id: 602, name: '22K Handcrafted Gold Kundan Choker Necklace', price: '₹48,500', mrp: '₹60,000', discount: '19% OFF', rating: '5.0', reviews: 42, img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop', category: 'gold', variants: ['Standard Fit'] },
      { id: 603, name: '925 Sterling Silver Emerald Drop Earrings', price: '₹3,200', mrp: '₹4,500', discount: '29% OFF', rating: '4.9', reviews: 110, img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&auto=format&fit=crop', category: 'silver', variants: ['Emerald Green', 'Sapphire Blue'] },
      { id: 604, name: '18K Rose Gold Minimalist Infinity Bracelet', price: '₹8,900', mrp: '₹11,500', discount: '23% OFF', rating: '4.9', reviews: 85, img: 'https://images.unsplash.com/photo-1611591475155-4286fa7c2e7f?w=500&auto=format&fit=crop', category: 'silver', variants: ['Adjustable'] }
    ],
    reviews: [
      { name: 'Pooja Singhania', rating: '★★★★★', comment: 'Came with proper hallmark certificate and tamper-proof insured packing.', date: 'Verified Buyer • Jaipur' }
    ]
  }
};

let currentStoreData = STORES_DATABASE.fashion;
let currentFilteredProducts = [];
let storeCart = [];
let appliedCouponDiscount = 0;

document.addEventListener('DOMContentLoaded', () => {
  initNavbarHighlight();
  initMobileMenu();
  initRoiCalculator();
  initFaqAccordion();
  initDynamicSchedulerCalendar();
  initModalDates();
  initAutoLaunchDemoFromUrl();
  initDomainSearchDefaults();

  const homeInput = document.getElementById('homeDomainInput');
  if (homeInput) {
    homeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performHomeDomainSearch();
      }
    });
  }
});

/* Auto-launch live demo if URL contains #demo=theme or ?demo=theme */
function initAutoLaunchDemoFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  let demoKey = urlParams.get('demo');

  if (!demoKey && hash.startsWith('#demo=')) {
    demoKey = hash.replace('#demo=', '');
  }

  if (demoKey && STORES_DATABASE[demoKey]) {
    launchLiveDemo(demoKey);
  }
}

/* Mobile Menu Toggle, Auto-Close, & Window Resize Sync */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
        menuBtn.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });

    const links = navLinks.querySelectorAll('a');
    links.forEach(l => {
      l.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 940) {
        menuBtn.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });
  }
}

/* ==========================================================================
   DYNAMIC MONTHLY CALENDAR SCHEDULER ENGINE (REAL-TIME TODAY & FUTURE DATES)
   ========================================================================== */

function initDynamicSchedulerCalendar() {
  renderSchedulerCalendar();
  updateMeetingDisplay();
}

function renderSchedulerCalendar() {
  const label = document.getElementById('schedulerMonthYearLabel');
  const grid = document.getElementById('schedulerDaysGrid');
  if (!label || !grid) return;

  label.textContent = `${MONTH_NAMES[calendarMonth]} ${calendarYear}`;
  grid.innerHTML = '';

  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
  const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  const todayZero = new Date(REAL_TODAY.getFullYear(), REAL_TODAY.getMonth(), REAL_TODAY.getDate());

  // Empty padding cells
  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('span');
    emptyCell.style.color = '#CBD5E1';
    grid.appendChild(emptyCell);
  }

  // Actual day cells
  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(calendarYear, calendarMonth, day);
    const isPast = cellDate < todayZero;
    const isToday = (cellDate.getTime() === todayZero.getTime());
    const isSelected = (day === calendarSelectedDay && calendarMonth === REAL_TODAY.getMonth() && calendarYear === REAL_TODAY.getFullYear());

    const dayBtn = document.createElement('button');
    dayBtn.textContent = day;
    dayBtn.style = 'border:none; width:32px; height:32px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:700; font-size:0.82rem; margin:auto; transition:all 0.2s ease;';

    if (isPast) {
      dayBtn.style.background = 'transparent';
      dayBtn.style.color = '#CBD5E1';
      dayBtn.style.cursor = 'not-allowed';
      dayBtn.disabled = true;
    } else if (isSelected) {
      dayBtn.style.background = '#0052FF';
      dayBtn.style.color = '#FFFFFF';
      dayBtn.style.boxShadow = '0 4px 12px rgba(0,82,255,0.3)';
      dayBtn.style.cursor = 'pointer';
      dayBtn.onclick = () => handleSchedulerDayClick(day, dayBtn);
    } else if (isToday) {
      dayBtn.style.background = '#EFF6FF';
      dayBtn.style.color = '#0052FF';
      dayBtn.style.border = '2px solid #0052FF';
      dayBtn.style.cursor = 'pointer';
      dayBtn.onclick = () => handleSchedulerDayClick(day, dayBtn);
    } else {
      dayBtn.style.background = '#EFF6FF';
      dayBtn.style.color = '#0052FF';
      dayBtn.style.cursor = 'pointer';
      dayBtn.onclick = () => handleSchedulerDayClick(day, dayBtn);
    }

    grid.appendChild(dayBtn);
  }
}

function navigateSchedulerMonth(delta) {
  calendarMonth += delta;
  if (calendarMonth > 11) {
    calendarMonth = 0;
    calendarYear += 1;
  } else if (calendarMonth < 0) {
    calendarMonth = 11;
    calendarYear -= 1;
  }
  calendarSelectedDay = 1;
  renderSchedulerCalendar();
  
  const dateObj = new Date(calendarYear, calendarMonth, 1);
  selectedMeetingDate = formatFullDate(dateObj);
  updateMeetingDisplay();
}

function handleSchedulerDayClick(day, btnEl) {
  calendarSelectedDay = day;
  const allBtns = document.querySelectorAll('#schedulerDaysGrid button');
  allBtns.forEach(b => {
    if (!b.disabled) {
      b.style.background = '#EFF6FF';
      b.style.color = '#0052FF';
      b.style.boxShadow = 'none';
      b.style.border = 'none';
    }
  });

  btnEl.style.background = '#0052FF';
  btnEl.style.color = '#FFFFFF';
  btnEl.style.boxShadow = '0 4px 12px rgba(0,82,255,0.3)';

  const dateObj = new Date(calendarYear, calendarMonth, day);
  selectedMeetingDate = formatFullDate(dateObj);
  updateMeetingDisplay();
}

function selectMeetingTimeSlot(btnEl, timeStr) {
  const allBtns = document.querySelectorAll('#schedulerTimeSlotsGrid .time-slot-btn');
  allBtns.forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  selectedMeetingTime = timeStr;
  updateMeetingDisplay();
}

function updateMeetingDisplay() {
  const display = document.getElementById('selectedSlotDisplay');
  if (display) {
    display.textContent = `${selectedMeetingDate} at ${selectedMeetingTime}`;
  }
}

/* ==========================================================================
   MODAL DATE PICKER ENGINE (STARTING FROM REAL TODAY + FUTURE SLOTS)
   ========================================================================== */

function initModalDates() {
  const row = document.getElementById('modalQuickDatesRow');
  const dateInput = document.getElementById('modalNativeDatePicker');

  const secRow = document.getElementById('sectionQuickDatesRow');
  const secDateInput = document.getElementById('sectionNativeDatePicker');

  const yyyy = REAL_TODAY.getFullYear();
  const mm = String(REAL_TODAY.getMonth() + 1).padStart(2, '0');
  const dd = String(REAL_TODAY.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (dateInput) {
    dateInput.value = todayStr;
    dateInput.min = todayStr;
  }
  if (secDateInput) {
    secDateInput.value = todayStr;
    secDateInput.min = todayStr;
  }

  const renderChips = (container, isSection = false) => {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(REAL_TODAY);
      d.setDate(REAL_TODAY.getDate() + i);

      const dayNum = d.getDate();
      const monthName = MONTH_NAMES[d.getMonth()].substring(0, 3);
      const fullStr = formatFullDate(d);

      let labelText = '';
      if (i === 0) {
        labelText = `Today, ${dayNum} ${monthName}`;
      } else if (i === 1) {
        labelText = `Tomorrow, ${dayNum} ${monthName}`;
      } else {
        const dayName = DAYS_OF_WEEK[d.getDay()].substring(0, 3);
        labelText = `${dayName}, ${dayNum} ${monthName}`;
      }

      const chip = document.createElement('div');
      chip.className = `modal-date-chip ${i === 0 ? 'active' : ''}`;
      chip.textContent = labelText;
      if (isSection) {
        chip.onclick = () => selectSectionDate(chip, fullStr);
      } else {
        chip.onclick = () => selectModalDate(chip, fullStr);
      }
      container.appendChild(chip);
    }
  };

  renderChips(row, false);
  renderChips(secRow, true);
  updateSectionSlotDisplay();
}

function selectSectionDate(element, dateStr) {
  const allDates = document.querySelectorAll('#sectionQuickDatesRow .modal-date-chip');
  allDates.forEach(d => d.classList.remove('active'));
  element.classList.add('active');
  selectedModalDate = dateStr;
  selectedMeetingDate = dateStr;
  updateSectionSlotDisplay();
}

function selectSectionTime(element, timeStr) {
  const allTimes = document.querySelectorAll('#sectionTimesGrid .modal-time-chip');
  allTimes.forEach(t => t.classList.remove('active'));
  element.classList.add('active');
  selectedModalTime = timeStr;
  selectedMeetingTime = timeStr;
  updateSectionSlotDisplay();
}

function handleSectionNativeDateChange(inputEl) {
  if (!inputEl || !inputEl.value) return;
  const parts = inputEl.value.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);

    const dateObj = new Date(y, m, d);
    selectedModalDate = formatFullDate(dateObj);
    selectedMeetingDate = selectedModalDate;

    const allChips = document.querySelectorAll('#sectionQuickDatesRow .modal-date-chip');
    allChips.forEach(c => c.classList.remove('active'));
    updateSectionSlotDisplay();
  }
}

function updateSectionSlotDisplay() {
  const disp = document.getElementById('sectionSelectedSlotDisplay');
  if (disp) {
    disp.textContent = `Selected: ${selectedMeetingDate} at ${selectedMeetingTime}`;
  }
}

function handleModalNativeDateChange(inputEl) {
  if (!inputEl || !inputEl.value) return;
  const parts = inputEl.value.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);

    const dateObj = new Date(y, m, d);
    selectedModalDate = formatFullDate(dateObj);

    // Deactivate quick chips
    const allChips = document.querySelectorAll('.modal-date-chip');
    allChips.forEach(c => c.classList.remove('active'));
  }
}

/* Dynamic Plan Selection Engine */
function selectPlan(planName, element = null) {
  selectedPlanName = planName;

  const allCards = document.querySelectorAll('.pricing-card-modern');
  allCards.forEach(c => c.classList.remove('selected-plan-highlight'));

  if (element) {
    const cardContainer = element.closest('.pricing-card-modern');
    if (cardContainer) cardContainer.classList.add('selected-plan-highlight');
  }

  const matchingCards = document.querySelectorAll(`[data-plan="${planName}"]`);
  matchingCards.forEach(card => card.classList.add('selected-plan-highlight'));

  openConsultationModal(planName, '', selectedTemplateName);
}

/* Template Selection Engine */
function selectTemplate(templateName) {
  selectedTemplateName = templateName;
  openConsultationModal(selectedPlanName || 'Pro Showroom (₹25,000/yr)', '', templateName);
}

/* Channel Switcher: Email vs WhatsApp */
function setConsultChannel(channel) {
  selectedConsultChannel = channel;
  const emailCard = document.getElementById('channelCardEmail');
  const waCard = document.getElementById('channelCardWhatsapp');
  const submitBtn = document.getElementById('modalSubmitBtn');

  if (emailCard && waCard) {
    emailCard.classList.remove('active', 'whatsapp-active');
    waCard.classList.remove('active', 'whatsapp-active');

    if (channel === 'email') {
      emailCard.classList.add('active');
      if (submitBtn) {
        submitBtn.className = 'btn btn-primary btn-full btn-lg';
        submitBtn.innerHTML = '📧 Send Email Meeting Request →';
      }
    } else {
      waCard.classList.add('active', 'whatsapp-active');
      if (submitBtn) {
        submitBtn.className = 'btn btn-whatsapp btn-full btn-lg';
        submitBtn.innerHTML = '💬 Schedule WhatsApp Call & Details →';
      }
    }
  }
}

/* Modal Date & Time Selector */
function selectModalDate(element, dateStr) {
  const allDates = document.querySelectorAll('.modal-date-chip');
  allDates.forEach(d => d.classList.remove('active'));
  element.classList.add('active');
  selectedModalDate = dateStr;
}

function selectModalTime(element, timeStr) {
  const allTimes = document.querySelectorAll('.modal-time-chip');
  allTimes.forEach(t => t.classList.remove('active'));
  element.classList.add('active');
  selectedModalTime = timeStr;
}

/* Open Consultation Modal with Context Badge */
function openConsultationModal(planName = '', domainName = '', templateName = '', channel = '') {
  const modal = document.getElementById('consultationModal');
  const badgeEl = document.getElementById('modalContextBadge');

  if (planName) selectedPlanName = planName;
  if (templateName) selectedTemplateName = templateName;
  if (channel) selectedConsultChannel = channel;

  if (badgeEl) {
    let badgeText = `Plan: ${selectedPlanName}`;
    if (selectedTemplateName) {
      badgeText += ` • Template: ${selectedTemplateName}`;
    }
    if (domainName) {
      badgeText += ` • Domain: ${domainName}`;
    }
    badgeEl.textContent = badgeText;
  }

  setConsultChannel(selectedConsultChannel);

  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeConsultationModal() {
  const modal = document.getElementById('consultationModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

/* SMART FORM SUBMIT: ROUTES TO EMAIL OR WHATSAPP AUTOMATICALLY */
function handleStoreCreateSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('modalFullName')?.value || 'Valued Client';
  const email = document.getElementById('modalEmail')?.value || 'client@example.com';
  const phone = document.getElementById('modalPhone')?.value || 'Not provided';
  const brand = document.getElementById('modalBrandName')?.value || 'My Store';
  const customMessage = document.getElementById('modalCustomMessage')?.value || 'Please guide me on store launch & custom setup.';

  const planInfo = selectedPlanName || 'Pro Showroom (₹25,000/yr)';
  const templateInfo = selectedTemplateName || 'Custom Brand Store';

  if (selectedConsultChannel === 'email') {
    const subject = encodeURIComponent(`Consultation Booking: ${planInfo} - ${name} (${brand})`);
    const body = encodeURIComponent(
      `Hello Kevin,\n\nI would like to schedule a 30-Minute Consultation for my SuperShowroom online store.\n\n` +
      `• Name: ${name}\n` +
      `• Email: ${email}\n` +
      `• WhatsApp/Phone: ${phone}\n` +
      `• Store / Brand: ${brand}\n` +
      `• Selected Plan: ${planInfo}\n` +
      `• Selected Template: ${templateInfo}\n` +
      `• Preferred Date: ${selectedModalDate}\n` +
      `• Preferred Time: ${selectedModalTime} (IST)\n\n` +
      `• Requirements / Custom Message:\n"${customMessage}"\n\n` +
      `Please send the Google Meet invitation link. Thank you!`
    );

    window.location.href = `mailto:kevin@viralinbound.com?subject=${subject}&body=${body}`;
  } else {
    const waText = 
      `*SuperShowroom Store Consultation Request*%0A%0A` +
      `*Name:* ${encodeURIComponent(name)}%0A` +
      `*Brand / Store:* ${encodeURIComponent(brand)}%0A` +
      `*Phone:* ${encodeURIComponent(phone)}%0A` +
      `*Email:* ${encodeURIComponent(email)}%0A` +
      `*Selected Plan:* ${encodeURIComponent(planInfo)}%0A` +
      `*Selected Template:* ${encodeURIComponent(templateInfo)}%0A` +
      `*Preferred Call Slot:* ${encodeURIComponent(selectedModalDate)} at ${encodeURIComponent(selectedModalTime)} (IST)%0A%0A` +
      `*My Requirements / Notes:*%0A${encodeURIComponent(customMessage)}`;

    window.open(`https://wa.me/918968430834?text=${waText}`, '_blank');
  }

  closeConsultationModal();
}

/* ==========================================================================
   REAL STOREFRONT DEMO ENGINE
   ========================================================================== */

function launchLiveDemo(themeKey = 'fashion') {
  currentStoreData = STORES_DATABASE[themeKey] || STORES_DATABASE.fashion;
  currentFilteredProducts = currentStoreData.products;

  // If on a page without the modal canvas (e.g. index.html or contact.html), redirect to templates.html#demo=...
  const modal = document.getElementById('fullStoreCanvasModal');
  if (!modal) {
    window.location.href = `templates.html#demo=${themeKey}`;
    return;
  }

  // 1. Update Header & Branding
  const logoEl = document.getElementById('storefrontLogo');
  const annEl = document.getElementById('storeAnnouncementBar');
  const footerBrand = document.getElementById('footerStoreBrand');
  const quickSwitcher = document.getElementById('themeQuickSwitcher');

  if (logoEl) logoEl.textContent = currentStoreData.logo;
  if (annEl) annEl.innerHTML = currentStoreData.announcement;
  if (footerBrand) footerBrand.textContent = currentStoreData.logo;
  if (quickSwitcher) quickSwitcher.value = themeKey;

  // 2. Update Hero Banner
  const heroBadge = document.getElementById('storeHeroBadge');
  const heroTitle = document.getElementById('storeHeroTitle');
  const heroSub = document.getElementById('storeHeroSub');
  const heroBanner = document.getElementById('storeHeroBanner');

  if (heroBadge) heroBadge.textContent = currentStoreData.heroBadge;
  if (heroTitle) heroTitle.textContent = currentStoreData.heroTitle;
  if (heroSub) heroSub.textContent = currentStoreData.heroSub;
  if (heroBanner) heroBanner.style.backgroundImage = `url('${currentStoreData.heroImg}')`;

  // 3. Render Category Pills
  const catContainer = document.getElementById('storeCategoryPills');
  if (catContainer) {
    catContainer.innerHTML = '';
    currentStoreData.categories.forEach((c, idx) => {
      const chip = document.createElement('div');
      chip.className = `real-cat-chip ${idx === 0 ? 'active' : ''}`;
      chip.textContent = c.name;
      chip.onclick = () => filterDemoCategory(c.id, chip);
      catContainer.appendChild(chip);
    });
  }

  // 4. Render Product Grid
  renderStoreProducts(currentStoreData.products);

  // 5. Render Reviews
  const reviewsGrid = document.getElementById('storeReviewsGrid');
  if (reviewsGrid) {
    reviewsGrid.innerHTML = '';
    currentStoreData.reviews.forEach(r => {
      const card = document.createElement('div');
      card.style = 'background:#FFF; border:1px solid #E2E8F0; padding:12px; border-radius:8px;';
      card.innerHTML = `
        <div style="color:#F59E0B; font-size:0.82rem; margin-bottom:4px;">${r.rating}</div>
        <p style="font-size:0.84rem; color:#1E293B; margin-bottom:6px; font-style:italic;">"${r.comment}"</p>
        <div style="font-weight:800; font-size:0.78rem; color:#0F172A;">${r.name}</div>
        <div style="font-size:0.7rem; color:#64748B;">${r.date}</div>
      `;
      reviewsGrid.appendChild(card);
    });
  }

  // Open Canvas Modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeFullStoreCanvas() {
  const modal = document.getElementById('fullStoreCanvasModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
  closeCartDrawer();
}

function setDemoViewMode(mode) {
  const container = document.getElementById('demoCanvasContainer');
  const btnDesk = document.getElementById('viewBtnDesktop');
  const btnMob = document.getElementById('viewBtnMobile');

  if (btnDesk && btnMob) {
    btnDesk.classList.remove('active');
    btnMob.classList.remove('active');
  }

  if (mode === 'mobile') {
    if (btnMob) btnMob.classList.add('active');
    if (container) {
      container.classList.add('mobile-device-view');
      container.style.maxWidth = '420px';
      container.style.borderRadius = '36px';
      container.style.border = '10px solid #1E293B';
    }
  } else {
    if (btnDesk) btnDesk.classList.add('active');
    if (container) {
      container.classList.remove('mobile-device-view');
      container.style.maxWidth = '1200px';
      container.style.borderRadius = 'var(--radius-lg)';
      container.style.border = 'none';
    }
  }
}

function filterDemoCategory(catId, chipEl) {
  if (chipEl) {
    const allChips = document.querySelectorAll('.real-cat-chip');
    allChips.forEach(c => c.classList.remove('active'));
    chipEl.classList.add('active');
  }

  if (catId === 'all') {
    currentFilteredProducts = currentStoreData.products;
  } else if (catId === 'bestsellers') {
    currentFilteredProducts = currentStoreData.products.slice(0, 3);
  } else if (catId === 'new') {
    currentFilteredProducts = currentStoreData.products.slice(2, 5);
  } else {
    currentFilteredProducts = currentStoreData.products.filter(p => p.category === catId);
  }

  renderStoreProducts(currentFilteredProducts);
}

function handleDemoLiveSearch() {
  const query = document.getElementById('demoLiveSearchInput')?.value.toLowerCase() || '';
  const filtered = currentStoreData.products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
  renderStoreProducts(filtered);
}

function renderStoreProducts(products) {
  const grid = document.getElementById('storeProductsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (products.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding:40px; color:#64748B;">No products found in this category.</div>';
    return;
  }

  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'storefront-product-card';

    let variantHTML = '';
    if (p.variants && p.variants.length > 0) {
      variantHTML = `
        <div class="variant-pill-row">
          ${p.variants.map((v, i) => `<span class="variant-pill ${i===0?'active':''}">${v}</span>`).join('')}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="storefront-img-box">
        <img src="${p.img}" alt="${p.name}" loading="lazy" />
        <span class="storefront-discount-badge">${p.discount}</span>
      </div>
      <div style="padding:10px 12px; display:flex; flex-direction:column; flex:1; justify-content:space-between;">
        <div>
          <div class="storefront-rating-star">
            <span>★</span> ${p.rating} <span style="color:#94A3B8; font-size:0.7rem;">(${p.reviews})</span>
          </div>
          <div style="font-weight:800; font-size:0.86rem; color:#0F172A; line-height:1.25; margin-bottom:4px; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">
            ${p.name}
          </div>
          <div style="display:flex; align-items:baseline; gap:6px;">
            <span style="font-weight:900; font-size:1.05rem; color:#0052FF;">${p.price}</span>
            <span style="font-size:0.75rem; color:#94A3B8; text-decoration:line-through;">${p.mrp}</span>
          </div>
          ${variantHTML}
        </div>
        <div style="display:flex; gap:6px; margin-top:8px;">
          <button class="btn btn-sm btn-outline btn-full" style="padding:5px 6px; font-size:0.74rem;" onclick="addToStoreCart(${p.id})">🛒 Add</button>
          <button class="btn btn-sm btn-primary btn-full" style="padding:5px 6px; font-size:0.74rem;" onclick="triggerDirectBuy(${p.id})">⚡ Buy</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function addToStoreCart(productId) {
  const item = currentStoreData.products.find(p => p.id === productId);
  if (!item) return;

  const existing = storeCart.find(c => c.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    storeCart.push({ ...item, qty: 1 });
  }

  updateStoreCartUI();
  showToast();
}

function triggerDirectBuy(productId) {
  addToStoreCart(productId);
  openCartDrawer();
}

function changeCartItemQty(index, delta) {
  if (storeCart[index]) {
    storeCart[index].qty += delta;
    if (storeCart[index].qty <= 0) {
      storeCart.splice(index, 1);
    }
  }
  updateStoreCartUI();
}

function applyCartCoupon() {
  const input = document.getElementById('cartCouponInput');
  const msg = document.getElementById('couponStatusMsg');
  if (!input || !msg) return;

  const val = input.value.trim().toUpperCase();
  if (val === 'SUPER20' || val === 'LAUNCH15') {
    appliedCouponDiscount = 0.20; // 20% discount
    msg.style.display = 'block';
    msg.style.color = '#10B981';
    msg.textContent = '✓ Coupon Applied: 20% Discount Activated!';
  } else {
    appliedCouponDiscount = 0;
    msg.style.display = 'block';
    msg.style.color = '#EF4444';
    msg.textContent = '✕ Invalid Coupon Code. Try SUPER20';
  }
  updateStoreCartUI();
}

function updateStoreCartUI() {
  const cartBadge = document.getElementById('storeCartCount');
  const drawerCount = document.getElementById('cartDrawerCount');
  const itemsContainer = document.getElementById('cartDrawerItems');
  const subtotalEl = document.getElementById('cartSubtotalVal');
  const discountEl = document.getElementById('cartDiscountVal');
  const totalPayableEl = document.getElementById('cartTotalPayable');
  const checkoutPayableDisplay = document.getElementById('checkoutPayableDisplay');

  let totalCount = 0;
  let subtotal = 0;

  storeCart.forEach(item => {
    totalCount += item.qty;
    const numPrice = parseInt(item.price.replace(/[^0-9]/g, ''), 10) || 0;
    subtotal += numPrice * item.qty;
  });

  if (cartBadge) cartBadge.textContent = totalCount;
  if (drawerCount) drawerCount.textContent = totalCount;

  const discountAmount = Math.round(subtotal * appliedCouponDiscount);
  const finalPayable = Math.max(0, subtotal - discountAmount);

  if (subtotalEl) subtotalEl.textContent = '₹' + subtotal.toLocaleString('en-IN');
  if (discountEl) discountEl.textContent = '-₹' + discountAmount.toLocaleString('en-IN');
  if (totalPayableEl) totalPayableEl.textContent = '₹' + finalPayable.toLocaleString('en-IN');
  if (checkoutPayableDisplay) checkoutPayableDisplay.textContent = '₹' + finalPayable.toLocaleString('en-IN');

  if (itemsContainer) {
    if (storeCart.length === 0) {
      itemsContainer.innerHTML = '<div style="text-align:center; color:#64748B; padding:30px 0;">Your cart is empty!</div>';
    } else {
      itemsContainer.innerHTML = '';
      storeCart.forEach((item, idx) => {
        const row = document.createElement('div');
        row.style = 'display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #E2E8F0; gap:8px;';
        row.innerHTML = `
          <img src="${item.img}" style="width:44px; height:44px; border-radius:6px; object-fit:cover;" />
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:0.82rem; color:#0F172A; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</div>
            <div style="color:#0052FF; font-weight:800; font-size:0.82rem;">${item.price}</div>
          </div>
          <div style="display:flex; align-items:center; gap:4px;">
            <button onclick="changeCartItemQty(${idx}, -1)" style="width:22px; height:22px; border:1px solid #CBD5E1; background:#FFF; border-radius:4px; cursor:pointer; font-weight:800;">-</button>
            <span style="font-weight:800; font-size:0.82rem;">${item.qty}</span>
            <button onclick="changeCartItemQty(${idx}, 1)" style="width:22px; height:22px; border:1px solid #CBD5E1; background:#FFF; border-radius:4px; cursor:pointer; font-weight:800;">+</button>
          </div>
        `;
        itemsContainer.appendChild(row);
      });
    }
  }
}

function openCartDrawer() {
  const drawer = document.getElementById('demoCartDrawer');
  if (drawer) drawer.style.display = 'flex';
}

function closeCartDrawer() {
  const drawer = document.getElementById('demoCartDrawer');
  if (drawer) drawer.style.display = 'none';
}

function openCheckoutModal() {
  if (storeCart.length === 0) {
    alert('Please add items to cart first!');
    return;
  }
  const modal = document.getElementById('checkoutSimModal');
  if (modal) modal.classList.add('active');
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutSimModal');
  if (modal) modal.classList.remove('active');
}

function handleDemoOrderSubmit(event) {
  event.preventDefault();
  closeCheckoutModal();
  closeCartDrawer();

  const randomId = '#ORD-' + Math.floor(10000 + Math.random() * 90000);
  const orderIdEl = document.getElementById('successOrderId');
  if (orderIdEl) orderIdEl.textContent = randomId;

  const successModal = document.getElementById('orderSuccessModal');
  if (successModal) successModal.classList.add('active');

  storeCart = [];
  appliedCouponDiscount = 0;
  updateStoreCartUI();
}

function closeOrderSuccessModal() {
  const modal = document.getElementById('orderSuccessModal');
  if (modal) modal.classList.remove('active');
}

function showToast() {
  const toast = document.getElementById('cartToast');
  if (toast) {
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
  }
}

/* ==========================================================================
   ROBUST DOMAIN SEARCH ENGINE (INDEX & DOMAIN-SEARCH PAGES)
   ========================================================================== */

function initDomainSearchDefaults() {
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get('q');
  const qInput = document.getElementById('domainQuery');
  
  if (qParam && qInput) {
    const cleanQuery = qParam.trim().toLowerCase().replace(/https?:\/\/|www\.|\.com|\.in|\.store|\.shop|\.online/g, '').replace(/[^a-z0-9]/g, '');
    qInput.value = cleanQuery;
    executeDomainQuery(cleanQuery, 'domainResultsGrid', 'searchedQueryDisplay', 'allDomainsResults');
  } else if (qInput && !qInput.value) {
    executeDomainQuery('mybrandstore', 'domainResultsGrid', 'searchedQueryDisplay', 'allDomainsResults');
  }
}

function handleHomeDomainRedirect(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('homeDomainInput');
  const rawQuery = input ? input.value.trim().toLowerCase().replace(/https?:\/\/|www\.|\.com|\.in|\.store|\.shop|\.online/g, '').replace(/[^a-z0-9]/g, '') : '';
  if (rawQuery) {
    window.location.href = `domain-search.html?q=${encodeURIComponent(rawQuery)}`;
  } else {
    window.location.href = `domain-search.html`;
  }
}

function handleDomainSearch(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('domainQuery');
  if (!input) return;
  const rawQuery = input.value.trim().toLowerCase().replace(/https?:\/\/|www\.|\.com|\.in|\.store|\.shop|\.online/g, '').replace(/[^a-z0-9]/g, '');

  if (!rawQuery) {
    alert('Please enter a store or brand name to search.');
    return;
  }

  executeDomainQuery(rawQuery, 'domainResultsGrid', 'searchedQueryDisplay', 'allDomainsResults');
}

function executeDomainQuery(query, gridId, titleDisplayId, containerId) {
  const grid = document.getElementById(gridId);
  const titleDisplay = document.getElementById(titleDisplayId);
  const container = document.getElementById(containerId);

  if (titleDisplay) {
    titleDisplay.textContent = query;
  }

  const extensions = [
    { ext: '.com', price: '₹899/yr', status: 'Available', badge: 'POPULAR' },
    { ext: '.in', price: '₹499/yr', status: 'Available', badge: 'TOP PICK' },
    { ext: '.co.in', price: '₹399/yr', status: 'Available', badge: 'INDIA' },
    { ext: '.store', price: '₹299/yr', status: 'Available', badge: 'ECOMMERCE' },
    { ext: '.shop', price: '₹199/yr', status: 'Available', badge: 'BEST VALUE' },
    { ext: '.online', price: '₹149/yr', status: 'Available', badge: 'DEAL' }
  ];

  if (grid) {
    grid.innerHTML = '';
    extensions.forEach(item => {
      const fullDomain = `${query}${item.ext}`;
      const card = document.createElement('div');
      card.className = 'domain-item-card';
      card.innerHTML = `
        <div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="domain-name-text">${fullDomain}</span>
            <span style="font-size:0.65rem; font-weight:800; background:#EFF6FF; color:#0052FF; padding:1px 6px; border-radius:4px;">${item.badge}</span>
          </div>
          <span class="domain-status-tag">✓ Included Free in Plan</span>
        </div>
        <div class="domain-price-action">
          <div class="domain-price-val">${item.price}</div>
          <button class="btn btn-sm btn-primary" onclick="claimDomain('${fullDomain}', '${item.price}')">Claim Domain →</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  if (container) {
    container.classList.add('active');
  }
}

function claimDomain(domainName, price) {
  openConsultationModal('Pro Showroom (₹25,000/yr)', domainName, selectedTemplateName);
}

/* FAQ Accordion Handler */
function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(q => {
    q.addEventListener('click', () => {
      q.parentElement.classList.toggle('active');
    });
  });
}

function initNavbarHighlight() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}

function initRoiCalculator() {
  const slider = document.getElementById('monthlySalesSlider');
  if (!slider) return;

  const salesDisplay = document.getElementById('salesDisplay');
  const resMonthlySales = document.getElementById('resMonthlySales');
  const resPlatformFee = document.getElementById('resPlatformFee');
  const resTotalYear = document.getElementById('resTotalYear');

  function updateRoi() {
    const val = parseInt(slider.value, 10);
    const feePerMonth = Math.round(val * 0.02);
    const totalFeeYear = feePerMonth * 12;
    const planCostPro = 25000;
    const totalYearCost = planCostPro + totalFeeYear;

    if (salesDisplay) salesDisplay.textContent = '₹' + val.toLocaleString('en-IN');
    if (resMonthlySales) resMonthlySales.textContent = '₹' + val.toLocaleString('en-IN');
    if (resPlatformFee) resPlatformFee.textContent = '₹' + feePerMonth.toLocaleString('en-IN') + ' / mo';
    if (resTotalYear) resTotalYear.textContent = '₹' + totalYearCost.toLocaleString('en-IN');
  }

  slider.addEventListener('input', updateRoi);
  updateRoi();
}
