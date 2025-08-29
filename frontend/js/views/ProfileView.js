import DashboardView from './DashboardView.js';
import AuthService from '../services/AuthService.js';
import { router } from '../router.js';

export default class ProfileView extends DashboardView {
  constructor() {
    super();
    this.isEditingBio = false;
    this.isEditingName = false;
  }

  render() {
    if (!this.userData) {
      return `<div class="loading-message">Duke ngarkuar te dhenat e profilit...</div>`;
    }

    const userName = `${this.userData.first_name || ''} ${
      this.userData.last_name || ''
    }`.trim();
    const userEmail = this.userData.email || 'N/A';
    const userId = this.userData.user_id;
    const userRole = this.userData.role;
    const userBio = this.userData.bio || '';
    const profilePictureUrl =
      this.userData.profile_picture_url ||
      '/pw2425/frontend/assets/logo-pw.png';

    return /*html*/ `
      <div id="profile-page-container" class="page-container dashboard-page-container">
        <header>
          <h1>Fitness Pro</h1>       
          <nav>
            <ul>
              <li><a href="/pw2425/${
                userId ? `?user_id=${userId}` : ''
              }" data-link>Kreu</a></li>
              <li><a href="/pw2425/dashboard/${
                userRole === 'admin'
                  ? 'admin'
                  : userRole === 'trainer'
                  ? 'trainer'
                  : 'client'
              }${
      userId ? `?user_id=${userId}` : ''
    }" class="dashboard-link" data-link>Paneli</a></li>
              <li><a href="#" id="profile-logout-btn-nav" class="nav-link">Dil</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <section class="dashboard-section profile-section">
            <h2>Profili Im</h2>
            <div id="profile-message-area" class="message-area" style="display: none;"></div>

            <div class="profile-content">
              <div class="card profile-image-card">
                <h3>Foto Profili</h3>
                <div class="profile-image-container">
                  <img id="profile-image-preview" src="${profilePictureUrl}" alt="Foto Profili" class="profile-image-display">
                </div>
                <form id="profileImageForm" class="form-section">
                  <div class="form-group">
                    <label for="profile-image-upload">Ndrysho Foton:</label>
                    <input type="file" id="profile-image-upload" name="profile_picture" accept="image/*">
                  </div>
                  <button type="submit" id="save-profile-image-btn" class="btn btn-primary btn-sm">Ruaj Foton</button>
                  <div id="profile-image-message-area" class="message-area" style="display:none;"></div>
                </form>
              </div>

              <div class="card profile-details-card">
                <h3>Detajet Personale</h3>
                <div class="profile-info-item">
                  <strong>Email:</strong> <span id="profile-email-display">${userEmail}</span>
                </div>
                <div class="profile-info-item">
                  <strong>Roli:</strong> <span id="profile-role-display">${userRole}</span>
                </div>

                <div id="name-display-section" class="profile-info-item ${
                  this.isEditingName ? 'hidden' : ''
                }">
                  <strong>Emri:</strong> <span id="profile-name-display">${userName}</span>
                  <button id="edit-name-btn" class="btn btn-sm btn-outline">Ndrysho Emrin</button>
                </div>
                <div id="name-edit-section" class="form-section ${
                  this.isEditingName ? '' : 'hidden'
                }">
                  <div class="form-group">
                    <label for="profile-first-name">Emri:</label>
                    <input type="text" id="profile-first-name" value="${
                      this.userData?.first_name || ''
                    }">
                  </div>
                  <div class="form-group">
                    <label for="profile-last-name">Mbiemri:</label>
                    <input type="text" id="profile-last-name" value="${
                      this.userData?.last_name || ''
                    }">
                  </div>
                  <button id="save-name-btn" class="btn btn-primary btn-sm">Ruaj Emrin</button>
                  <button id="cancel-name-btn" class="btn btn-secondary btn-sm">Anulo</button>
                  <div id="name-change-message-area" class="message-area" style="display:none;"></div>
                </div>
              </div>

              <div class="card profile-bio-card">
                <h3>Bio</h3>
                <div id="bio-display-section" class="${
                  this.isEditingBio ? 'hidden' : ''
                }">
                  <p id="profile-bio-display">${
                    userBio || 'Ju lutem shtoni nje bio.'
                  }</p>
                  <button id="edit-bio-btn" class="btn btn-sm btn-outline">Ndrysho Biografine</button>
                </div>
                <div id="bio-edit-section" class="form-section ${
                  this.isEditingBio ? '' : 'hidden'
                }">
                  <textarea id="profile-bio-input" rows="5" placeholder="Shkruani biografine tuaj...">${userBio}</textarea>
                  <button id="save-bio-btn" class="btn btn-primary btn-sm">Ruaj Biografine</button>
                  <button id="cancel-bio-btn" class="btn btn-secondary btn-sm">Anulo</button>
                  <div id="bio-change-message-area" class="message-area" style="display:none;"></div>
                </div>
              </div>

              <div class="card profile-password-card">
                <h3>Ndrysho Fjalekalimin</h3>
                <form id="changePasswordForm" class="form-section">
                  <div class="form-group">
                    <label for="current-password">Fjalekalimi Aktual:</label>
                    <input type="password" id="current-password" name="current_password" required>
                  </div>
                  <div class="form-group">
                    <label for="new-password">Fjalekalimi i Ri:</label>
                    <input type="password" id="new-password" name="new_password" required minlength="8">
                  </div>
                  <div class="form-group">
                    <label for="confirm-password">Konfirmo Fjalekalimin e Ri:</label>
                    <input type="password" id="confirm-password" name="confirm_password" required minlength="8">
                  </div>
                  <button type="submit" class="btn btn-primary">Ndrysho Fjalekalimin</button>
                  <div id="password-change-message-area" class="message-area" style="display:none;"></div>
                </form>
              </div>

              <div class="card profile-delete-account-card">
                <h3>Fshij Llogarine</h3>
                <p class="warning-text">Ky veprim eshte i pakthyeshem. Te gjitha te dhenat tuaja do te fshihen pergjithmone.</p>
                <form id="deleteAccountForm" class="form-section">
                    <div class="form-group">
                        <label for="delete-confirm-password">Konfirmo Fjalekalimin:</label>
                        <input type="password" id="delete-confirm-password" name="delete_confirm_password" required placeholder="Fjalekalimi juaj aktual">
                    </div>
                    <button type="submit" id="delete-account-btn" class="btn btn-danger">Fshij Llogarine Time</button>
                    <div id="delete-account-message-area" class="message-area" style="display:none;"></div>
                </form>
              </div>
            </div>
          </section>
        </main>
        ${this.renderChatbot()}
        <footer>
          <p>© ${new Date().getFullYear()} Fitness Pro. Te gjitha te drejtat e rezervuara.</p>
        </footer>
      </div>
    `;
  }

  renderChatbot() {
    return `
        <div id="chatbot-icon" title="Chat with Carti">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
        </div>
        <div id="chatbot-window" class="chatbot-hidden">
          <div id="chatbot-header">
            <div class="chatbot-profile-pic-container"><img src="https://i1.sndcdn.com/artworks-UjoUqLDmPimCK3ui-OKGVow-t500x500.jpg" alt="Carti"><span class="online-indicator"></span></div>
            <span>Carti</span><button id="chatbot-close-btn">&times;</button>
          </div>
          <div id="chatbot-messages"><div class="chatbot-message bot">Si mund t'ju ndihmoj me profilin tuaj?</div></div>
          <div id="chatbot-input-area"><input type="text" id="chatbot-input" placeholder="Ask Carti..."><button id="chatbot-send-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div>
        </div>
    `;
  }

  async controller() {
    await super.loadUserData();
    if (!this.userData) {
      this.displayError(
        'Nuk mund te ngarkoheshin te dhenat e profilit. Ju lutemi provoni perseri.'
      );
      return;
    }
    this.updateAppView();
    this.updateDashboardLink();
    this.populateProfileData();
    this.addEventListeners();
    super.setupChatbot();
  }

  updateDashboardLink() {
    const dashboardLink = document.getElementById('dashboard-link');
    if (dashboardLink && this.userData && this.userData.role) {
      let path = '/pw2425/dashboard/client';
      if (this.userData.role === 'admin') path = '/pw2425/dashboard/admin';
      else if (this.userData.role === 'trainer')
        path = '/pw2425/dashboard/trainer';
      dashboardLink.setAttribute(
        'href',
        `${path}?user_id=${this.userData.user_id}`
      );
    }
  }

  updateAppView() {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = this.render();
      this.addEventListeners();
      if (typeof this.setupChatbot === 'function') {
        this.setupChatbot();
      }
    }
  }

  populateProfileData() {
    if (!this.userData) return;

    document.getElementById('profile-email-display').textContent =
      this.userData.email || 'N/A';
    document.getElementById('profile-role-display').textContent =
      (this.userData.role || 'N/A').charAt(0).toUpperCase() +
      (this.userData.role || 'N/A').slice(1);
    document.getElementById('profile-name-display').textContent =
      `${this.userData.first_name || ''} ${
        this.userData.last_name || ''
      }`.trim() || 'Perdorues';
    document.getElementById('profile-first-name').value =
      this.userData.first_name || '';
    document.getElementById('profile-last-name').value =
      this.userData.last_name || '';
    const bioText = this.userData.bio || 'Ju lutem shtoni nje biografi.';
    document.getElementById('profile-bio-display').textContent = bioText;
    document.getElementById('profile-bio-input').value =
      this.userData.bio || '';

    const profileImagePreview = document.getElementById(
      'profile-image-preview'
    );
    if (profileImagePreview) {
      profileImagePreview.src =
        this.userData.profile_picture_url ||
        '/pw2425/frontend/assets/logo-pw.png';
    }
  }

  displayMessage(areaId, message, isSuccess = true) {
    const area = document.getElementById(areaId);
    if (area) {
      area.textContent = message;
      area.className = `message-area ${isSuccess ? 'success' : 'error'}`;
      area.style.display = 'block';
      setTimeout(() => {
        area.style.display = 'none';
        area.textContent = '';
      }, 3000);
    }
  }

  toggleEditState(
    section,
    isEditingFlag,
    editBtnId,
    displaySectionId,
    editSectionId
  ) {
    this[isEditingFlag] = !this[isEditingFlag];
    document.getElementById(editBtnId).textContent = this[isEditingFlag]
      ? 'Anulo'
      : `Ndrysho ${section}`;
    document
      .getElementById(displaySectionId)
      .classList.toggle('hidden', this[isEditingFlag]);
    document
      .getElementById(editSectionId)
      .classList.toggle('hidden', !this[isEditingFlag]);
  }

  addEventListeners() {
    document
      .querySelectorAll('#profile-page-container a[data-link]')
      .forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          router.navigate(link.getAttribute('href'));
        });
      });

    const logoutBtn = document.getElementById('profile-logout-btn-nav');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        AuthService.logout();
        router.navigate('/pw2425/login');
      });
    }

    const profileImageForm = document.getElementById('profileImageForm');
    const profileImageUploadInput = document.getElementById(
      'profile-image-upload'
    );
    const profileImagePreview = document.getElementById(
      'profile-image-preview'
    );

    if (profileImageUploadInput && profileImagePreview) {
      profileImageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            profileImagePreview.src = e.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (profileImageForm) {
      profileImageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        const imageFile = profileImageUploadInput.files[0];

        if (!imageFile) {
          this.displayMessage(
            'profile-image-message-area',
            'Ju lutem zgjidhni nje foto.',
            false
          );
          return;
        }
        formData.append('profile_picture', imageFile);

        try {
          const response = await AuthService.updateProfilePicture(
            this.userData.user_id,
            formData
          );
          this.userData.profile_picture_url = response.data.profile_picture_url;
          profileImagePreview.src = response.data.profile_picture_url;
          this.displayMessage(
            'profile-image-message-area',
            'Foto profili u perditesua me sukses!',
            true
          );
        } catch (error) {
          this.displayMessage(
            'profile-image-message-area',
            `Gabim: ${error.message}`,
            false
          );
        }
      });
    }

    // Name Edit
    document.getElementById('edit-name-btn').addEventListener('click', () => {
      this.isEditingName = true;
      this.rerenderNameSection();
    });
    document.getElementById('cancel-name-btn').addEventListener('click', () => {
      this.isEditingName = false;
      this.rerenderNameSection();
      document.getElementById('profile-first-name').value =
        this.userData.first_name || '';
      document.getElementById('profile-last-name').value =
        this.userData.last_name || '';
    });
    document
      .getElementById('save-name-btn')
      .addEventListener('click', async () => {
        const firstName = document
          .getElementById('profile-first-name')
          .value.trim();
        const lastName = document
          .getElementById('profile-last-name')
          .value.trim();
        if (!firstName || !lastName) {
          this.displayMessage(
            'name-change-message-area',
            'Emri dhe mbiemri nuk mund te jene bosh.',
            false
          );
          return;
        }
        try {
          const response = await AuthService.updateProfile(
            this.userData.user_id,
            {
              first_name: firstName,
              last_name: lastName,
            }
          );
          this.userData.first_name = response.data.user.first_name;
          this.userData.last_name = response.data.user.last_name;
          this.isEditingName = false;
          this.rerenderNameSection();
          document.getElementById(
            'profile-name-display'
          ).textContent = `${this.userData.first_name} ${this.userData.last_name}`;
          this.displayMessage(
            'name-change-message-area',
            'Emri u perditesua me sukses!',
            true
          );
        } catch (error) {
          this.displayMessage(
            'name-change-message-area',
            `Gabim: ${error.message}`,
            false
          );
        }
      });

    // Bio Edit
    document.getElementById('edit-bio-btn').addEventListener('click', () => {
      this.isEditingBio = true;
      this.rerenderBioSection();
    });
    document.getElementById('cancel-bio-btn').addEventListener('click', () => {
      this.isEditingBio = false;
      this.rerenderBioSection();
      document.getElementById('profile-bio-input').value =
        this.userData.bio || '';
    });
    document
      .getElementById('save-bio-btn')
      .addEventListener('click', async () => {
        const bio = document.getElementById('profile-bio-input').value.trim();
        try {
          await AuthService.updateProfile(this.userData.user_id, { bio: bio });
          this.userData.bio = bio;
          this.isEditingBio = false;
          this.rerenderBioSection();
          document.getElementById('profile-bio-display').textContent =
            bio || 'Ju lutem shtoni nje biografi.';
          this.displayMessage(
            'bio-change-message-area',
            'Biografia u perditesua me sukses!',
            true
          );
        } catch (error) {
          this.displayMessage(
            'bio-change-message-area',
            `Gabim: ${error.message}`,
            false
          );
        }
      });

    // Change Password
    const changePasswordForm = document.getElementById('changePasswordForm');
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (newPassword !== confirmPassword) {
        this.displayMessage(
          'password-change-message-area',
          'Fjalekalimet e reja nuk perputhen.',
          false
        );
        return;
      }
      if (newPassword.length < 8) {
        this.displayMessage(
          'password-change-message-area',
          'Fjalekalimi i ri duhet te kete te pakten 8 karaktere.',
          false
        );
        return;
      }

      try {
        await AuthService.changePassword(
          this.userData.user_id,
          currentPassword,
          newPassword
        );
        this.displayMessage(
          'password-change-message-area',
          'Fjalekalimi u ndryshua me sukses!',
          true
        );
        changePasswordForm.reset();
      } catch (error) {
        this.displayMessage(
          'password-change-message-area',
          `Gabim: ${error.message}`,
          false
        );
      }
    });

    const deleteForm = document.getElementById('deleteAccountForm');
    deleteForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const deleteBtn = document.getElementById('delete-account-btn');
      deleteBtn.disabled = true;

      const password = document.getElementById('delete-confirm-password').value;
      const pwInput = document.getElementById('delete-confirm-password');
      console.log(
        '▶︎ delete password field:',
        pwInput,
        'value:',
        pwInput?.value
      );
      if (!password) {
        this.displayMessage(
          'delete-account-message-area',
          'Ju lutem konfirmoni fjalekalimin tuaj.',
          false
        );
        deleteBtn.disabled = false;
        return;
      }

      try {
        const res = await AuthService.deleteAccount(
          this.userData.user_id,
          password
        );
        // display backend’s success message
        this.displayMessage(
          'delete-account-message-area',
          res.message || 'Llogaria u fshi me sukses. Po ridrejtoheni...',
          true
        );

        AuthService.logout();

        //full reload to signup
        setTimeout(() => {
          window.location.href = '/pw2425/signup';
        }, 1500);
      } catch (err) {
        // show error and re-enable button
        this.displayMessage(
          'delete-account-message-area',
          `Gabim: ${err.message}`,
          false
        );
        deleteBtn.disabled = false;
      }
    });
  }

  rerenderNameSection() {
    const nameDisplay = document.getElementById('name-display-section');
    const nameEdit = document.getElementById('name-edit-section');
    if (this.isEditingName) {
      nameDisplay.classList.add('hidden');
      nameEdit.classList.remove('hidden');
    } else {
      nameDisplay.classList.remove('hidden');
      nameEdit.classList.add('hidden');
    }
  }

  rerenderBioSection() {
    const bioDisplay = document.getElementById('bio-display-section');
    const bioEdit = document.getElementById('bio-edit-section');
    if (this.isEditingBio) {
      bioDisplay.classList.add('hidden');
      bioEdit.classList.remove('hidden');
    } else {
      bioDisplay.classList.remove('hidden');
      bioEdit.classList.add('hidden');
    }
  }
}
