import DashboardView from './DashboardView.js';
import AuthService from '../services/AuthService.js'; // Assuming AuthService is in services
import { router } from '../router.js'; // For SPA navigation

export default class ClientDashboardView extends DashboardView {
  constructor() {
    super();
    this.purchasedPrograms = null;
    this.recommendedPrograms = null;
    this.loading = false;
    this.error = null;
  }

  async fetchPurchasedPrograms() {
    this.loading = true;
    this.error = null;
    try {
      const token = localStorage.getItem('jwt');
      const response = await fetch(
        `/pw2425/api/users/${this.userId}/purchased-programs`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok)
        throw new Error('Nuk mund të ngarkohen programet e blera.');
      const result = await response.json();
      this.purchasedPrograms = result.data || [];
    } catch (err) {
      this.error = err.message;
      this.purchasedPrograms = [];
    } finally {
      this.loading = false;
    }
  }

  async fetchRecommendedPrograms() {
    // Exclude already purchased program IDs
    const excludeIds =
      this.purchasedPrograms && this.purchasedPrograms.length
        ? this.purchasedPrograms.map((p) => p.program_id).join(',')
        : '';
    try {
      const response = await fetch(
        `/pw2425/api/programs?limit=4${
          excludeIds ? `&exclude_ids=${excludeIds}` : ''
        }`
      );
      if (!response.ok) throw new Error('Nuk mund të ngarkohen rekomandimet.');
      const result = await response.json();
      this.recommendedPrograms = result.data || [];
    } catch (err) {
      this.recommendedPrograms = [];
    }
  }

  async controller() {
    await this.fetchPurchasedPrograms();
    await this.fetchRecommendedPrograms();
    this.updateAppView();
    super.addLogoutListener();
    this.addSpecificEventListeners();
    this.loadClientInfo();
    this.setupChatbot();
  }

  renderPurchasedProgramsSection() {
    if (this.loading) {
      return `<div class="loading-message">Duke ngarkuar programet...</div>`;
    }
    if (this.error) {
      return `<div class="message-area error">${this.error}</div>`;
    }
    if (!this.purchasedPrograms || this.purchasedPrograms.length === 0) {
      return `<div class="no-programs-message">Nuk keni blerë asnjë program stërvitor.</div>`;
    }
    return `
      <ul class="program-list item-list">
        ${this.purchasedPrograms
          .map(
            (program) => `
          <li>
            ${program.title} - ${program.duration_weeks} javë
            <a href="/pw2425/programs?program_id=${program.program_id}" class="action-link" data-link>Shiko Detajet</a>
          </li>
        `
          )
          .join('')}
      </ul>
    `;
  }

  renderRecommendedProgramsSection() {
    if (!this.recommendedPrograms || this.recommendedPrograms.length === 0) {
      return '';
    }
    return `
      <div class="recommended-programs-section">
        <h3>Rekomanduar për ju</h3>
        <div class="recommended-programs-cards">
          ${this.recommendedPrograms
            .map(
              (program) => `
            <div class="recommended-program-card card">
              <img src="${
                program.program_img || '/pw2425/frontend/assets/logo-pw.png'
              }" alt="${program.title}" class="recommended-program-img">
              <div class="recommended-program-info">
                <h4>${program.title}</h4>
                <p>${program.duration_weeks} javë</p>
                <a href="/pw2425/programs?program_id=${
                  program.program_id
                }" class="btn btn-secondary btn-sm" data-link>Mëso më shumë</a>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  render() {
    const profileLink = `/pw2425/profile?user_id=${this.userId}`;
    return /*html*/ `
      <div id="client-dashboard-page-container" class="page-container dashboard-page-container">
        <header>
          <h1>Fitness Pro</h1>
          <nav>
            <ul>
              <li><a href="#" class="nav-link active" data-link-internal="panel">Paneli</a></li>
              <li><a href="${profileLink}" class="nav-link" data-link>Profili Im</a></li>
              <li><a href="#" id="dashboard-logout-btn-nav" class="nav-link">Dil</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <section class="dashboard-section">
            <h2>Paneli i Klientit</h2>
            <div id="dashboard-error" class="message-area error" style="display: none"></div>
            <div class="dashboard-content">
              <div class="card">
                <h3>Programet e Blera</h3>
                ${this.renderPurchasedProgramsSection()}
              </div>
              ${this.renderRecommendedProgramsSection()}
            </div>
          </section>
        </main>
        <!-- Chatbot and footer remain unchanged -->
       
        <div id="chatbot-icon" title="Chat with Carti">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
        <div id="chatbot-window" class="chatbot-hidden">
          <div id="chatbot-header">
           <div class="chatbot-profile-pic-container">
             <img src="https://i1.sndcdn.com/artworks-UjoUqLDmPimCK3ui-OKGVow-t500x500.jpg" alt="Carti">
             <span class="online-indicator"></span>
           </div>
            <span>Carti</span>
            <button id="chatbot-close-btn">&times;</button>
          </div>
          <div id="chatbot-messages">
            <div class="chatbot-message bot">Pershendetje! Une jam Carti, asistenti juaj inteligjent, si mund tju ndihmoje?</div>
          </div>
          <div id="chatbot-input-area">
            <input type="text" id="chatbot-input" placeholder="Ask Carti...">
            <button id="chatbot-send-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg></button>
          </div>
        </div>

        <footer>
          <p>© ${new Date().getFullYear()} Fitness Pro. Të gjitha të drejtat e rezervuara.</p>
        </footer>
      </div>
    `;
  }

  loadClientInfo() {
    // Example: Populate user data into profile settings form
    // This would typically fetch data if not already loaded by DashboardView's loadUserData
    // For now, let's assume this.userData is populated by the base class
    if (this.userData) {
      const nameInput = document.getElementById('profile-name');
      const emailInput = document.getElementById('profile-email');
      if (nameInput) nameInput.value = this.userData.first_name || '';
      if (emailInput) emailInput.value = this.userData.email || '';
    } else {
      // console.log('User data not available for client info.');
      // Optionally, call super.loadUserData() here if it's not called by router/app.js
    }
  }

  updateAppView() {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = this.render();
      this.addSpecificEventListeners();
    }
  }

  addSpecificEventListeners() {
    // Listener for the nav logout button
    const navLogoutBtn = document.getElementById('dashboard-logout-btn-nav');
    if (navLogoutBtn) {
      navLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Assuming AuthService.logout() and router.navigate() are handled by the base addLogoutListener
        // If not, replicate logic here or ensure base addLogoutListener is called.
        // For now, we assume the base class's logout button ID is different or this is an additional one.
        // To avoid duplicate listeners if IDs were the same, ensure base class uses a unique ID.
        // Let's assume the base class `addLogoutListener` targets `dashboard-logout-btn`.
        // So, this specific one needs its own direct call.
        AuthService.logout(); // Assuming AuthService is available
        router.navigate('/login');
      });
    }

    // Example: Listener for profile settings form
    const profileForm = document.getElementById('profileSettingsForm');
    const profileMessageArea = document.getElementById('profile-message-area');
    if (profileForm && profileMessageArea) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        profileMessageArea.textContent = 'Saving...';
        profileMessageArea.style.color = 'var(--text)';
        // Add actual save logic here (e.g., API call)
        setTimeout(() => {
          // Simulate API call
          profileMessageArea.textContent = 'Profile updated successfully!';
          profileMessageArea.style.color = 'green';
        }, 1000);
      });
    }

    // Example: Listener for progress photo form
    const photoForm = document.getElementById('progressPhotoForm');
    const uploadMessageArea = document.getElementById('upload-message-area');
    if (photoForm && uploadMessageArea) {
      photoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        uploadMessageArea.textContent = 'Uploading...';
        uploadMessageArea.style.color = 'var(--text)';
        // Add actual upload logic here
        setTimeout(() => {
          // Simulate API call
          uploadMessageArea.textContent = 'Photo uploaded!';
          uploadMessageArea.style.color = 'green';
        }, 1000);
      });
    }

    // Add listeners for internal navigation links (e.g., to #profile-settings)
    document.querySelectorAll('a[data-link-internal]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    document
      .querySelectorAll(
        '#client-dashboard-page-container a[data-link]:not([data-link-internal])'
      )
      .forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          router.navigate(link.getAttribute('href'));
        });
      });
  }
}
