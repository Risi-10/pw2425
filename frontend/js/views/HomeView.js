import { router } from '../router.js';

export default class HomeView {
  constructor() {
    this.programsData = null;
    this.isLoadingPrograms = false;
    this.programsError = null;
    this.trainerPlans = [
      {
        name: 'Bazik',
        price: '€9.99',
        features: [
          'Menaxhim i thjeshte i klienteve',
          'Menaxhim deri ne 10 programe',
          'Suport bazik',
        ],
        cta: 'Behu Trajner',
      },
      {
        name: 'Pro',
        price: '€19.99',
        features: [
          'Menaxhim i avancuar i klienteve',
          'Menaxhim deri ne 50 programe',
          'Analiza te avancuara',
          'Suport prioritar',
        ],
        cta: 'Zgjidh Pro',
      },
      {
        name: 'Premium',
        price: '€29.99',
        features: [
          'Te gjitha te Pro',
          'Marketing dhe promovim i avancuar i programeve',
          'Konsultim 1-me-1',
          'Suport VIP',
        ],
        cta: 'Zgjidh Premium',
      },
    ];
    this.testimonials = [
      {
        quote:
          'Kjo platforme me ndryshoi jeten! Kam arritur qellimet e mia me shpejt se kurre.',
        author: 'Ana K.',
        image:
          'https://ui-avatars.com/api/?name=Ana&background=0D8ABC&color=fff',
      },
      {
        quote:
          'Si trajner, menaxhimi i klienteve nuk ka qene kurre me i lehte. Faleminderit!',
        author: 'Bledi M.',
        image:
          'https://ui-avatars.com/api/?name=Bledi&background=0D8ABC&color=fff',
      },
      {
        quote: 'Programet jane fantastike dhe komuniteti mbeshtetes.',
        author: 'Era S.',
        image:
          'https://ui-avatars.com/api/?name=Era&background=0D8ABC&color=fff',
      },
    ];
  }

  async fetchPrograms() {
    this.isLoadingPrograms = true;
    this.programsError = null;
    this.updateAppView();

    try {
      const response = await fetch('/pw2425/api/programs?limit=3');

      if (!response.ok) {
        let errorMsg = `Gabim ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        this.programsData = result.data;
      } else {
        throw new Error(result.message || 'Error ne server.');
      }
    } catch (err) {
      console.error('Error fetching programs for HomeView:', err);
      this.programsError = err.message || 'Nuk mund te ngarkohen programet.';
      this.programsData = []; // Ensure it's an empty array on error
    } finally {
      this.isLoadingPrograms = false;
      this.updateAppView(); // Re-render with data or error
    }
  }

  renderProgramsSection() {
    let programsHtml = '';

    if (this.isLoadingPrograms) {
      programsHtml =
        '<div class="loading-message">Duke ngarkuar programet...</div>';
    } else if (this.programsError) {
      programsHtml = `<div class="message-area error">${this.programsError}</div>`;
    } else if (this.programsData && this.programsData.length > 0) {
      programsHtml = this.programsData
        .map((program) => {
          const imageUrl =
            program.program_img ||
            'https://via.placeholder.com/300x200?text=Program';
          const descriptionSnippet = program.description
            ? program.description.substring(0, 100) +
              (program.description.length > 100 ? '...' : '')
            : 'Pershkrim i shkurter i programit.';
          const priceDisplay =
            program.price !== null && program.price > 0
              ? `${program.price} ${program.currency}`
              : 'Falas';

          return /*html*/ `
          <div class="program-card card">
            <a href="/pw2425/programs?program_id=${
              program.program_id
            }" class="program-card-link" data-link>
              <img src="${imageUrl}" alt="${
            program.title
          }" class="program-card-img">
              <div class="program-card-content">
                <h3>${program.title}</h3>
                <p>${descriptionSnippet}</p>
                <div class="program-card-stats">
                  <span><i class="fas fa-tag"></i> ${priceDisplay}</span>
                  <span><i class="fas fa-users"></i> ${
                    program.purchase_count || 0
                  } Blerje</span>
                </div>
                <span class="btn btn-secondary btn-sm program-card-cta">Meso Me Shume</span>
              </div>
            </a>
          </div>
        `;
        })
        .join('');
    } else {
      programsHtml =
        '<div class="no-programs-message">Nuk ka programe te disponueshme per momentin.</div>';
    }

    return /*html*/ `
      <section id="programs" class="programs-section section-padding">
        <h2 class="section-title">Programet Tona Me Popullore</h2>
        <div class="program-cards-container">
          ${programsHtml}
        </div>
      </section>
    `;
  }

  render() {
    return /*html*/ `
      <div id="home-page-container" class="page-container home-page">
        <nav class="navbar">
          <div class="navbar-brand">
            <a href="/pw2425/" data-link>
              <img src="/pw2425/frontend/assets/logo-pw.png" alt="Fitness Pro Logo" class="logo-img"/>
              <span>Fitness Pro</span>
            </a>
          </div>
          <button class="navbar-toggler" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="navbar-collapse">
            <ul class="navbar-nav">
              <li><a href="#programs" data-link-internal>Programet</a></li>
              <li><a href="#for-trainers" data-link-internal>Per Trajneret</a></li>
              <li><a href="#testimonials" data-link-internal>Klientet Tane</a></li>
              <li><a href="/pw2425/login" class="btn btn-secondary btn-sm" data-link>Login</a></li>
              <li><a href="/pw2425/signup" class="btn-signup btn btn-primary btn-sm" data-link>Sign Up</a></li>
            </ul>
            <button id="theme-switch-btn-nav" class="theme-switch-btn" title="Toggle Theme">🌓</button>
          </div>
        </nav>

        <header class="hero-section">
          <div class="hero-content">
            <h1 class="hero-title">Transformo Jeten Tende me Fitness Pro</h1>
            <p class="hero-subtitle">Platforma jote e plote per te arritur qellimet e fitnesit, menaxhuar stervitjet dhe lidhur me trajnere eksperte.</p>
            <a href="/pw2425/signup" class="btn btn-primary btn-lg hero-cta" data-link>Bashkohu Tani Falas</a>
            <p class="hero-login-prompt">Keni llogari? <a href="/pw2425/login" data-link>Hyr ketu</a></p>
          </div>
          <div class="hero-image-container">
            <img src="/pw2425/frontend/assets/hero-image.jpg" alt="Fitness illustration" class="hero-image"/>
          </div>
        </header>

        <main>
          ${this.renderProgramsSection()}

          <section id="for-trainers" class="for-trainers-section section-padding alt-bg">
            <h2 class="section-title">Per Trajneret: Rrit Biznesin Tend</h2>
            <p class="section-subtitle">Bashkohu komunitetit tone te trajnereve dhe merr gjithcka qe te duhen per sukses.</p>
            <div class="pricing-cards-container">
              ${this.trainerPlans
                .map(
                  (plan) => /*html*/ `
                <div class="pricing-card card">
                  <h3>${plan.name}</h3>
                  <p class="pricing-card-price">${
                    plan.price
                  }<span>/muaj</span></p>
                  <ul>${plan.features
                    .map((feature) => `<li>${feature}</li>`)
                    .join('')}</ul>
                  <a href="/pw2425/signup?role=trainer" class="btn btn-primary" data-link>${
                    plan.cta
                  }</a>
                </div>`
                )
                .join('')}
            </div>
          </section>

          <section id="testimonials" class="testimonials-section section-padding">
            <h2 class="section-title">Çfare Thone Perdoruesit Tane</h2>
            <div class="testimonial-cards-container">
              ${this.testimonials
                .map(
                  (testimonial) => /*html*/ `
                <div class="testimonial-card card">
                  <img src="${testimonial.image}" alt="${testimonial.author}" class="testimonial-author-img">
                  <p class="testimonial-quote">"${testimonial.quote}"</p>
                  <p class="testimonial-author">- ${testimonial.author}</p>
                </div>`
                )
                .join('')}
            </div>
          </section>
        </main>

        <footer class="site-footer">
          <div class="footer-content">
            <div class="footer-brand">
              <span>Fitness Pro</span>
              <p>Angazhimi juaj per nje jete me te shendetshme.</p>
            </div>
            <div class="footer-links">
              <h4>Lidhje te Shpejta</h4>
              <ul>
                <li><a href="#programs" data-link-internal>Programet</a></li>
                <li><a href="#for-trainers" data-link-internal>Per Trajneret</a></li>
              </ul>
            </div>
            <div class="footer-social">
              <h4>Na Ndiqni</h4>
              <a href="#" aria-label="Facebook" class="social-icon-link"><i class="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Instagram" class="social-icon-link"><i class="fab fa-instagram"></i></a>
              <a href="#" aria-label="Twitter" class="social-icon-link"><i class="fab fa-x-twitter"></i></a>
            </div>
          </div>
          <div class="footer-bottom">
            <p>© ${new Date().getFullYear()} Fitness Pro. Te gjitha te drejtat e rezervuara.</p>
          </div>
        </footer>
      </div>
    `;
  }

  updateAppView() {
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = this.render();
      this.addEventListeners(); // Re-attach listeners after rendering
    } else {
      console.error("Element with ID 'app' not found for rendering HomeView.");
    }
  }

  async controller() {
    this.programsData = null;
    this.isLoadingPrograms = false;
    this.programsError = null;

    await this.fetchPrograms();
  }

  addEventListeners() {
    document
      .querySelectorAll('#home-page-container a[data-link]')
      .forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const path = link.getAttribute('href');
          router.navigate(path);
        });
      });

    document
      .querySelectorAll('#home-page-container a[data-link-internal]')
      .forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const targetId = this.getAttribute('href');
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            const navbarHeight =
              document.querySelector('.navbar')?.offsetHeight || 0;
            const elementPosition =
              targetElement.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - navbarHeight - 20;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth',
            });

            document
              .querySelectorAll('.navbar-nav a')
              .forEach((navLink) => navLink.classList.remove('active'));
            this.classList.add('active');
          }
        });
      });

    // Theme Switcher Logic
    const themeSwitchBtnNav = document.getElementById('theme-switch-btn-nav');
    if (themeSwitchBtnNav) {
      const currentTheme = localStorage.getItem('theme') || 'light';
      const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeSwitchBtnNav.textContent = theme === 'dark' ? '☀️' : '🌓';
      };
      applyTheme(currentTheme); // Apply theme on load
      themeSwitchBtnNav.addEventListener('click', () => {
        const newTheme =
          document.documentElement.getAttribute('data-theme') === 'dark'
            ? 'light'
            : 'dark';
        applyTheme(newTheme);
      });
    }

    // Navbar Toggler for mobile
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarToggler && navbarCollapse) {
      navbarToggler.addEventListener('click', () => {
        navbarCollapse.classList.toggle('show');
        navbarToggler.classList.toggle('active');
      });
    }
  }
}
