// components.js - Quản lý Header, Footer và Phân quyền (RBAC)

const ROLE = sessionStorage.getItem('nhadep_role');
const UNAME = sessionStorage.getItem('nhadep_user');
const IS_ADMIN = ROLE === 'admin';
const IS_CTV = ROLE === 'ctv';

function checkAuth() {
  const isLoginPage = location.pathname.endsWith('index.html') || location.pathname === '/';
  
  // Bắt buộc đăng nhập
  if (!ROLE || ROLE === 'guest') {
    if (!isLoginPage) location.href = 'index.html?require=login';
    return;
  }
  
  // Nếu đã đăng nhập, kiểm tra quyền truy cập các trang nhạy cảm
  const path = location.pathname.toLowerCase();
  const isEstimate = path.includes('estimate.html');
  const isHopdong = path.includes('hopdong.html');
  const isAdminOrCtv = IS_ADMIN || IS_CTV;
  
  if ((isEstimate || isHopdong) && !isAdminOrCtv) {
    alert('Tài khoản khách hàng không có quyền truy cập trang Lập Hợp Đồng và Khái Toán.');
    location.href = 'home.html';
    return;
  }
}
// Chạy ngay khi load
checkAuth();

function logout() {
  sessionStorage.clear();
  location.href = 'index.html';
}

function toggleMob() {
  const menu = document.getElementById('mobMenu');
  if (menu) menu.classList.toggle('open');
}

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || 'home';
    const isAdminOrCtv = IS_ADMIN || IS_CTV;
    
    // Tự động hide các menu không có quyền
    const estimateStyle = isAdminOrCtv ? '' : 'display:none !important;';
    const hopdongStyle = isAdminOrCtv ? '' : 'display:none !important;';
    
    this.innerHTML = `
      <nav class="nav">
        <a href="home.html" class="nav-logo">
          <img src="/logo.png" alt="logo" width="40" height="40" loading="eager" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div style="display:none;width:40px;height:40px;background:var(--green);border-radius:6px;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0">HL</div>
          <div>
            <div class="nl-name">Hùng Lê Design Studio</div>
            <div class="nl-sub">Thiết kế từ tâm — Nâng tầm tiện ích</div>
          </div>
        </a>
        <div class="nav-r">
          <span class="nav-user" id="userLabel">${UNAME ? 'Xin chào, ' + UNAME : ''}</span>
          <a href="tel:0947017495" class="nav-phone">📞 0947.017.495</a>
          <button class="nb ${active==='home'?'nb-green':'nb-ghost'}" onclick="location.href='home.html'">🏠 Thư viện</button>
          <button class="nb ${active==='noithat'?'nb-green':'nb-ghost'}" onclick="location.href='noithat.html'">🛋 Nội thất</button>
          <button class="nb ${active==='huong'?'nb-green':'nb-ghost'}" onclick="location.href='huong.html'">🧭 Hướng nhà</button>
          <button class="nb ${active==='estimate'?'nb-green':'nb-ghost'}" onclick="location.href='estimate.html'" style="${estimateStyle}">Khái toán</button>
          <button class="nb ${active==='hopdong'?'nb-green':'nb-ghost'}" onclick="location.href='hopdong.html'" style="${hopdongStyle}">📝 Lập hợp đồng</button>
          <button class="nb ${active==='kinhnghiem'?'nb-green':'nb-ghost'}" onclick="location.href='kinhnghiem.html'">📖 Kinh nghiệm</button>
          <button class="nb ${active==='thuocloban'?'nb-green':'nb-ghost'}" onclick="location.href='thuocloban.html'">📐 Thước Lỗ Ban</button>
          <button class="nb ${active==='xemtuoi'?'nb-green':'nb-ghost'}" onclick="location.href='xemtuoilamnha.html'">🗓 Xem tuổi</button>
          <button class="nb nb-ghost" id="navLogoutBtn" onclick="logout()">Đăng xuất</button>
        </div>
        <button class="mob-toggle" id="mobToggle" onclick="toggleMob()" aria-label="Menu">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </nav>

      <div class="mob-menu" id="mobMenu">
        ${UNAME ? `<div class="mob-label" id="mobUser">Xin chào, ${UNAME}</div><div class="mob-sep"></div>` : ''}
        <a href="home.html" class="mob-item" ${active==='home'?'style="color:var(--green);background:var(--gl)"':''}>🏠 Thư viện mẫu nhà</a>
        <a href="noithat.html" class="mob-item" ${active==='noithat'?'style="color:var(--green);background:var(--gl)"':''}>🛋 Tư vấn nội thất</a>
        <a href="estimate.html" class="mob-item" style="${estimateStyle} ${active==='estimate'?'color:var(--green);background:var(--gl)':''}">📊 Khái toán chi phí</a>
        <a href="hopdong.html" class="mob-item" style="${hopdongStyle} ${active==='hopdong'?'color:var(--green);background:var(--gl)':''}">📝 Lập hợp đồng</a>
        <a href="huong.html" class="mob-item" ${active==='huong'?'style="color:var(--green);background:var(--gl)"':''}>🧭 Hướng nhà / Phong thuỷ</a>
        <a href="kinhnghiem.html" class="mob-item" ${active==='kinhnghiem'?'style="color:var(--green);background:var(--gl)"':''}>📖 Kinh nghiệm xây nhà</a>
        <a href="thuocloban.html" class="mob-item" ${active==='thuocloban'?'style="color:var(--green);background:var(--gl)"':''}>📐 Thước Lỗ Ban</a>
        <a href="xemtuoilamnha.html" class="mob-item" ${active==='xemtuoi'?'style="color:var(--green);background:var(--gl)"':''}>🗓 Xem tuổi làm nhà</a>
        <div class="mob-sep"></div>
        <a href="tel:0947017495" class="mob-item">📞 Gọi: 0947.017.495</a>
        <button class="mob-item" style="color:#c05050" onclick="logout()">🚪 Đăng xuất</button>
      </div>
    `;
  }
}
customElements.define('site-header', SiteHeader);

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <div class="f-logo">
          <img src="/logo.png" alt="logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div style="display:none;width:32px;height:32px;background:var(--green);border-radius:4px;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0">HL</div>
          <div>
            <div class="f-name">Hùng Lê Design Studio</div>
            <div class="f-sub">Thiết kế từ tâm — Nâng tầm tiện ích</div>
          </div>
        </div>
        <div class="f-r">
          <a href="tel:0947017495">📞 0947.017.495</a>
          <p>© 2026 Hùng Lê Design Studio</p>
        </div>
      </footer>
    `;
  }
}
customElements.define('site-footer', SiteFooter);
