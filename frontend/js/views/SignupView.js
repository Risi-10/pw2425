import AuthService from '../services/AuthService.js';
import { router } from '../router.js';

export default class SignupView {
  render() {
    return `
      <div id="signup-page-container" class="page-container">
        <header>
            <a href="/pw2425/">
            <h1>Fitness Pro</h1>
            </a>
            <p>Regjistrohu per te Nisur Udhetimin Tend te Fitnesit</p>
        </header>
        <main>
            <section class="signup-form-section">
                <h2>Regjistrohu</h2>
                <form id="signupForm">
                    <div class="form-group">
                        <label for="first-name">Emri</label>
                        <input type="text" id="first-name" name="first-name" placeholder="Shkruani emrin tuaj" required>
                    </div>
                    <div class="form-group">
                        <label for="last-name">Mbiemri</label>
                        <input type="text" id="last-name" name="last-name" placeholder="Shkruani mbiemrin tuaj" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" placeholder="Shkruani email-in tuaj" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Fjalekalimi</label>
                        <input type="password" id="password" name="password" placeholder="Shkruani fjalekalimin tuaj" required minlength="8">
                    </div>
                    <div class="form-group">
                        <label for="role">Roli</label>
                        <select id="role" name="role" required>
                            <option value="" disabled selected>Zgjidh rolin tend</option>
                            <option value="client">Klient</option>
                            <option value="trainer">Trajner</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary signup-btn">Sign up</button>
                    <div id="signup-message-area" class="message-area"></div> 
                </form>
                <div class="form-links">
                    <p>Keni nje llogari? <a href="/pw2425/login" class="link" data-link>Hyr</a></p>
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
    const signupForm = document.getElementById('signupForm');
    const messageArea = document.getElementById('signup-message-area');

    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (messageArea) messageArea.textContent = '';

        const firstNameInput = document.getElementById('first-name');
        const lastNameInput = document.getElementById('last-name');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const roleSelect = document.getElementById('role');
        const submitButton = signupForm.querySelector('button[type="submit"]');

        const firstName = firstNameInput.value;
        const lastName = lastNameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        const role = roleSelect.value;

        if (!firstName || !lastName) {
          if (messageArea) {
            messageArea.textContent = 'Please enter both first and last name.';
            messageArea.className = 'message-area error';
          }
          return;
        }
        if (!role) {
          if (messageArea) {
            messageArea.textContent = 'Please select a role.';
            messageArea.className = 'message-area error';
          }
          return;
        }
        if (password.length < 8) {
          if (messageArea) {
            messageArea.textContent =
              'Password must be at least 8 characters long.';
            messageArea.className = 'message-area error';
          }
          return;
        }

        if (submitButton) submitButton.disabled = true;
        if (messageArea) {
          messageArea.textContent = 'Signing up...';
          messageArea.className = 'message-area info';
        }

        try {
          // Pass firstName and lastName to AuthService.signup
          const response = await AuthService.signup(
            firstName,
            lastName,
            email,
            password,
            role
          );

          if (response.success) {
            if (messageArea) {
              messageArea.textContent =
                'Signup successful! Redirecting to login...';
              messageArea.className = 'message-area success';
            }
            setTimeout(() => {
              router.navigate('/pw2425/login');
            }, 1000);
          } else {
            if (messageArea) {
              messageArea.textContent =
                response.message || 'Signup failed. Please try again.';
              messageArea.className = 'message-area error';
            }
            if (submitButton) submitButton.disabled = false;
          }
        } catch (error) {
          if (messageArea) {
            if (error.message && error.message.includes('already exists')) {
              messageArea.textContent =
                'An account with this email already exists. Please try logging in.';
            } else {
              messageArea.textContent = `Signup failed: ${
                error.message || 'An unknown error occurred.'
              }`;
            }
            messageArea.className = 'message-area error';
          }
          if (submitButton) submitButton.disabled = false;
        }
      });
    } else {
      console.error('Signup form element (#signupForm) not found');
    }

    document
      .querySelector('a[data-link][href="/pw2425/login"]')
      ?.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/pw2425/login');
      });
  }
}
