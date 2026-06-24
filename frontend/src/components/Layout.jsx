import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import NotificationBell from './NotificationBell.jsx';
import OrgSwitcher from './OrgSwitcher.jsx';
import CommandPalette from './CommandPalette.jsx';
import Icon from './ui/Icon.jsx';
import BrandLogo from './brand/BrandLogo.jsx';
import BrandMark from './brand/BrandMark.jsx';
import { pageTransition } from '../lib/animations.js';

const NAV = [
  {
    section: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard', end: true }],
  },
  {
    section: 'Manage',
    items: [
      { to: '/clients', label: 'Clients', icon: 'clients' },
      { to: '/products', label: 'Products', icon: 'products' },
      { to: '/inventory', label: 'Inventory', icon: 'inventory' },
    ],
  },
  {
    section: 'Billing',
    items: [
      { to: '/invoices', label: 'Invoices', icon: 'invoices' },
      { to: '/quotes', label: 'Quotes', icon: 'quotes' },
      { to: '/recurring', label: 'Recurring', icon: 'clock' },
      { to: '/payments', label: 'Payments', icon: 'payments' },
      { to: '/expenses', label: 'Expenses', icon: 'wallet' },
      { to: '/reports', label: 'Reports', icon: 'bar-chart' },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/audit', label: 'Audit log', icon: 'inbox' },
      { to: '/settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

function NavItem({ item, collapsed, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors ${
          isActive
            ? 'text-brand-700 dark:text-white'
            : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800/70 dark:hover:text-ink-100'
        } ${collapsed ? 'justify-center' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              className="absolute inset-0 -z-10 rounded-lg bg-brand-50 ring-1 ring-inset ring-brand-200/70 dark:bg-brand-500/15 dark:ring-brand-500/30"
            />
          )}
          {isActive && !collapsed && (
            <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 w-0.5 rounded-full bg-brand-600 shadow-glow-sm dark:bg-brand-400" />
          )}
          <Icon
            name={item.icon}
            className={`h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110 ${
              isActive ? 'text-brand-600 dark:text-brand-300' : ''
            }`}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

function NavGroups({ collapsed, onNavigate }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-0.5">
      {NAV.map((group) => (
        <div key={group.section} className="space-y-1">
          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400 dark:text-ink-500">
              {group.section}
            </p>
          )}
          {group.items.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}

function Brand({ collapsed, onToggle }) {
  return (
    <div className={`mb-5 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-1`}>
      {collapsed ? (
        <button type="button" onClick={onToggle} aria-label="Expand sidebar">
          <BrandMark size={34} animate={false} interactive />
        </button>
      ) : (
        <>
          <Link to="/dashboard" aria-label="SmartInvoice Pro — Dashboard">
            <BrandLogo size={32} animate={false} interactive />
          </Link>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
              aria-label="Collapse sidebar"
            >
              <Icon name="chevrons-left" className="h-[18px] w-[18px]" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar') === 'collapsed');
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem('sidebar', c ? 'expanded' : 'collapsed');
      return !c;
    });
  };

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = (user?.email || '?').slice(0, 2).toUpperCase();

  const UserFooter = ({ collapsed: col }) => (
    <div className="mt-3 border-t border-ink-200 pt-3 dark:border-ink-800">
      {!col && user && (
        <div className="mb-1 flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white shadow-glow-sm">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{user.email}</span>
            {user.role && <span className="block text-xs capitalize text-ink-400">{user.role}</span>}
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={onLogout}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-ink-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 ${col ? 'justify-center' : ''}`}
        title="Sign out"
      >
        <Icon name="logout" className="h-[18px] w-[18px] shrink-0" />
        {!col && <span>Sign out</span>}
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-ink-50 text-ink-900 dark:bg-ink-950 dark:text-ink-100">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <CommandPalette />

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 256 }}
        transition={{ type: 'spring', stiffness: 400, damping: 36 }}
        className="sticky top-0 hidden h-screen flex-col border-r border-ink-200/80 bg-white/95 p-3 backdrop-blur-xl dark:border-ink-800/80 dark:bg-ink-900/80 md:flex"
      >
        <Brand collapsed={collapsed} onToggle={toggleCollapsed} />
        {!collapsed && <OrgSwitcher />}
        <NavGroups collapsed={collapsed} />
        <UserFooter collapsed={collapsed} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', stiffness: 400, damping: 36 }}
              className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900"
            >
              <div className="mb-5 flex items-center justify-between px-1">
                <BrandLogo size={32} animate={false} />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
                  aria-label="Close menu"
                >
                  <Icon name="close" className="h-5 w-5" />
                </button>
              </div>
              <OrgSwitcher />
              <NavGroups onNavigate={() => setMobileOpen(false)} />
              <UserFooter />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink-200/80 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-ink-800/80 dark:bg-ink-950/70 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800 md:hidden"
              aria-label="Open menu"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
            <CommandHint />
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
              aria-label="Toggle theme"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="h-5 w-5" />
            </button>
            <NotificationBell />
          </div>
        </header>

        <main id="main" className="flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto max-w-7xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function CommandHint() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
      className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white/60 px-3 py-1.5 text-sm text-ink-400 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900/60 dark:hover:bg-ink-800"
    >
      <Icon name="search" className="h-4 w-4" />
      <span className="hidden sm:inline">Search or jump to…</span>
      <kbd className="ml-2 hidden rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 dark:border-ink-700 dark:bg-ink-800 sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
