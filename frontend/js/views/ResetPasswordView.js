import { router } from '../router.js';

export default class ResetPasswordView {
  constructor() {
    this.token = null;
  }

  setToken(token) {
    this.token = token;
  }

  render() {
    if (!this.token) {
      return `
      <div id="reset-password-page-container" class="page-container" style="text-align: center;">
        <main>
          <p class="message-area error">Error: Invalid or missing password reset link.</p> 
          <p>Please request a new link:</p>
          <a href="/pw2425/forgot-password" class="btn btn-secondary" data-link>Forgot Password</a>
        </main>
      </div>`;
    }
    return `
    <div id="reset-password-page-container" class="page-container">
      <header>
          <a href="/pw2425/">
            <h1>Fitness Pro</h1>
            </a>
          <p>Vendos Fjalekalimin Tend te Ri</p>
      </header>
      <main>
          <section class="reset-password-form-section"> 
              <h2>Vendos Fjalekalim te Ri</h2>
              <form id="resetPasswordForm">
                  <input type="hidden" id="reset-token" value="${this.token}">
                  <div class="form-group">
                      <label for="reset-password">Fjalekalim i Ri</label>
                      <input type="password" id="reset-password" name="password" placeholder="Shkruani fjalekalimin e ri" required minlength="8">
                  </div>
                  <div class="form-group">
                      <label for="reset-password-confirm">Konfirmo Fjalekalimin</label>
                      <input type="password" id="reset-password-confirm" name="confirm-password" placeholder="Konfirmo fjalekalimin e ri" required minlength="8">
                  </div>
                  <button type="submit" class="btn btn-primary reset-btn">Ruaj Fjalekalimin</button>
                  <div id="reset-message-area" class="message-area"></div> 
              </form>
              <div class="form-links"> 
                  <p>Kthehu te <a href="/pw2425/login" class="link" data-link>Login</a></p>
              </div>
          </section>
      </main>
      <footer>
          <p>© ${new Date().getFullYear()} Fitness Pro. Te gjitha te drejtat e rezervuara.</p>
      </footer>
    </div>`;
  }

  controller() {
    this.addEventListeners();
  }

  addEventListeners() {
    // If token wasn't set (psh, direct navigation without token), don't add listeners
    if (!this.token) {
      document
        .querySelector('a[href="/pw2425/forgot-password"]')
        ?.addEventListener('click', (e) => {
          e.preventDefault();
          router.navigate('/pw2425/forgot-password');
        });
      return;
    }

    const form = document.getElementById('resetPasswordForm');
    const messageArea = document.getElementById('reset-message-area');
    const passwordInput = document.getElementById('reset-password');
    const confirmInput = document.getElementById('reset-password-confirm');
    const tokenInput = document.getElementById('reset-token');
    const submitButton = form
      ? form.querySelector('button[type="submit"]')
      : null;

    if (
      !form ||
      !messageArea ||
      !passwordInput ||
      !confirmInput ||
      !tokenInput ||
      !submitButton
    ) {
      console.error(
        'ResetPasswordView: Could not find all required form elements.'
      );
      if (messageArea) {
        messageArea.textContent =
          'Error initializing the form. Please refresh.';
        messageArea.style.color = 'red';
      }
      return;
    }

    // Add form submission listener
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      messageArea.textContent = '';
      const password = passwordInput.value;
      const passwordConfirm = confirmInput.value;
      const token = tokenInput.value;

      if (password !== passwordConfirm) {
        messageArea.textContent = 'Passwords do not match.';
        messageArea.style.color = 'red';
        return;
      }
      if (password.length < 8) {
        messageArea.textContent =
          'Password must be at least 8 characters long.';
        messageArea.style.color = 'red';
        return;
      }

      messageArea.textContent = 'Changing password...';
      messageArea.style.color = 'black';
      submitButton.disabled = true;

      try {
        const response = await fetch('/pw2425/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: token,
            password: password,
            password_confirm: passwordConfirm,
          }),
        });

        let result = {};
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error(
            'Failed to parse reset password response JSON:',
            jsonError
          );
          result = {
            success: false,
            message: 'Received an invalid response from the server.',
          };
        }

        if (response.ok && result.success) {
          messageArea.textContent = `${
            result.data?.message || 'Password reset successfully!'
          } `;
          messageArea.style.color = 'green';

          // Add login link dynamically
          const loginLink = document.createElement('a');
          loginLink.href = '/pw2425/login';
          loginLink.textContent = 'Login';
          loginLink.classList.add('link');
          loginLink.setAttribute('data-link', '');
          messageArea.appendChild(document.createTextNode(' '));
          messageArea.appendChild(loginLink);

          loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            router.navigate('/pw2425/login');
          });

          passwordInput.disabled = true;
          confirmInput.disabled = true;
          submitButton.disabled = true;
        } else {
          messageArea.textContent = `Error: ${
            result.message ||
            'Something went wrong. The link may have expired or the request was invalid.'
          }`;
          messageArea.style.color = 'red';
          submitButton.disabled = false;
        }
      } catch (error) {
        console.error('Reset Password Fetch Network Error:', error);
        messageArea.textContent =
          'Network error. Please check your connection and try again later.';
        messageArea.style.color = 'red';
        submitButton.disabled = false;
      }
    });

    document
      .querySelector('a[href="/pw2425/login"]')
      ?.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/pw2425/login');
      });
  }
}
