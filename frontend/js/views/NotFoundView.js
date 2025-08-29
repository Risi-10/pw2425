import { router } from '../router.js';

export default class NotFoundView {
  _errorCode = '404';
  _errorMessage = 'Oops! Faqja nuk u gjet.'; 

  render() {
    return `
       <div class="not-found-container"> 
         <div class="not-found__data">
            <span class="error-code">${this._errorCode}</span> 
            <p class="error-message">${this._errorMessage}</p>
            <p class="error-description">Mund te jete zhvendosur, fshire ose ndoshta nuk ka ekzistuar asnjehere.</p>
            <a href="/pw2425/" class="btn btn-primary go-home-btn" data-link>Faqja Kryesore</a>
        </div>
      </div>
      `;
  }

  controller() {
    const goHomeBtn = document.querySelector('.go-home-btn[data-link]');
    if (goHomeBtn) {
      goHomeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate(goHomeBtn.getAttribute('href'));
      });
    }
    console.log('NotFoundView controller activated.');
  }
}
