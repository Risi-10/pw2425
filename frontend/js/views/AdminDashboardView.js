import DashboardView from './DashboardView.js';
import { router } from '../router.js';
import AuthService from '../services/AuthService.js';

export default class AdminDashboardView extends DashboardView {
  render() {
    const metrics = this.metrics || {};
    const analytics = this.analytics || { revenueData: [], months: [] };
    const latestUsers = this.latestUsers || [];
    const latestPurchases = this.latestPurchases || [];

    const profileLink = `/pw2425/profile?user_id=${this.userId}`;

    return `
    <div id="admin-dashboard-page-container" class="page-container dashboard-page-container">
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
        <h2>Paneli i Administratorit</h2>
        <div id="dashboard-error" class="message-area error" style="display: none;"></div>
        <div class="dashboard-metrics-grid">
        <div class="metric-card important">
          <div class="metric-value"></i> ${metrics.totalRevenue || '-'}</div>
          <div class="metric-label">Te Ardhurat Totale</div>
        </div>
        <div class="metric-card">
          <div class="metric-value"><i class="fas fa-users"></i> ${
            metrics.totalClients || '-'
          }</div>
          <div class="metric-label">Kliente Total</div>
        </div>
        <div class="metric-card">
          <div class="metric-value"><i class="fas fa-user-tie"></i> ${
            metrics.totalTrainers || '-'
          }</div>
          <div class="metric-label">Trajnere Total</div>
        </div>
        <div class="metric-card">
          <div class="metric-value"><i class="fas fa-dumbbell"></i> ${
            metrics.totalPrograms || '-'
          }</div>
          <div class="metric-label">Programe Aktive</div>
        </div>
        <div class="metric-card">
          <div class="metric-value"><i class="fas fa-shopping-cart"></i> ${
            metrics.totalPurchases || '-'
          }</div>
          <div class="metric-label">Blerje Totale</div>
        </div>
        <div class="metric-card">
          <div class="metric-value"><i class="fas fa-tag"></i> ${
            metrics.avgProgramPrice || '-'
          }</div>
          <div class="metric-label">Çmimi Mesatar Programi</div>
        </div>
        <div class="metric-card">
          <div class="metric-value"><i class="fas fa-star"></i> ${
            metrics.mostPopularProgram || '-'
          }</div>
          <div class="metric-label">Programi me Popullor</div>
        </div>
        <div class="metric-card">
          <div class="metric-value"><i class="fas fa-trophy"></i> ${
            metrics.mostActiveTrainer || '-'
          }</div>
          <div class="metric-label">Trajneri me Aktiv</div>
        </div>
        <div class="metric-card">
          <div class="metric-value"><i class="fas fa-user-plus"></i> ${
            metrics.newClientsThisMonth || '-'
          }</div>
          <div class="metric-label">Kliente te Rinjte (kete muaj)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value"><i class="fas fa-user-plus"></i> ${
            metrics.newTrainersThisMonth || '-'
          }</div>
          <div class="metric-label">Trajnere te Rinjte (kete muaj)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value"><i class="fas fa-check-circle"></i> ${
            metrics.programsSoldThisMonth || '-'
          }</div>
          <div class="metric-label">Programe te Shitura (kete muaj)</div>
        </div>
        <div class="metric-card">
          <div class="metric-value"><i class="fas fa-chart-line"></i> ${
            metrics.revenueThisMonth || '-'
          }</div>
          <div class="metric-label">Te Ardhurat (kete muaj)</div>
        </div>
        </div>
        <div class="dashboard-tables-section">
        <div class="card">
          <h3>Perdoruesit e Fundit</h3>
          <table class="user-table">
          <thead>
            <tr>
            <th>Emri</th>
            <th>Email</th>
            <th>Roli</th>
            <th>Regjistruar</th>
            </tr>
          </thead>
          <tbody>
            ${
              latestUsers.length
                ? latestUsers
                    .map(
                      (u) => `
            <tr>
              <td>${u.first_name || ''} ${u.last_name || ''}</td>
              <td>${u.email || ''}</td>
              <td>${
                u.role ? (u.role === 'trainer' ? 'Trajner' : 'Klient') : ''
              }</td>
              <td>${u.registered || ''}</td>
            </tr>
            `
                    )
                    .join('')
                : `<tr><td colspan="4">Nuk ka te dhena</td></tr>`
            }
          </tbody>
          </table>
        </div>
        <div class="card">
          <h3>Blerjet e Fundit</h3>
          <table class="purchase-table">
          <thead>
            <tr>
            <th>Klienti</th>
            <th>Programi</th>
            <th>Shuma</th>
            <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${
              latestPurchases.length
                ? latestPurchases
                    .map(
                      (p) => `
            <tr>
              <td>${p.client || ''}</td>
              <td>${p.program || ''}</td>
              <td>${p.amount || ''}</td>
              <td>${p.date || ''}</td>
            </tr>
            `
                    )
                    .join('')
                : `<tr><td colspan="4">Nuk ka te dhena</td></tr>`
            }
          </tbody>
          </table>
        </div>
        </div>
      </section>
      </main>
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
        <div class="chatbot-message bot">Pershendetje! Carti, asistenti juaj virtual, si mund tju ndohmoj?</div>
      </div>
      <div id="chatbot-input-area">
        <input type="text" id="chatbot-input" placeholder="Ask Carti...">
        <button id="chatbot-send-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg></button>
      </div>
      </div>
      <footer>
      <p>© ${new Date().getFullYear()} Fitness Pro. Te gjitha te drejtat e rezervuara.</p>
      </footer>
    </div>
    `;
  }

  controller() {
    this.loadAdminData();
    this.addSpecificEventListeners();
    this.setupChatbot();
  }

  async loadAdminData() {
    console.log('Loading admin dashboard data...');
    const token = localStorage.getItem('jwt');
    try {
      const response = await fetch('/pw2425/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok)
        throw new Error('Nuk mund te ngarkohen te dhenat e panelit.');
      const result = await response.json();
      if (!result.success)
        throw new Error(result.message || 'Gabim ne server.');
      // result.data.metrics, result.data.analytics, result.data.latestUsers, result.data.latestPurchases
      // You can now set these as properties and call updateAppView() to re-render with real data
      this.metrics = result.data.metrics;
      this.analytics = result.data.analytics;
      this.latestUsers = result.data.latestUsers;
      this.latestPurchases = result.data.latestPurchases;
      this.updateAppView();
    } catch (err) {
      const errorDiv = document.getElementById('dashboard-error');
      if (errorDiv) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = '';
      }
    }
  }

  updateAppView() {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = this.render();
      this.addSpecificEventListeners();
      this.setupChatbot();
    }
  }

  addSpecificEventListeners() {
    const navLogoutBtn = document.getElementById('dashboard-logout-btn-nav');
    if (navLogoutBtn) {
      navLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        AuthService.logout();
        router.navigate('/login');
      });
    }

    const systemSettingsForm = document.getElementById('systemSettingsForm');
    const systemSettingsMessageArea = document.getElementById(
      'system-settings-message-area'
    );
    if (systemSettingsForm && systemSettingsMessageArea) {
      systemSettingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        systemSettingsMessageArea.textContent = 'Saving system settings...';
        systemSettingsMessageArea.style.color = 'var(--text)';
        setTimeout(() => {
          systemSettingsMessageArea.textContent =
            'System settings updated successfully!';
          systemSettingsMessageArea.style.color = 'green';
        }, 1000);
      });
    }

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
        '#admin-dashboard-page-container a[data-link]:not([data-link-internal])'
      )
      .forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          router.navigate(link.getAttribute('href'));
        });
      });
  }
}
