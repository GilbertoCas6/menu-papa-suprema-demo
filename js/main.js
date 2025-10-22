document.addEventListener('DOMContentLoaded', () => {
  /* ===== Animación on-scroll ===== */
  const cards = document.querySelectorAll('.card');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  cards.forEach(c => io.observe(c));

  /* ===== WhatsApp: móvil App / PC Web (con fallbacks) ===== */
  const PHONE = '18299327855';
  const enc = s => encodeURIComponent(s);
  const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);

  function openWhatsAppText(text){
    const urlWeb  = `https://web.whatsapp.com/send?phone=${PHONE}&text=${enc(text)}&app_absent=0`;
    const urlApi  = `https://api.whatsapp.com/send/?phone=${PHONE}&text=${enc(text)}&type=phone_number&app_absent=0`;
    const urlWame = `https://wa.me/${PHONE}?text=${enc(text)}`;
    const primary = isMobile ? urlApi : urlWeb;

    const win = window.open(primary, '_blank', 'noopener');
    setTimeout(() => {
      if (!win || win.closed) {
        const w2 = window.open(urlApi, '_blank', 'noopener');
        setTimeout(() => { if (!w2 || w2.closed) window.open(urlWame, '_blank', 'noopener'); }, 350);
      }
    }, 300);
  }

  const formatRD = v => 'RD$' + (Number(v)||0).toLocaleString('es-DO');

  /* ===== Toast + Nudge (feedback) ===== */
  let toastTimer;
  function toast(msg){
    clearTimeout(toastTimer);
    let el = document.getElementById('toast');
    if(!el){
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    toastTimer = setTimeout(()=> el.classList.remove('show'), 1500);
  }
  function nudgeCart(){
    const btn = document.getElementById('open-cart');
    if(!btn) return;
    btn.classList.remove('nudge');  // reinicia animación
    // forzar reflow para poder re-aplicar la animación
    // eslint-disable-next-line no-unused-expressions
    void btn.offsetWidth;
    btn.classList.add('nudge');
  }

  /* ===== Estado del carrito ===== */
  let CART = []; // { name, price, qty, img }

  function cartTotals(){
    const count = CART.reduce((a,b)=>a+b.qty,0);
    const total = CART.reduce((a,b)=>a+b.qty*b.price,0);
    return {count, total};
  }

  function renderCart(){
    const {count, total} = cartTotals();
    const c = id => document.getElementById(id);
    if (c('cart-count'))     c('cart-count').textContent = count;
    if (c('cart-total'))     c('cart-total').textContent = formatRD(total);
    if (c('cart-total-big')) c('cart-total-big').textContent = formatRD(total);

    const wrap = c('cart-items');
    if (!wrap) return;
    wrap.innerHTML = '';

    if (CART.length === 0){
      wrap.innerHTML = '<p class="muted">Tu carrito está vacío.</p>';
      return;
    }

    CART.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';

      const hasThumb = !!item.img;

      row.innerHTML = `
        ${hasThumb ? `<img class="cart-thumb" src="${item.img}" alt="${item.name}">` : ''}
        <div class="cart-info">
          <h5>${item.name}</h5>

          <div class="cart-meta">
            <div class="qty">
              <button aria-label="menos">-</button>
              <span>${item.qty}</span>
              <button aria-label="más">+</button>
            </div>
            <button class="cart-remove" title="Quitar">Eliminar</button>
          </div>

          <div class="cart-row"><span>${formatRD(item.price)}</span></div>
        </div>
      `;

      if (!hasThumb) row.classList.add('no-thumb');

      const [btnMinus, btnPlus] = row.querySelectorAll('.qty button');
      const btnRemove = row.querySelector('.cart-remove');

      btnMinus.addEventListener('click', ()=>changeQty(item.name, item.price, -1));
      btnPlus .addEventListener('click', ()=>changeQty(item.name, item.price, +1));
      btnRemove.addEventListener('click', ()=>removeFromCart(item.name, item.price));

      wrap.appendChild(row);
    });
  }

  function addToCart(name, price, img){
    const p = Number(price);
    if (isNaN(p)) return;
    const wasEmpty = CART.length === 0;
    const i = CART.findIndex(x => x.name === name && x.price === p);
    if (i >= 0) CART[i].qty += 1;
    else CART.push({ name, price:p, qty:1, img: img || '' });
    renderCart();
    if (wasEmpty) openCart();           // si estaba vacío, abrimos el panel al agregar
    toast(`Añadido: ${name}`);          // feedback
    nudgeCart();                        // pequeño nudge al botón Carrito
  }

  function removeFromCart(name, price){
    const p = Number(price);
    CART = CART.filter(x => !(x.name===name && x.price===p));
    renderCart();
  }

  function changeQty(name, price, delta){
    const p = Number(price);
    const i = CART.findIndex(x => x.name===name && x.price===p);
    if (i >= 0){
      CART[i].qty += delta;
      if (CART[i].qty <= 0) CART.splice(i,1);
      renderCart();
    }
  }

  function buildCartMessage(){
    if (CART.length === 0) return 'Hola Dai Burguer, quiero hacer un pedido.';
    const lines = ['Hola Dai Burguer,', 'Quisiera pedir:'];
    CART.forEach(i => lines.push(`• ${i.name} x${i.qty} — ${formatRD(i.price*i.qty)}`));
    const total = CART.reduce((a,b)=>a+b.price*b.qty,0);
    lines.push('', `Total: ${formatRD(total)}`, '', '¿Me confirman disponibilidad y tiempo de entrega, por favor?');
    return lines.join('\n');
  }

  /* ===== Botones de producto -> agregar al carrito ===== */
  document.querySelectorAll('.wa-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name  = btn.dataset.name || 'Producto';
      const price = btn.dataset.price;
      if (!price || price === '--') return;

      const card = btn.closest('.card');
      const img  = card ? (card.querySelector('img')?.src || '') : '';

      addToCart(name, price, img); // ya hace toast + nudge dentro
    });
  });

  /* ===== Panel del carrito ===== */
  const panel    = document.getElementById('cart-panel');
  const backdrop = document.getElementById('cart-backdrop');
  const openBtn  = document.getElementById('open-cart');
  const closeBtn = document.getElementById('close-cart');
  const fab      = document.getElementById('fab-cart'); // flotante si lo tienes

  function openCart(){
    renderCart();
    if (panel) panel.classList.add('open');
    if (backdrop) backdrop.classList.add('show');
  }
  function closeCart(){
    if (panel) panel.classList.remove('open');
    if (backdrop) backdrop.classList.remove('show');
  }

  // Exponer por si quieres llamarlo desde consola
  window.openCart = openCart;
  window.closeCart = closeCart;

  if (openBtn)  openBtn.addEventListener('click', (e)=>{ e.preventDefault(); openCart(); });
  if (closeBtn) closeBtn.addEventListener('click', (e)=>{ e.preventDefault(); closeCart(); });
  if (backdrop) backdrop.addEventListener('click', closeCart);
  if (fab)      fab.addEventListener('click', (e)=>{ e.preventDefault(); openCart(); });

  // Delegación por si algo repinta
  document.addEventListener('click', (e) => {
    const t = e.target.closest('#open-cart');
    if (t) { e.preventDefault(); openCart(); }
  });

  // Esc para cerrar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
  });

  /* ===== Checkout ===== */
  function doCheckout(){
    const text = buildCartMessage();
    openWhatsAppText(text);
  }
  const chk1 = document.getElementById('checkout');
  const chk2 = document.getElementById('checkout2');
  if (chk1) chk1.addEventListener('click', doCheckout);
  if (chk2) chk2.addEventListener('click', doCheckout);

  /* ===== Botones genéricos (héroe / flotante) ===== */
  document.querySelectorAll('.open-wa-generic').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const msg = el.dataset.msg || 'Hola Dai Burguer, quiero hacer un pedido.';
      openWhatsAppText(msg);
    });
  });

  // Inicial
  renderCart();
});

