import AuthService from '../services/AuthService.js';
import { router } from '../router.js';

export default class LoginView {
  render() {
    return `
      <div id="login-page-container" class="page-container">
        <header>
            <a href="/pw2425/">
            <h1>Fitness Pro</h1>
            </a>
            <p>Log in ne Udhetimin Tuaj te Fitnesit</p>
        </header>
        <main>
            <section class="login-form-section"> 
                <h2>Log in</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <input type="email" id="login-email" name="email" placeholder="Shkruani email-in tuaj" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Fjalekalimi</label>
                        <input type="password" id="login-password" name="password" placeholder="Shkruani fjalekalimin tuaj" required>
                    </div>
                    <button type="submit" class="btn btn-primary login-btn">Hyr</button>
                    <div id="login-message-area" class="message-area"></div> 
                </form>
                <div class="form-links"> 
                    <p>Nuk keni llogari? <a href="/pw2425/signup" class="link" data-link>Regjistrohu</a></p>
                    <p>Keni harruar fjalekalimin? <a href="/pw2425/forgot-password" class="link" data-link>Ndrysho Fjalekalimin</a></p>
                </div>
            </section>
        </main>
        <footer>
            <p>© ${new Date().getFullYear()} Fitness Pro. Te gjitha te drejtat e rezervuara.</p>
        </footer>
      </div>
      `;
  }

  controller() {
    this.addEventListeners();
  }

  addEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const messageArea = document.getElementById('login-message-area');

    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageArea.textContent = '';
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');
        const submitButton = loginForm.querySelector('button[type="submit"]');

        const email = emailInput.value;
        const password = passwordInput.value;

        if (submitButton) submitButton.disabled = true;
        messageArea.textContent = 'Logging in...';
        messageArea.style.color = 'black';

        try {
          const response = await AuthService.login(email, password);
          console.log('Login API Response:', response);

          if (response.success && response.data && response.data.token) {
            messageArea.textContent = 'Login successful! Redirecting...';
            messageArea.style.color = 'green';
            localStorage.setItem('jwt', response.data.token);

            setTimeout(() => {
              window.location.href = '/pw2425/';
            }, 500);
          } else {
            console.error(
              'Login failed based on API response structure:',
              response
            );
            messageArea.textContent =
              (response && !response.success && response.message) ||
              'Login failed. Please check your credentials.';
            messageArea.style.color = 'red';
            if (submitButton) submitButton.disabled = false;
          }
        } catch (error) {
          console.error('Login Catch Error (Network/JSON Parse):', error);
          messageArea.textContent = `Login failed: ${
            error.message || 'A server error occurred.'
          }`;
          messageArea.style.color = 'red';
          if (submitButton) submitButton.disabled = false;
        }
      });
    } else {
      console.error('Login form element (#loginForm) not found');
    }

    // In TrainingProgramView.js addEventListeners()
    const mobileNavToggle = document.querySelector(
      '#program-detail-page .mobile-nav-toggle'
    );
    const minimalNav = document.querySelector(
      '#program-detail-page .minimal-nav'
    );
    if (mobileNavToggle && minimalNav) {
      mobileNavToggle.addEventListener('click', () => {
        minimalNav.classList.toggle('expanded');
      });
    }

    document.querySelectorAll('a[data-link]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = link.getAttribute('href');
        router.navigate(path);
      });
    });
  }
}
