/**
 * FSOFT HRMS - Enterprise Client-Side Router & Route Guard Module with Strict RBAC
 */
import { Auth } from './auth.js';
import { showToast } from './toast.js';

// Route definition mapping with strict RBAC rules (4 Clean Roles: Admin, HR, Project Manager, Employee)
const ROUTES = {
  '/login': { view: 'login.html', isPublic: true, roles: [] },
  '/': { view: 'dashboard.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager', 'Employee'] },
  '/dashboard': { view: 'dashboard.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager', 'Employee'] },
  '/employees': { view: 'employees.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager'] },
  '/departments': { view: 'departments.html', isPublic: false, roles: ['Admin', 'HR'] },
  '/positions': { view: 'positions.html', isPublic: false, roles: ['Admin', 'HR'] },
  '/skills': { view: 'skills.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager', 'Employee'] },
  '/projects': { view: 'projects.html', isPublic: false, roles: ['Admin', 'Project Manager'] },
  '/resources': { view: 'resources.html', isPublic: false, roles: ['Admin', 'Project Manager'] },
  '/leave': { view: 'leave.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager', 'Employee'] },
  '/payroll': { view: 'payroll.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager', 'Employee'] },
  '/performance': { view: 'performance.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager', 'Employee'] },
  '/training': { view: 'training.html', isPublic: false, roles: ['Admin', 'HR', 'Employee'] },
  '/recruitment': { view: 'recruitment.html', isPublic: false, roles: ['Admin', 'HR'] },
  '/assets': { view: 'assets.html', isPublic: false, roles: ['Admin', 'HR'] },
  '/notifications': { view: 'notifications.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager', 'Employee'] },
  '/profile': { view: 'profile.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager', 'Employee'] },
  '/settings': { view: 'profile.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager', 'Employee'] },
  '/403': { view: '403.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager', 'Employee'] },
  '/404': { view: '404.html', isPublic: false, roles: ['Admin', 'HR', 'Project Manager', 'Employee'] }
};

export const Router = {
  currentPath: null,
  routeChangeCallbacks: {},

  getUser() {
    if (Auth.currentUser) return Auth.currentUser;
    try {
      return JSON.parse(localStorage.getItem('fsoft_user')) || null;
    } catch (e) {
      return null;
    }
  },

  init(routeCallbacks = {}) {
    this.routeChangeCallbacks = routeCallbacks;

    // Handle browser Forward / Back buttons
    window.addEventListener('popstate', () => {
      this.handleCurrentRoute();
    });

    // Intercept clicks on internal links <a href="/...">
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('/')) {
        const href = link.getAttribute('href');
        e.preventDefault();
        this.navigate(href);
      }
    });

    // Initial route handling
    this.handleCurrentRoute();
  },

  async handleCurrentRoute() {
    const rawPath = window.location.pathname || '/';
    const token = localStorage.getItem('fsoft_token');
    const user = this.getUser();

    // 1. Check if route exists in definition
    if (!ROUTES[rawPath]) {
      if (!token) {
        this.navigate('/login', true);
        return;
      }
      this.currentPath = '/404';
      await this.renderRoute('/404');
      return;
    }

    const path = rawPath;

    // 2. Route Guard: Not authenticated -> Force redirect to /login
    if (!token && path !== '/login') {
      this.navigate('/login', true);
      return;
    }

    // 3. Route Guard: Authenticated user visits /login -> Redirect to /dashboard
    if (token && path === '/login') {
      this.navigate('/dashboard', true);
      return;
    }

    // 4. Strict Route Guard: RBAC permission check -> Redirect to /403 if unauthorized
    const routeConfig = ROUTES[path];
    if (routeConfig && !routeConfig.isPublic && path !== '/403' && path !== '/404') {
      const userRole = user ? user.role : 'Guest';
      if (userRole !== 'Admin') {
        if (!routeConfig.roles || !routeConfig.roles.includes(userRole)) {
          showToast(`Tài khoản "${userRole}" không có quyền truy cập vào: ${path}`, 'warning');
          this.navigate('/403', true);
          return;
        }
      }
    }

    await this.renderRoute(path);
  },

  async navigate(path, replace = false) {
    if (replace) {
      window.history.replaceState({}, '', path);
    } else {
      window.history.pushState({}, '', path);
    }
    await this.handleCurrentRoute();
  },

  async renderRoute(path) {
    const routeConfig = ROUTES[path] || ROUTES['/404'];
    this.currentPath = path;

    const loginRoot = document.getElementById('loginRoot');
    const appShell = document.getElementById('appContainer');
    const appContent = document.getElementById('appContent');

    if (path === '/login') {
      // Show full-screen login, hide app shell
      if (appShell) appShell.style.display = 'none';
      if (loginRoot) {
        loginRoot.style.display = 'flex';
        const html = await this.fetchView('login.html');
        loginRoot.innerHTML = html;
        if (this.routeChangeCallbacks['/login']) {
          this.routeChangeCallbacks['/login']();
        }
      }
      return;
    }

    // Authenticated App View
    if (loginRoot) loginRoot.style.display = 'none';
    if (appShell) appShell.style.display = 'flex';

    // Update active state in Sidebar
    document.querySelectorAll('#sidebarMenu .menu-item').forEach(item => {
      const href = item.querySelector('a')?.getAttribute('href');
      if (href === path || (path === '/' && href === '/dashboard')) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Load View HTML into main content
    if (appContent) {
      const html = await this.fetchView(routeConfig.view);
      appContent.innerHTML = html;

      // Trigger page specific loader callback
      if (this.routeChangeCallbacks[path]) {
        this.routeChangeCallbacks[path]();
      } else if (path === '/' && this.routeChangeCallbacks['/dashboard']) {
        this.routeChangeCallbacks['/dashboard']();
      }
    }
  },

  async fetchView(viewFile) {
    try {
      const res = await fetch(`/views/${viewFile}?v=${Date.now()}`);
      const text = await res.text();
      return text;
    } catch (error) {
      return `<div class="card-title"><h3>Lỗi khi tải trang ${viewFile}</h3></div>`;
    }
  }
};
