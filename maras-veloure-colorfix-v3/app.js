
ADMIN_STORAGE_KEY = "maras_veloure_admin_only";

function getAdminProducts() {
  const saved = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function getAllProducts() {
  return [...PRODUCTS, ...getAdminProducts()];
}

function findProductById(productId) {
  return getAllProducts().find(product => product.id === productId);
}

function getProductColors(product) {
  if (!product || !Array.isArray(product.colors)) return [];

  return product.colors.map(color => {
    if (typeof color === 'string') {
      return color;
    }

    if (color && typeof color === 'object' && color.name) {
      return color.name;
    }

    return String(color || '').trim();
  }).filter(Boolean);
}

function getProductSizes(product) {
  if (!product || !Array.isArray(product.sizes)) return [];
  return product.sizes.filter(Boolean);
}

const productGrid = document.getElementById('productGrid');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');
const cartBtn = document.getElementById('cartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const clearCartBtn = document.getElementById('clearCartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const cartItemsEl = document.getElementById('cartItems');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartCountEl = document.getElementById('cartCount');
const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menuBtn');
const mainNav = document.getElementById('mainNav');
const musicToggle = document.getElementById('musicToggle');
const siteMusic = document.getElementById('siteMusic');
const imagePreviewModal = document.getElementById('imagePreviewModal');
const previewImage = document.getElementById('previewImage');
const previewTitle = document.getElementById('previewTitle');
const previewDetails = document.getElementById('previewDetails');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const cartMessageEl = document.getElementById('cartMessage');
const stripeCheckoutBtn = document.getElementById('stripeCheckoutBtn');

let cart = JSON.parse(localStorage.getItem('marasVeloureCart') || '[]');
let selectedOptions = {};

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function setCartMessage(message, kind = 'info') {
  if (!cartMessageEl) return;
  cartMessageEl.textContent = message;
  cartMessageEl.dataset.kind = kind;
}

function getCurrentPrice(product, size) {
  const fallbackPrice = Number(product.basePrice ?? product.price ?? 0);

  if (!product || !product.priceBySize || !size) {
    return fallbackPrice;
  }

  if (product.priceBySize[size] != null) {
    return Number(product.priceBySize[size]);
  }

  const normalizedSize = String(size).trim().toUpperCase();

  const matchedKey = Object.keys(product.priceBySize).find(key => {
    return String(key).trim().toUpperCase() === normalizedSize;
  });

  if (matchedKey) {
    return Number(product.priceBySize[matchedKey]);
  }

  return fallbackPrice;
}

function getCurrentImage(product, color) {
  if (!product) return '';

  if (product.colorImages && color && product.colorImages[color]) {
    return product.colorImages[color];
  }

  if (Array.isArray(product.colors)) {
    const colorObject = product.colors.find(item => {
      return item && typeof item === 'object' && item.name === color && item.image;
    });

    if (colorObject && colorObject.image) {
      return colorObject.image;
    }
  }

  return product.image || '';
}

function initCategoryFilter() {
  if (!categoryFilter) return;

  const categories = ['all', ...new Set(getAllProducts().map(product => product.category).filter(Boolean))];

  categoryFilter.innerHTML = categories
    .map(category => `<option value="${category}">${category === 'all' ? 'All categories' : category}</option>`)
    .join('');
}

function getFilteredProducts() {
  const search = (searchInput?.value || '').trim().toLowerCase();
  const category = categoryFilter?.value || 'all';

  return getAllProducts().filter(product => {
    const colors = getProductColors(product);
    const matchesCategory = category === 'all' || product.category === category;
    const haystack = `${product.name || ''} ${product.subtitle || ''} ${product.category || ''} ${product.description || ''} ${colors.join(' ')}`.toLowerCase();
    const matchesSearch = !search || haystack.includes(search);

    return matchesCategory && matchesSearch;
  });
}

function ensureSelections(product) {
  if (!product) return;

  const colors = getProductColors(product);
  const sizes = getProductSizes(product);

  if (!selectedOptions[product.id]) {
    selectedOptions[product.id] = {
      color: colors[0] || '',
      size: sizes[0] || '',
      quantity: 1
    };
    return;
  }

  if (!selectedOptions[product.id].color && colors[0]) {
    selectedOptions[product.id].color = colors[0];
  }

  if (!selectedOptions[product.id].size && sizes[0]) {
    selectedOptions[product.id].size = sizes[0];
  }

  if (!selectedOptions[product.id].quantity || selectedOptions[product.id].quantity < 1) {
    selectedOptions[product.id].quantity = 1;
  }
}

function renderProducts() {
  if (!productGrid) return;

  const filtered = getFilteredProducts();

  if (!filtered.length) {
    productGrid.innerHTML = `<div class="empty-state">No products matched that search. Try another word or category.</div>`;
    return;
  }

  productGrid.innerHTML = filtered.map(product => {
    ensureSelections(product);

    const selection = selectedOptions[product.id];
    const colors = getProductColors(product);
    const sizes = getProductSizes(product);
    const currentPrice = getCurrentPrice(product, selection.size);
    const currentImage = getCurrentImage(product, selection.color);

    const colorHtml = colors.map(color => `
      <button
        class="color-chip ${selection.color === color ? 'active' : ''}"
        data-product-id="${product.id}"
        data-type="color"
        data-value="${color}"
      >${color}</button>
    `).join('');

    const sizeHtml = sizes.map(size => `
      <button
        class="size-chip ${selection.size === size ? 'active' : ''}"
        data-product-id="${product.id}"
        data-type="size"
        data-value="${size}"
      >${size}</button>
    `).join('');

    const fallbackImage = product.image || '';
    const imageHtml = currentImage
      ? `<img src="${currentImage}" alt="${product.name}" onerror="if(this.dataset.fallback && this.src!==this.dataset.fallback){this.src=this.dataset.fallback;}else{this.outerHTML='<div class=\\'placeholder\\'>Add your photo here</div>';}" data-fallback="${fallbackImage}">`
      : `<div class="placeholder">Add your photo here</div>`;

    return `
      <article class="product-card">
        <button class="product-image image-button" data-preview-product="${product.id}" type="button">
          ${imageHtml}
          <span class="preview-hint">Tap to preview</span>
        </button>

        <div class="product-body">
          <div class="product-top">
            <div>
              <button class="product-text-link" data-preview-product="${product.id}" type="button">
                <p class="product-name">${product.name || ''}</p>
                ${product.subtitle ? `<p class="product-subtitle">${product.subtitle}</p>` : ''}
                <p class="product-desc">${product.description || ''}</p>
              </button>
            </div>

            <div class="product-price-wrap">
              <div class="product-price">${formatMoney(currentPrice)}</div>
              ${product.priceNote ? `<div class="product-price-note">${product.priceNote}</div>` : ''}
            </div>
          </div>

          <div>
            <strong>Colors</strong>
            <div class="chip-row">${colorHtml}</div>
          </div>

          <div>
            <strong>Size</strong>
            <div class="chip-row">${sizeHtml}</div>
          </div>

          <div>
            <strong>Quantity</strong>
            <div class="qty-picker" data-qty-picker="${product.id}">
              <button type="button" class="qty-btn" data-product-id="${product.id}" data-type="quantity-minus">−</button>
              <span class="qty-value">${selection.quantity || 1}</span>
              <button type="button" class="qty-btn" data-product-id="${product.id}" data-type="quantity-plus">+</button>
            </div>
          </div>

          <div class="product-actions single">
            <button class="link-btn primary" data-add-to-cart="${product.id}">Add ${selection.quantity || 1} to cart</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function openPreview(productId) {
  const product = findProductById(productId);
  if (!product || !previewImage || !imagePreviewModal) return;

  ensureSelections(product);

  const selection = selectedOptions[productId];
  const currentImage = getCurrentImage(product, selection.color);

  previewImage.src = currentImage || '';
  previewImage.alt = `${product.name} in ${selection.color || 'selected color'}`;
  previewTitle.textContent = product.name || '';
  previewDetails.textContent = `${selection.color || ''}${selection.color && selection.size ? ' • ' : ''}${selection.size || ''}${selection.size ? ' • ' : ''}${formatMoney(getCurrentPrice(product, selection.size))}`;

  imagePreviewModal.classList.remove('hidden');
  imagePreviewModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closePreview() {
  if (!imagePreviewModal) return;

  imagePreviewModal.classList.add('hidden');
  imagePreviewModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function addToCart(productId) {
  const product = findProductById(productId);
  if (!product) return;

  ensureSelections(product);

  const selection = selectedOptions[productId];
  const currentPrice = getCurrentPrice(product, selection.size);
  const currentImage = getCurrentImage(product, selection.color);
  const selectedQty = Math.max(1, Math.min(20, Number(selection.quantity || 1)));

  const existingItem = cart.find(item =>
    item.id === productId &&
    item.color === selection.color &&
    item.size === selection.size
  );

  if (existingItem) {
    existingItem.quantity += selectedQty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      subtitle: product.subtitle || '',
      price: currentPrice,
      priceNote: product.priceNote || '',
      color: selection.color,
      size: selection.size,
      image: currentImage,
      quantity: selectedQty
    });
  }

  persistCart();
  renderCart();
  setCartMessage('Added to cart.');
  openCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  persistCart();
  renderCart();
}

function updateCartQuantity(index, change) {
  const item = cart[index];
  if (!item) return;

  item.quantity = Math.max(1, Math.min(20, item.quantity + change));
  persistCart();
  renderCart();
}

function persistCart() {
  localStorage.setItem('marasVeloureCart', JSON.stringify(cart));
}

function renderCart() {
  if (!cartCountEl || !cartItemsEl || !cartSubtotalEl || !stripeCheckoutBtn) return;

  cartCountEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!cart.length) {
    cartItemsEl.innerHTML = `<div class="empty-state">Your cart is empty right now.</div>`;
    cartSubtotalEl.textContent = '$0.00';
    stripeCheckoutBtn.disabled = true;
    setCartMessage('Add one or more items to start checkout.');
    return;
  }

  stripeCheckoutBtn.disabled = false;

  cartItemsEl.innerHTML = cart.map((item, index) => {
    const thumb = item.image
      ? `<img src="${item.image}" alt="${item.name}" onerror="this.outerHTML='<div class=\\'placeholder\\'>Item</div>'">`
      : `<div class="placeholder">Item</div>`;

    return `
      <div class="cart-item">
        <div class="cart-thumb">${thumb}</div>
        <div>
          <p class="cart-title">${item.name}</p>
          ${item.subtitle ? `<p class="cart-meta">${item.subtitle}</p>` : ''}
          <p class="cart-meta">${item.color} • ${item.size}</p>
          <p class="cart-meta">${formatMoney(item.price)} each</p>
          <div class="cart-qty-row">
            <button class="cart-qty-btn" data-qty-change="-1" data-qty-index="${index}">−</button>
            <span class="cart-qty-value">Qty ${item.quantity}</span>
            <button class="cart-qty-btn" data-qty-change="1" data-qty-index="${index}">+</button>
          </div>
        </div>
        <button class="cart-remove" data-remove-index="${index}">Remove</button>
      </div>
    `;
  }).join('');

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartSubtotalEl.textContent = formatMoney(subtotal);
  setCartMessage('Ready for secure card checkout.');
}

function openCart() {
  if (!cartDrawer || !overlay) return;

  cartDrawer.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  overlay.classList.remove('hidden');
}

function closeCart() {
  if (!cartDrawer || !overlay) return;

  cartDrawer.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  overlay.classList.add('hidden');
}

async function checkoutWithStripe() {
  if (!cart.length) {
    setCartMessage('Your cart is empty.', 'error');
    return;
  }

  if (window.location.protocol === 'file:') {
    setCartMessage('Checkout only works from your live Netlify site, not from a file opened on your computer. Upload this folder to Netlify and test from that public link.', 'error');
    return;
  }

  stripeCheckoutBtn.disabled = true;
  stripeCheckoutBtn.textContent = 'Opening checkout...';
  setCartMessage('Creating your secure checkout...', 'info');

  try {
    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        origin: window.location.origin,
        items: cart.map(item => ({
          id: item.id,
          color: item.color,
          size: item.size,
          quantity: item.quantity
        }))
      })
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      throw new Error(data.error || 'Checkout could not be created. Make sure the site is deployed on Netlify and STRIPE_SECRET_KEY is set in Netlify environment variables.');
    }

    window.location.href = data.url;
  } catch (error) {
    stripeCheckoutBtn.disabled = false;
    stripeCheckoutBtn.textContent = 'Checkout with card';
    const message = (window.location.protocol === 'file:' || String(error.message || '').includes('Failed to fetch'))
      ? 'Checkout only works after deployment on Netlify with your STRIPE_SECRET_KEY added there.'
      : (error.message || 'Something went wrong starting checkout.');
    setCartMessage(message, 'error');
  }
}

function toggleMusic() {
  if (!siteMusic || !musicToggle) return;

  if (siteMusic.paused) {
    siteMusic.play().then(() => {
      musicToggle.textContent = '♫ Music On';
    }).catch(() => {
      alert('Add your audio file first at assets/music/your-song.mp3');
    });
  } else {
    siteMusic.pause();
    musicToggle.textContent = '♫ Music Off';
  }
}

if (productGrid) {
  productGrid.addEventListener('click', event => {
    const optionButton = event.target.closest('[data-product-id]');
    const addButton = event.target.closest('[data-add-to-cart]');
    const previewButton = event.target.closest('[data-preview-product]');

    if (previewButton) {
      openPreview(previewButton.dataset.previewProduct);
      return;
    }

    if (optionButton) {
      const { productId, type, value } = optionButton.dataset;
      const product = findProductById(productId);
      if (!product) return;

      ensureSelections(product);

      if (type === 'quantity-minus') {
        selectedOptions[productId].quantity = Math.max(1, Number(selectedOptions[productId].quantity || 1) - 1);
      } else if (type === 'quantity-plus') {
        selectedOptions[productId].quantity = Math.min(20, Number(selectedOptions[productId].quantity || 1) + 1);
      } else {
        selectedOptions[productId][type] = value;
      }

      renderProducts();
      return;
    }

    if (addButton) {
      addToCart(addButton.dataset.addToCart);
    }
  });
}

if (cartItemsEl) {
  cartItemsEl.addEventListener('click', event => {
    const removeButton = event.target.closest('[data-remove-index]');
    const qtyButton = event.target.closest('[data-qty-index]');

    if (removeButton) {
      removeFromCart(Number(removeButton.dataset.removeIndex));
      return;
    }

    if (qtyButton) {
      updateCartQuantity(Number(qtyButton.dataset.qtyIndex), Number(qtyButton.dataset.qtyChange));
    }
  });
}

cartBtn?.addEventListener('click', openCart);
closeCartBtn?.addEventListener('click', closeCart);
overlay?.addEventListener('click', closeCart);

clearCartBtn?.addEventListener('click', () => {
  cart = [];
  persistCart();
  renderCart();
});

menuBtn?.addEventListener('click', () => mainNav?.classList.toggle('open'));
musicToggle?.addEventListener('click', toggleMusic);
closePreviewBtn?.addEventListener('click', closePreview);

imagePreviewModal?.addEventListener('click', event => {
  if (event.target.dataset.closePreview === 'true') {
    closePreview();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closePreview();
});

searchInput?.addEventListener('input', renderProducts);
categoryFilter?.addEventListener('change', renderProducts);
stripeCheckoutBtn?.addEventListener('click', checkoutWithStripe);

initCategoryFilter();
renderProducts();
renderCart();