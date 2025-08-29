import { router } from '../router.js'; // Import router for navigation links

export default class ForgotPasswordView {
  render() {
    // Use the structure from ForgotPasswordPage.html, adapted for the view
    return `<div id="forgot-password-page-container" class="page-container">
        <header>
            <h1>Fitness Pro</h1>
            <p>Rivendos Fjalekalimin Tend</p>
        </header>
        <main>
            <section class="forgot-password-form-section"> 
                <h2>Nderro Fjalekalimin</h2>
                <form id="forgotPasswordForm">
                    <div class="form-group">
                        <label for="forgot-email">Email</label>
                        <input type="email" id="forgot-email" name="email" placeholder="Shkruani email-in tuaj" required>
                    </div>
                    <button type="submit" class="btn btn-primary reset-btn">Dergo Link</button>
                    <div id="forgot-message-area" class="message-area"></div> 
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
    const form = document.getElementById('forgotPasswordForm');
    const messageArea = document.getElementById('forgot-message-area');
    const emailInput = document.getElementById('forgot-email');
    const submitButton = form
      ? form.querySelector('button[type="submit"]')
      : null;

    if (form && emailInput && messageArea && submitButton) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageArea.textContent = 'Sending request...';
        messageArea.style.color = 'black';
        submitButton.disabled = true;
        const email = emailInput.value;

        try {
          const response = await fetch('/pw2425/api/auth/request-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email }),
          });

          let result = {};
          try {
            result = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse response JSON:', jsonError);
            result = {
              success: false,
              message: 'Received an invalid response from the server.',
            };
          }

          if (response.ok && result.success) {
            messageArea.textContent =
              result.data?.message ||
              'Request successful. Please check your email.';
            messageArea.style.color = 'green';
            emailInput.value = '';
          } else {
            messageArea.textContent = `Error: ${
              result.message || 'Failed to send reset link. Please try again.'
            }`;
            messageArea.style.color = 'red';
          }
        } catch (error) {
          console.error('Forgot Password Fetch Network Error:', error);
          messageArea.textContent =
            'Network error. Please check your connection and try again.';
          messageArea.style.color = 'red';
        } finally {
          submitButton.disabled = false;
        }
      });
    } else {
      console.error(
        'ForgotPasswordView: Could not find essential form elements'
      );
    }

    document
      .querySelector('a[data-link][href="/pw2425/login"]')
      ?.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('/pw2425/login');
      });
  }
}
