import AuthService from './services/AuthService.js';
import HomeView from './views/HomeView.js';
import SignupView from './views/SignupView.js';
import LoginView from './views/LoginView.js';
import NotFoundView from './views/NotFoundView.js';
import AdminDashboardView from './views/AdminDashboardView.js';
import TrainerDashboardView from './views/TrainerDashboardView.js';
import ClientDashboardView from './views/ClientDashboardView.js';
import ForgotPasswordView from './views/ForgotPasswordView.js';
import ResetPasswordView from './views/ResetPasswordView.js';
import ProfileView from './views/ProfileView.js';
import TrainingProgramView from './views/TrainingProgramView.js';

class Router {
  constructor(routes) {
    this.routes = routes;
    this.basePath = '/pw2425';
  }

  init() {
    window.addEventListener('popstate', () => this.route());
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.route());
    } else {
      this.route();
    }
  }

  _stripBasePath(pathname) {
    if (pathname.startsWith(this.basePath)) {
      let subPath = pathname.substring(this.basePath.length);
      return subPath.startsWith('/') ? subPath : '/' + subPath;
    }
    return pathname;
  }

  async route() {
    const relativePath = this._stripBasePath(window.location.pathname) || '/';
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      console.error('Router Error');
      return;
    }
    appContainer.innerHTML = 'Loading...'; // Provide loading feedback

    let params = {};
    const matchedRoute = this.routes.find((route) => {
      if (!route.path.includes(':') && route.path === relativePath) {
        return true;
      }
      if (route.path.includes(':')) {
        const routeParts = route.path.split('/');
        const pathParts = relativePath.split('/');
        if (routeParts.length !== pathParts.length) {
          return false;
        }
        params = {};
        for (let i = 0; i < routeParts.length; i++) {
          if (routeParts[i].startsWith(':')) {
            params[routeParts[i].substring(1)] = pathParts[i];
          } else if (routeParts[i] !== pathParts[i]) {
            return false;
          }
        }
        return true;
      }
      return false;
    });

    const routeToRender =
      matchedRoute || this.routes.find((r) => r.path === '404');

    if (!routeToRender) {
      console.error('Router Error: No route match and no 404 route defined.');
      appContainer.innerHTML = '<h2>Error: Page Configuration Problem.</h2>';
      return;
    }

    // Route Guard Logic
    if (routeToRender.requiresAuth) {
      const userRole = await AuthService.getCurrentUserRole();
      if (!userRole) {
        this.navigate('/login');
        return; 
      }
      if (
        routeToRender.allowedRoles &&
        !routeToRender.allowedRoles.includes(userRole)
      ) {
        this.navigate('/'); 
        return; 
      }
    }

    // Render View
    try {
      const view = routeToRender.view(params);
      if (typeof view.render !== 'function') {
        throw new Error(
          `View for path '${routeToRender.path}' is missing a render method.`
        );
      }
      const html = await Promise.resolve(view.render());
      appContainer.innerHTML = html;

      if (typeof view.controller === 'function') {
        view.controller();
      }
    } catch (err) {
      console.error(`Error rendering view for path '${relativePath}':`, err);
      appContainer.innerHTML = '<h2>Error loading page content.</h2>';
    }
  }

  navigate(path) {
    const fullPath = path.startsWith(this.basePath)
      ? path
      : this.basePath + path;
    if (window.location.pathname !== fullPath || window.location.hash) {
      // Avoid pushing same state
      window.history.pushState({}, '', fullPath);
    }
    this.route(); // Process the new route
  }
}

const routes = [
  { path: '/', view: () => new HomeView() },
  { path: '/login', view: () => new LoginView() },
  { path: '/signup', view: () => new SignupView() },
  { path: '/profile', view: () => new ProfileView(), requiresAuth: true },
  { path: '/forgot-password', view: () => new ForgotPasswordView() },
  {
    path: '/reset-password/:token',
    view: (params) => {
      const view = new ResetPasswordView();
      if (params && params.token && typeof view.setToken === 'function') {
        view.setToken(params.token);
      }
      return view;
    },
  },
  {
    path: '/dashboard/admin',
    view: () => new AdminDashboardView('admin'),
    requiresAuth: true,
    allowedRoles: ['admin'],
  },
  {
    path: '/dashboard/trainer',
    view: () => new TrainerDashboardView('trainer'),
    requiresAuth: true,
    allowedRoles: ['trainer', 'admin'],
  },
  {
    path: '/programs',
    view: () => new TrainingProgramView(),
    requiresAuth: false,
  },
  {
    ///dashboard/clien_id=
    path: '/dashboard/client',
    view: () => new ClientDashboardView('client'),
    requiresAuth: true,
    allowedRoles: ['client', 'trainer', 'admin'],
  },
  { path: '404', view: () => new NotFoundView() },
];

export const router = new Router(routes);
