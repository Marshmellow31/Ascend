// Central route model used by the sidebar, bottom nav, and command palette.
export const ROUTES = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', primary: true },
  { id: 'tasks',     label: 'Tasks',     icon: 'check-square',     primary: true },
  { id: 'calendar',  label: 'Calendar',  icon: 'calendar-days' },
  { id: 'focus',     label: 'Focus',     icon: 'timer',           primary: true },
  { id: 'analytics', label: 'Analytics', icon: 'pie-chart' },
  { id: 'profile',   label: 'Profile',   icon: 'trophy',          primary: true },
  { id: 'settings',  label: 'Settings',  icon: 'settings' },
];

export const PRIMARY_ROUTES = ROUTES.filter((r) => r.primary);

export function routeLabel(id) {
  return ROUTES.find((r) => r.id === id)?.label || 'Ascend';
}
