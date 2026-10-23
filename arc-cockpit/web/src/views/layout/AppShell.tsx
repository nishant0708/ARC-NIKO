import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChartIcon,
  ExclamationTriangleIcon,
  LayersIcon,
  MoonIcon,
  PersonIcon,
  Share1Icon,
  SunIcon,
  TargetIcon,
} from '@radix-ui/react-icons';
import { useOptions } from '@/controllers/useFilters';
import { useTheme } from '@/controllers/useTheme';
import { Badge } from '@/views/ui/badge';
import { Button } from '@/views/ui/button';
import { DrillSheet } from '@/views/components/DrillSheet';
import { cn } from '@/lib/utils';
import { FilterBar } from './FilterBar';

export const SCREENS: { path: string; label: string; icon: typeof BarChartIcon }[] = [
  { path: '/executive', label: 'Executive', icon: BarChartIcon },
  { path: '/client-managers', label: 'Client Managers', icon: PersonIcon },
  { path: '/pipeline', label: 'Pipeline Health', icon: LayersIcon },
  { path: '/cm360', label: 'CM360 · Win/Loss', icon: TargetIcon },
  { path: '/exceptions', label: 'Exceptions', icon: ExclamationTriangleIcon },
];

export function AppShell() {
  const { data } = useOptions();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the URL in the address bar is still shareable */
    }
  };

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <header className="border-b bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div aria-hidden className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              A
            </div>
            <div>
              <p className="text-[15px] font-semibold leading-tight">ARC Cockpit</p>
              <p className="text-xs text-muted-foreground">CRM management analytics</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {data && <Badge>Data as of {data.options.asOf}</Badge>}
            <Badge variant="medium">Targets: sample goals</Badge>
            <Button variant="outline" size="sm" onClick={toggle} aria-pressed={theme === 'dark'}>
              {theme === 'dark' ? <SunIcon aria-hidden /> : <MoonIcon aria-hidden />}
              Dark mode
            </Button>
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Share1Icon aria-hidden />
              {copied ? 'Link copied' : 'Copy link to this view'}
            </Button>
            <span role="status" className="sr-only">
              {copied ? 'Link copied to clipboard' : ''}
            </span>
          </div>
        </div>
        <div className="px-6 pb-4">
          <FilterBar />
        </div>
      </header>

      <div className="flex flex-wrap items-start">
        <nav aria-label="Cockpit screens" className="flex w-full flex-col gap-0.5 p-3 md:w-[230px] md:shrink-0">
          {SCREENS.map((s) => (
            <NavLink
              key={s.path}
              to={{ pathname: s.path, search: location.search }}
              className={({ isActive }) =>
                cn(
                  'flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground/75 hover:bg-muted hover:text-foreground',
                  isActive && 'bg-muted font-semibold text-foreground',
                )
              }
            >
              <s.icon className="size-4" aria-hidden />
              {s.label}
            </NavLink>
          ))}
          <p className="mt-4 px-2.5 text-xs leading-relaxed text-muted-foreground">
            Select any figure to see the records behind it, with the governing date and exclusions.
          </p>
        </nav>
        <main id="main" tabIndex={-1} className="flex min-w-0 max-w-[1280px] flex-[999_1_560px] flex-col gap-4 px-6 pb-12 pt-5 outline-none">
          <Outlet />
        </main>
      </div>
      <DrillSheet />
    </div>
  );
}
