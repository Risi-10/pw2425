import DashboardView from './DashboardView.js';
import { router } from '../router.js';
import AuthService from '../services/AuthService.js';

export default class TrainerDashboardView extends DashboardView {
  constructor() {
    super();
    this.clients = [];
    this.programs = [];
    this.programFormError = '';
    this.programFormSuccess = '';
  }

  async fetchClients() {
    const token = localStorage.getItem('jwt');
    try {
      const response = await fetch(
        `/pw2425/api/trainers/${this.userId}/clients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Nuk mund te ngarkohen klientet.');
      const result = await response.json();
      this.clients = result.data || [];
    } catch (err) {
      this.clients = [];
    }
  }

  async fetchPrograms() {
    const token = localStorage.getItem('jwt');
    try {
      const response = await fetch(
        `/pw2425/api/programs?trainer_id=${this.userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error('Nuk mund te ngarkohen programet.');
      const result = await response.json();
      this.programs = result.data || [];
    } catch (err) {
      this.programs = [];
    }
  }

  async controller() {
    await this.fetchClients();
    await this.fetchPrograms();
    this.updateAppView();
    this.addSpecificEventListeners();
    this.setupChatbot();
  }

  renderClientsTable() {
    if (!this.clients.length) {
      return `<div class="no-clients-message">Nuk keni kliente aktive.</div>`;
    }
    return `
    <div class="card">
      <h3>Klientet Aktive</h3>
      <table class="client-table">
        <thead>
          <tr>
            <th>Emri</th>
            <th>Email</th>
            <th>Programi</th>
            <th>Cmimi</th>
          </tr>
        </thead>
        <tbody>
          ${this.clients
            .map(
              (c) => `
            <tr>
              <td>${c.first_name || ''} ${c.last_name || ''}</td>
              <td>${c.email || ''}</td>
              <td>${c.program_title || '-'}</td>
              <td>${
                c.program_price
                  ? c.program_price + ' ' + (c.currency || '')
                  : '-'
              }</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
  }

  renderProgramsList() {
    if (!this.programs.length) {
      return `<div class="no-programs-message">Nuk keni programe te krijuara.</div>`;
    }
    return `
  <h4>Programet e Krijuara</h4>
  <ul class="item-list" id="existing-programs-list">
    ${this.programs
      .map(
        (p) => `
      <li data-program-id="${p.program_id}">
        <div class="program-info">
          <strong>${p.title}</strong> (${p.duration_weeks} jave) - ${p.price} ${p.currency}
        </div>
        <div class="program-actions">
          <a href="/pw2425/programs?program_id=${p.program_id}" class="action-link btn btn-secondary btn-sm" data-link>Shiko</a>
          <button class="btn btn-danger btn-sm delete-program-btn" data-program-id="${p.program_id}">Fshi</button>
        </div>
      </li>
    `
      )
      .join('')}
  </ul>
`;
  }

  render() {
    const profileLink = `/pw2425/profile?user_id=${this.userId}`;
    return `
      <div id="trainer-dashboard-page-container" class="page-container dashboard-page-container">
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
            <h2>Paneli i Trajnerit</h2>
            <div id="dashboard-error" class="message-area error" style="display: none"></div>
            <div class="dashboard-content">
              ${this.renderClientsTable()}
              <div class="card">
                <h3>Krijo Program Stervitor</h3>
                <form id="trainingProgramForm" enctype="multipart/form-data">
                  <div class="form-group">
                    <label for="program-title">Titulli</label>
                    <input type="text" id="program-title" name="title" required>
                  </div>
                  <div class="form-group">
                    <label for="program-description">Pershkrimi</label>
                    <textarea id="program-description" name="description" required></textarea>
                  </div>
                  <div class="form-group">
                    <label for="program-duration">Kohezgjatja (jave)</label>
                    <input type="number" id="program-duration" name="duration_weeks" min="1" required>
                  </div>
                  <div class="form-group">
                    <label for="program-price">Cmimi</label>
                    <input type="number" id="program-price" name="price" min="0" step="0.01" required>
                  </div>
                  <div class="form-group">
                    <label for="program-currency">Monedha</label>
                    <select id="program-currency" name="currency" required>
                      <option value="EUR">EUR</option>
                      <option value="ALL">ALL</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="program-img">Foto Programi</label>
                    <input type="file" id="program-img" name="program_img" accept="image/*" required>
                  </div>
                  <div class="form-group">
                    <label for="program-pdf">PDF i Programit</label>
                    <input type="file" id="program-pdf" name="program_pdf" accept="application/pdf">
                  </div>
                  <button type="submit" class="btn btn-primary create-btn">Krijo Program</button>
                  <div id="program-message-area" class="message-area">
                    ${
                      this.programFormError
                        ? `<span class="error">${this.programFormError}</span>`
                        : ''
                    }
                    ${
                      this.programFormSuccess
                        ? `<span class="success">${this.programFormSuccess}</span>`
                        : ''
                    }
                  </div>
                </form>
                ${this.renderProgramsList()}
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
            <div class="chatbot-message bot">Pershendetje! Carti asistenti juaj inteligjent, si mund tju ndihmoj?</div>
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

  updateAppView() {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = this.render();
      this.addSpecificEventListeners();
    }
  }

  addSpecificEventListeners() {
    // Logout
    const navLogoutBtn = document.getElementById('dashboard-logout-btn-nav');
    if (navLogoutBtn) {
      navLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        AuthService.logout();
        router.navigate('/login');
      });
    }

    // Program creation form
    const programForm = document.getElementById('trainingProgramForm');
    const programMessageArea = document.getElementById('program-message-area');
    if (programForm && programMessageArea) {
      programForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        programMessageArea.textContent = 'Duke krijuar programin...';
        const formData = new FormData(programForm);
        formData.append('trainer_user_id', this.userId);

        try {
          const token = localStorage.getItem('jwt');
          const response = await fetch('/pw2425/api/programs', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const result = await response.json();
          if (response.ok && result.success) {
            programMessageArea.textContent = 'Programi u krijua me sukses!';
            programMessageArea.style.color = 'green';
            await this.fetchPrograms();
            this.updateAppView();
          } else {
            programMessageArea.textContent =
              result.message || 'Gabim gjate krijimit te programit.';
            programMessageArea.style.color = 'red';
          }
        } catch (err) {
          programMessageArea.textContent = 'Gabim gjate krijimit te programit.';
          programMessageArea.style.color = 'red';
        }
      });
    }

    document.querySelectorAll('.delete-program-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const programId = btn.getAttribute('data-program-id');
        if (!programId) return;
        if (!confirm('Jeni i sigurt qe doni te fshini kete program?')) return;

        try {
          const token = localStorage.getItem('jwt');
          const response = await fetch(`/pw2425/api/programs/${programId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          const result = await response.json();
          if (response.ok && result.success) {
            // Remove from UI
            await this.fetchPrograms();
            this.updateAppView();
          } else {
            alert(result.message || 'Gabim gjate fshirjes se programit.');
          }
        } catch (err) {
          alert('Gabim gjate fshirjes se programit.');
        }
      });
    });

    // SPA navigation
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
        '#trainer-dashboard-page-container a[data-link]:not([data-link-internal])'
      )
      .forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          router.navigate(link.getAttribute('href'));
        });
      });
  }
}
