import { router } from './router.js';
import AuthService from './services/AuthService.js';

document.addEventListener('DOMContentLoaded', async () => {
  await initApp();
});

async function initApp() {
  const user = await verifyAuth();
  const pathsToRedirectFromIfAuthenticated = [
    '/', // If your homepage should redirect to dashboard if logged in
    '/index.html',
    '/login',
    '/signup',
    '/forgot-password',

  ];
  const currentPath = window.location.pathname.replace('/pw2425', '');

  if (user && pathsToRedirectFromIfAuthenticated.includes(currentPath)) {
    redirectToRoleDashboard(user);
  }

  router.init();
  setupGlobalListeners();
}

async function verifyAuth() {
  const token = localStorage.getItem('jwt');
  if (!token) return null;

  try {
    const payload = await AuthService.verifyToken(token);
    if (payload && payload.success && payload.data) {
      return payload.data; 
    } else {
      localStorage.removeItem('jwt');
      return null;
    }
  } catch (error) {
    console.error('verifyAuth error:', error);
    localStorage.removeItem('jwt');
    return null;
  }
}

// Redirect to role-specific dashboard
function redirectToRoleDashboard(user) {
  let dashboardPath = '';
  switch (user.role) {
    case 'admin':
      dashboardPath = `/dashboard/admin?user_id=${user.id}`;
      break;
    case 'trainer':
      dashboardPath = `/dashboard/trainer?user_id=${user.id}`;
      break;
    default:
      dashboardPath = `/dashboard/client?user_id=${user.id}`;
      break;
  }
  router.navigate(dashboardPath);
}

// (logout, theme, etj.)
function setupGlobalListeners() {
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    AuthService.logout();
    router.navigate('/login');
  });
}
