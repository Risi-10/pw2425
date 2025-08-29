import { router } from '../router.js';
import AuthService from '../services/AuthService.js';

export default class TrainingProgramView {
  constructor() {
    this.programData = null;
    this.errorMessage = null;
    this.otherProgramsData = null;
    const params = new URLSearchParams(window.location.search);
    this.programId = params.get('program_id');
  }

  async fetchOtherPrograms() {
    try {
      const token = localStorage.getItem('jwt');
      const headers = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const resp = await fetch(
        `/pw2425/api/programs?limit=4&exclude_id=${this.programId}`,
        { headers }
      );
      if (!resp.ok) throw new Error(`Gabim ${resp.status}`);
      const result = await resp.json();
      this.otherProgramsData = result.success ? result.data : [];
    } catch (e) {
      console.warn('Could not load related programs:', e);
      this.otherProgramsData = [];
    }
  }

  async controller() {
    this.errorMessage = null;
    this.programData = null;
    this.otherProgramsData = null;
    this.ownsProgram = false;

    if (!this.programId) {
      this.errorMessage = 'ID e programit mungon ose eshte e pavlefshme.';
      this.updateAppView();
      return;
    }

    this.updateAppView();

    try {
      const token = localStorage.getItem('jwt');
      const headers = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const resp = await fetch(
        `/pw2425/api/programs/${this.programId}/detail`,
        { headers }
      );
      if (!resp.ok) throw new Error(`Gabim ${resp.status}`);
      const result = await resp.json();
      if (!result.success || !result.data)
        throw new Error(result.message || 'Te dhena te pavlefshme.');

      this.programData = result.data;

      if (AuthService.isAuthenticated()) {
        await this.fetchUserData();
        const user = AuthService.getCurrentUser();
        if (user && user.id) {
          // If user is admin or trainer, they always "own" the program
          if (user.role === 'admin' || user.role === 'trainer') {
            this.ownsProgram = true;
          } else {
            const purchasedResp = await fetch(
              `/pw2425/api/users/${user.id}/purchased-programs`,
              { headers }
            );
            if (purchasedResp.ok) {
              const purchasedResult = await purchasedResp.json();
              if (
                purchasedResult.success &&
                Array.isArray(purchasedResult.data) &&
                purchasedResult.data.some(
                  (prog) => String(prog.program_id) === String(this.programId)
                )
              ) {
                this.ownsProgram = true;
              }
            }
          }
        }
      }
      await this.fetchOtherPrograms();
    } catch (e) {
      console.error(e);
      this.errorMessage = e.message || 'Nuk mund te ngarkohet programi.';
    }

    this.updateAppView();
  }

  render() {
    const header = /*html*/ `
      <header class="tp-header minimal-header">
        <div class="container tp-header-inner">
          <a href="/pw2425/" data-link class="tp-logo">
            <img src="/pw2425/frontend/assets/logo-pw.png" alt="Fitness Pro" class="logo-img-minimal"/>
            <span>Fitness Pro</span>
          </a>
          <nav class="tp-nav">
            <a href="/pw2425/" data-link class="nav-link">Kreu</a>
            <a href="#" id="dashboard-link-program-detail" data-link class="nav-link">Paneli</a>
            <a href="#" id="profile-logout-btn-nav" class="nav-link">Dil</a>
          </nav>
        </div>
      </header>`;

    const footer = /*html*/ `
      <footer class="minimal-footer site-footer">
        <div class="container tp-footer-inner">
          <p>© ${new Date().getFullYear()} Fitness Pro.</p>
          <div class="footer-social-links">
            <a href="#"><i class="fab fa-facebook-f"></i></a>
            <a href="#"><i class="fab fa-instagram"></i></a>
            <a href="#"><i class="fab fa-x-twitter"></i></a>
          </div>
        </div>
      </footer>`;

    // main
    let body;
    if (this.errorMessage) {
      body = `<div class="container"><div class="message-area error">${this.errorMessage}</div></div>`;
    } else if (!this.programData) {
      body = `<div class="container"><div class="loading-message">Duke ngarkuar…</div></div>`;
    } else {
      const p = this.programData;
      const trainer = `${p.trainer_first_name} ${p.trainer_last_name}`.trim();
      const heroStyle = p.program_img
        ? `background-image:url('${p.program_img}');`
        : `background: linear-gradient(135deg, var(--primary-color), var(--accent-color));`;

      // Related programs cards
      const relatedHtml =
        this.otherProgramsData && this.otherProgramsData.length
          ? this.otherProgramsData
              .map(
                (o) => `
          <div class="tp-related-card">
            <a href="/pw2425/programs?program_id=${o.program_id}" data-link>
              <div class="tp-related-thumb" style="background-image:url('${
                o.program_img || '/pw2425/frontend/assets/placeholder.jpg'
              }')"></div>
              <div class="tp-related-info">
                <h4>${o.title}</h4>
                <span class="tp-related-price">${o.price} ${o.currency}</span>
                <button class="btn btn-outline btn-small">Me Shume…</button>
              </div>
            </a>
          </div>
        `
              )
              .join('')
          : `<p class="no-other-programs">Nuk ka programe te tjera.</p>`;

      body = `
      <section class="tp-hero" style="${heroStyle}">
        <div class="tp-hero-overlay"></div>
        <div class="tp-hero-content container">
          <h1 class="tp-hero-title">${p.title}</h1>
          <p class="tp-hero-subtitle">Nga ${trainer}</p>
        </div>
      </section>

      <main class="tp-main container">
        <div class="tp-details">
          <article class="card tp-card">
        <h2 class="tp-section-title">Pershkrimi</h2>
        <p class="tp-text">${(p.description || 'Nuk ka pershkrim.').replace(
          /\n/g,
          '<br>'
        )}</p>
        
        <div class="tp-meta-grid">
          <div class="tp-meta-item"><i class="fas fa-calendar-alt"></i><span>${
            p.duration_weeks
          } jave</span></div>
          <div class="tp-meta-item"><i class="fas fa-users"></i><span>${
            p.purchase_count
          } regjistrime</span></div>
          <div class="tp-meta-item"><i class="fas fa-user-tie"></i><span>${trainer}</span></div>
        </div>

        ${
          p.program_link
            ? `<a href="${p.program_link}" target="_blank" class="btn btn-outline tp-pdf-btn">
           <i class="fas fa-file-pdf"></i> Shiko PDF
             </a>`
            : `<p class="tp-no-pdf"><i class="fas fa-file-alt"></i> PDF nuk disponohet</p>`
        }
          </article>
        </div>

        ${
          !this.ownsProgram
            ? `<aside class="tp-sidebar">
            <div class="card tp-buy-card">
          <div class="tp-price">${p.price} ${p.currency}</div>
          <button id="purchase-program-btn" class="btn btn-primary tp-buy-btn">
            <i class="fas fa-shopping-cart"></i> Bli Programin
          </button>
          <div class="tp-payment-info">
            <i class="fas fa-lock"></i><span>Pagese 100% e sigurte</span>
            <i class="fa-brands fa-paypal"></i>
            <span>Me Paypal</span>
          </div>
            </div>
          </aside>`
            : ''
        }
      </main>

      <section class="tp-related-section container">
        <h3 class="tp-related-title">Te Tjera</h3>
        <div class="tp-related-grid">${relatedHtml}</div>
      </section>`;
    }

    return `<div id="program-detail-page" class="program-page">${header}${body}${footer}</div>`;
  }

  addEventListeners() {
    // data-link
    document.querySelectorAll('a[data-link]').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = a.getAttribute('href');
        router.navigate(target);
      });
    });
    // buy
    const btn = document.getElementById('purchase-program-btn');
    if (btn)
      btn.addEventListener('click', async () => {
        if (!AuthService.isAuthenticated()) {
          router.navigate(
            `/pw2425/login?redirect=${encodeURIComponent(location.href)}`
          );
          return;
        }
        // Call backend to create Stripe Checkout session
        try {
          const res = await fetch('/pw2425/backend/api/stripe-checkout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              price: this.programData.price,
              program_id: this.programData.program_id,
              program_name: this.programData.title,
              user_email: this.userData.email,
            }),
          });
          const data = await res.json();
          if (data.url) {
            window.location.href = data.url; // Redirect to Stripe Checkout
          } else {
            alert('Nuk mund te hapet Stripe Checkout: ' + (data.error || ''));
          }
        } catch (err) {
          alert('Gabim gjate hapjes se Stripe Checkout.');
        }
      });
    // auth nav
    const dash = document.getElementById('dashboard-link-program-detail');
    const logout = document.getElementById('profile-logout-btn-nav');
    if (dash) {
      if (AuthService.isAuthenticated()) {
        const u = AuthService.getCurrentUser();
        dash.href = `/pw2425/dashboard/${u.role}?user_id=${u.id}`;
        dash.textContent = 'Paneli';
      } else {
        dash.href = '/pw2425/login';
        dash.textContent = 'Hyr';
      }
    }
    if (logout) {
      if (AuthService.isAuthenticated()) {
        logout.style.display = '';
        logout.addEventListener('click', (e) => {
          e.preventDefault();
          AuthService.logout();
          router.navigate('/pw2425/login');
        });
      } else {
        logout.style.display = 'none';
      }
    }
  }
  async fetchUserData() {
    if (!AuthService.isAuthenticated()) return null;
    const user = AuthService.getCurrentUser();
    if (!user || !user.id) return null;
    const token = localStorage.getItem('jwt');
    const resp = await fetch(`/pw2425/api/users/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.ok) {
      const data = await resp.json();
      this.userData = data.data;
      return this.userData;
    }
    return null;
  }

  updateAppView() {
    const app = document.getElementById('app');
    if (!app) return console.error('#app not found');
    app.innerHTML = this.render();
    this.addEventListeners();
  }
}
