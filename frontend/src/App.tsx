import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import i18n from './i18n';
import { renderMarkup, state as legacyState } from './legacyMarkup';
import { ApiNotice, type LoadState } from './components/ApiNotice';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { EmergencyPage } from './pages/EmergencyPage';
import { EnterpriseDemoPage } from './pages/EnterpriseDemoPage';
import { useWorkerProfile } from './hooks/useWorkerProfile';
import { assessHeat } from './services/heat.service';
import { getProtectionPlan } from './services/protection.service';
import { getSafeZones } from './services/safezone.service';
import { getWeather } from './services/weather.service';
import { evaluateSimulation } from './services/simulation.service';
import { isMockMode } from './services/apiClient';
import { checkBackendHealth } from './services/health.service';
import type { DataMode } from './types/api.types';
import type { SafeZone } from './types/safezone.types';
import type { WeatherResponse } from './types/weather.types';
import type { WorkerProfile } from './types/worker.types';
import './styles.css';
import 'leaflet/dist/leaflet.css';

const SafeZoneMap = lazy(() =>
  import('./components/SafeZoneMap').then((module) => ({ default: module.SafeZoneMap })),
);
const WeatherChart = lazy(() =>
  import('./components/WeatherChart').then((module) => ({ default: module.WeatherChart })),
);

const routeByPage: Record<string, string> = {
  connect: '/worker/dashboard',
  plan: '/worker/plan',
  zones: '/safe-zones',
  heatlab: '/heatlab',
  onboarding: '/onboarding',
};
const roleToOccupation = {
  'Construction worker': 'CONSTRUCTION',
  'Delivery rider': 'DELIVERY',
  'Street vendor': 'STREET_VENDOR',
  'Agricultural worker': 'AGRICULTURE',
  'Road maintenance worker': 'ROAD_WORKER',
  'Traffic police personnel': 'TRAFFIC_POLICE',
  'Other outdoor worker': 'OTHER',
} as const;
const environmentToCode = {
  'Direct Sunlight': 'DIRECT_SUNLIGHT',
  'Partial Shade': 'PARTIAL_SHADE',
  'Mostly Shaded': 'MOSTLY_SHADED',
} as const;

function pageByPath(path: string): string {
  if (path === '/' || path === '/worker/dashboard') return 'connect';
  if (path === '/worker/plan') return 'plan';
  if (path === '/safe-zones/add') return 'safe-zone-add';
  if (path.startsWith('/safe-zones')) return 'zones';
  if (path === '/heatlab') return 'heatlab';
  if (path === '/onboarding' || path === '/worker/profile') return 'onboarding';
  if (path === '/sos') return 'sos';
  if (path.startsWith('/enterprise/')) return 'enterprise';
  return 'connect';
}

function messageForError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'SunShield services are unavailable. Please try again.';
}

function validateWorkerProfile(profile: WorkerProfile): string | undefined {
  const { latitude, longitude, city } = profile.location;
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return 'Choose a valid work location before continuing.';
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return 'Choose a valid work location before continuing.';
  }
  if (!city.trim()) return 'Enter a city or allow location access before continuing.';
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(profile.workStart) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(profile.workEnd)
  ) {
    return 'Choose valid work hours before continuing.';
  }
  if (profile.workStart >= profile.workEnd) {
    return 'Work end time must be later than work start time.';
  }
  return undefined;
}

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [, setRevision] = useState(0);
  const [profileVersion, setProfileVersion] = useState(0);
  const profile = useWorkerProfile(profileVersion);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [dataMode, setDataMode] = useState<DataMode>();
  const [mapHost, setMapHost] = useState<HTMLElement | null>(null);
  const [chartHost, setChartHost] = useState<HTMLElement | null>(null);
  const view = pageByPath(location.pathname);
  const isAuxiliaryRoute = [
    '/sos',
    '/safe-zones/add',
    '/enterprise/dashboard',
    '/enterprise/planner',
  ].includes(location.pathname);

  useEffect(() => {
    void i18n.changeLanguage(legacyState.language || 'en');
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    legacyState.page = view;
    setRevision((value) => value + 1);
  }, [view]);

  useEffect(() => {
    if (view !== 'heatlab' || legacyState.simProfileInitialized) return;
    legacyState.simRole = legacyState.role;
    legacyState.simWorkload = legacyState.workload;
    legacyState.simEnvironment = legacyState.environment;
    legacyState.simWaterAccess = profile.waterAccess;
    legacyState.simShadeAccess = profile.shadeAccess;
    legacyState.simScheduleFlexibility = profile.scheduleFlexibility;
    legacyState.simAlternativeDutiesAvailable = profile.alternativeDutiesAvailable;
    legacyState.simProfileInitialized = true;
    setRevision((value) => value + 1);
  }, [view, profile]);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      const shouldLoad = view === 'connect' || view === 'plan' || view === 'zones';
      if (!shouldLoad) {
        setErrorMessage(undefined);
        if (view === 'heatlab') {
          setLoadState('loading');
          try {
            await checkBackendHealth({ signal });
            setDataMode('SIMULATION');
            setLoadState('ready');
          } catch (error) {
            if (signal?.aborted) return;
            setLoadState('error');
            setErrorMessage(messageForError(error));
          }
        } else {
          setLoadState(location.pathname === '/onboarding' ? 'ready' : 'idle');
        }
        return;
      }

      const validationMessage = validateWorkerProfile(profile);
      if (validationMessage) {
        setLoadState('error');
        setErrorMessage(validationMessage);
        return;
      }

      setLoadState('loading');
      setErrorMessage(undefined);
      try {
        if (view === 'connect') {
          const [weather, assessment, facilities] = await Promise.all([
            getWeather(profile.location, { signal }),
            assessHeat(profile, { signal }),
            getSafeZones({ ...profile.location, radiusKm: 5, includeDemo: false }, { signal }),
          ]);
          legacyState.weatherData = weather;
          legacyState.assessmentData = assessment;
          legacyState.safeZonesData = facilities;
          legacyState.dataMode = assessment.dataMode;
          setDataMode(assessment.dataMode);
        } else if (view === 'plan') {
          const [plan, weather] = await Promise.all([
            getProtectionPlan(profile, { signal }),
            getWeather(profile.location, { signal }),
          ]);
          legacyState.planData = plan;
          legacyState.weatherData = weather;
          legacyState.dataMode = plan.dataMode;
          setDataMode(plan.dataMode);
        } else {
          const facilities = await getSafeZones(
            { ...profile.location, radiusKm: 5, includeDemo: false },
            { signal },
          );
          legacyState.safeZonesData = facilities;
          const facilityMode = isMockMode() ? 'SIMULATION' : 'LIVE';
          legacyState.dataMode = facilityMode;
          setDataMode(facilityMode);
        }
        setLoadState('ready');
        setRevision((value) => value + 1);
      } catch (error) {
        if (signal?.aborted) return;
        setLoadState('error');
        setErrorMessage(messageForError(error));
      }
    },
    [location.pathname, profile, view],
  );

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const markup = renderMarkup();

  useEffect(() => {
    if (view !== 'zones' || isAuxiliaryRoute) {
      setMapHost(null);
      return;
    }
    setMapHost(document.getElementById('safe-zone-map'));
  }, [markup, view, isAuxiliaryRoute]);

  useEffect(() => {
    setChartHost(view === 'connect' ? document.getElementById('weather-chart') : null);
  }, [markup, view]);

  useEffect(() => {
    if (view === 'onboarding') {
      for (const [field, value] of Object.entries({
        workStart: legacyState.workStart,
        workEnd: legacyState.workEnd,
        waterAccess: legacyState.waterAccess,
        shadeAccess: legacyState.shadeAccess,
        scheduleFlexibility: legacyState.scheduleFlexibility,
      })) {
        const select = document.querySelector<HTMLSelectElement>(`[data-profile-field="${field}"]`);
        if (select && value !== undefined) select.value = value;
      }
    }
    if (view === 'heatlab') {
      for (const [field, value] of Object.entries({
        waterAccess: legacyState.simWaterAccess,
        shadeAccess: legacyState.simShadeAccess,
        scheduleFlexibility: legacyState.simScheduleFlexibility,
      })) {
        const select = document.querySelector<HTMLSelectElement>(
          `[data-simulation-field="${field}"]`,
        );
        if (select && value !== undefined) select.value = value;
      }
    }
  }, [markup, view]);

  const toast = (message: string) => {
    document.querySelector('.toast')?.remove();
    const element = document.createElement('div');
    element.className = 'toast';
    element.textContent = message;
    document.body.append(element);
    window.setTimeout(() => element.remove(), 2800);
  };

  const routeClick = (target: Element) => {
    const page = target.closest<HTMLElement>('[data-page]')?.dataset.page;
    if (page && routeByPage[page]) {
      navigate(routeByPage[page]);
      return true;
    }
    return false;
  };

  const handleClick = async (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (routeClick(target)) return;
    const button = target.closest<HTMLElement>(
      '[data-action], [data-role], [data-workload], [data-env], [data-filter], [data-step], [data-preset], [data-lang]',
    );
    if (!button) return;
    const dataset = button.dataset;
    if (dataset.lang) {
      if (dataset.lang === 'en' || dataset.lang === 'hi' || dataset.lang === 'mr') {
        legacyState.language = dataset.lang;
        void i18n.changeLanguage(dataset.lang);
        setProfileVersion((value) => value + 1);
      }
    } else if (dataset.role) {
      if (view === 'heatlab') legacyState.simRole = dataset.role;
      else {
        legacyState.role = dataset.role;
        setProfileVersion((value) => value + 1);
      }
    } else if (dataset.workload) {
      if (view === 'heatlab') legacyState.simWorkload = dataset.workload;
      else {
        legacyState.workload = dataset.workload;
        setProfileVersion((value) => value + 1);
      }
    } else if (dataset.env) {
      if (view === 'heatlab') legacyState.simEnvironment = dataset.env;
      else {
        legacyState.environment = dataset.env;
        setProfileVersion((value) => value + 1);
      }
    } else if (dataset.filter === 'Available Now') {
      toast('The shared Safe Zones response does not include availability status yet.');
    } else if (dataset.filter) legacyState.filter = dataset.filter;
    else if (dataset.step) legacyState.step = Number(dataset.step);
    else if (dataset.preset) {
      legacyState.preset = dataset.preset;
      const presets: Record<string, [number, number]> = {
        'Normal Summer Day': [34, 40],
        'Extreme Dry Heat': [44, 45],
        'High-Humidity Heatwave': [39, 82],
        'Heavy Outdoor Workload': [42, 55],
      };
      const [temperature, humidity] = presets[dataset.preset] || [34, 40];
      legacyState.weather = temperature;
      legacyState.humidity = humidity;
    } else {
      const action = dataset.action;
      if (action === 'next') {
        if (legacyState.step < 3) legacyState.step += 1;
        else navigate('/worker/dashboard');
      } else if (action === 'back') legacyState.step = Math.max(1, legacyState.step - 1);
      else if (action === 'sos') navigate('/sos');
      else if (action === 'live-weather') navigate('/worker/dashboard');
      else if (action === 'reset') {
        legacyState.weather = 34;
        legacyState.humidity = 40;
        legacyState.windSpeedKmh = 12;
        legacyState.preset = 'Normal Summer Day';
        legacyState.simulationResult = undefined;
        legacyState.comparisonResults = undefined;
      } else if (action === 'apply') {
        setLoadState('loading');
        try {
          const conditions = {
            temperatureC: legacyState.weather,
            humidityPercent: legacyState.humidity,
            windSpeedKmh: legacyState.windSpeedKmh ?? 12,
          };
          const simulationProfile = {
            ...profile,
            occupation:
              roleToOccupation[
                (legacyState.simRole || legacyState.role) as keyof typeof roleToOccupation
              ] || profile.occupation,
            workload: (
              legacyState.simWorkload || legacyState.workload
            ).toUpperCase() as typeof profile.workload,
            environment:
              environmentToCode[
                (legacyState.simEnvironment ||
                  legacyState.environment) as keyof typeof environmentToCode
              ] || profile.environment,
            waterAccess: (legacyState.simWaterAccess ||
              profile.waterAccess) as typeof profile.waterAccess,
            shadeAccess: (legacyState.simShadeAccess ||
              profile.shadeAccess) as typeof profile.shadeAccess,
            scheduleFlexibility: (legacyState.simScheduleFlexibility ||
              profile.scheduleFlexibility) as typeof profile.scheduleFlexibility,
            alternativeDutiesAvailable:
              legacyState.simAlternativeDutiesAvailable ?? profile.alternativeDutiesAvailable,
          };
          const comparisonProfile = {
            ...simulationProfile,
            occupation: 'STREET_VENDOR' as const,
            workload: 'LIGHT' as const,
            environment: 'PARTIAL_SHADE' as const,
            waterAccess: 'AVAILABLE' as const,
            shadeAccess: 'AVAILABLE' as const,
          };
          const [result, comparisonResult] = await Promise.all([
            evaluateSimulation({
              worker: simulationProfile,
              conditions,
            }),
            evaluateSimulation({ worker: comparisonProfile, conditions }),
          ]);
          legacyState.simulationResult = result;
          legacyState.comparisonResults = [result, comparisonResult];
          setDataMode('SIMULATION');
          setLoadState('ready');
          toast(
            isMockMode()
              ? 'Demo response only. No heat assessment was calculated.'
              : 'Simulation response received.',
          );
        } catch (error) {
          setLoadState('error');
          setErrorMessage(messageForError(error));
        }
      } else if (action === 'language') {
        const languages = ['en', 'hi', 'mr'] as const;
        const currentIndex = languages.indexOf(legacyState.language || 'en');
        legacyState.language = languages[(currentIndex + 1) % languages.length];
        void i18n.changeLanguage(legacyState.language);
        setProfileVersion((value) => value + 1);
      } else if (action === 'locate') {
        if (!navigator.geolocation)
          toast('Location is unavailable in this browser. Enter a city instead.');
        else
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
              legacyState.location = {
                ...profile.location,
                latitude: coords.latitude,
                longitude: coords.longitude,
                city: 'Current location',
              };
              setRevision((value) => value + 1);
              toast('Location updated for this device.');
            },
            () => toast('Location permission was denied. Enter your city to continue.'),
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
          );
      } else if (action === 'listen') {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(
            'Take a shaded rest and drink water. Follow your workplace heat safety plan.',
          );
          utterance.lang =
            legacyState.language === 'hi'
              ? 'hi-IN'
              : legacyState.language === 'mr'
                ? 'mr-IN'
                : 'en-IN';
          window.speechSynthesis.speak(utterance);
        } else toast('Voice playback is not available in this browser.');
      } else if (action === 'directions') {
        const facilityId = button.dataset.facilityId;
        const facility = (legacyState.safeZonesData?.facilities || []).find(
          (item: SafeZone) => item.id === facilityId,
        );
        const origin = `${profile.location.latitude},${profile.location.longitude}`;
        const destination = facility
          ? `${facility.latitude},${facility.longitude}`
          : '18.5308,73.8475';
        const route = `${encodeURIComponent(origin)}%3B${encodeURIComponent(destination)}`;
        const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${route}`;
        window.open(url, '_blank', 'noopener,noreferrer');
      } else if (action === 'confirm' || action === 'report' || action === 'add-zone') {
        if (action === 'add-zone') navigate('/safe-zones/add');
        else toast('Facility reporting is waiting for the shared backend request schema.');
      } else if (action === 'water' || action === 'shade') {
        toast(
          action === 'water' ? 'Demo water location selected.' : 'Demo shade location selected.',
        );
      } else if (action === 'explain') {
        const period = button.closest('.period');
        const existing = period?.querySelector('.explanation');
        if (existing) existing.remove();
        else
          period?.insertAdjacentHTML(
            'beforeend',
            '<p class="explanation tiny">Factors and recommendations are provided by the shared backend assessment. Demo data does not contain an occupational assessment.</p>',
          );
      }
    }
    setRevision((value) => value + 1);
  };

  const handleInput = (event: FormEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.id === 'zoneSearch') {
      legacyState.query = target.value;
      document.querySelectorAll<HTMLElement>('.zone-card').forEach((card) => {
        const matchesText = card.dataset.search?.includes(target.value.toLowerCase()) ?? false;
        const matchesFilter =
          legacyState.filter === 'Nearest' ||
          (legacyState.filter === 'Recently Verified' &&
            card.dataset.verification === 'VERIFIED' &&
            Boolean(card.dataset.lastVerified)) ||
          card.dataset.kind === legacyState.filter;
        card.style.display = matchesText && matchesFilter ? '' : 'none';
      });
    }
    if (target.dataset.range) {
      legacyState[target.dataset.range] = Number(target.value);
      const label = target.closest('.control')?.querySelector('.row b:last-child');
      const unit =
        target.dataset.range === 'weather'
          ? '°C'
          : target.dataset.range === 'humidity'
            ? '%'
            : ' km/h';
      if (label) label.textContent = `${target.value}${unit}`;
    }
    if (target.dataset.toggle) legacyState[target.dataset.toggle] = target.checked;
    if (target.id === 'workCity') legacyState.pendingCity = target.value;
  };

  const handleChange = (event: FormEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof HTMLSelectElement && target.dataset.profileField === 'workStart')
      legacyState.workStart = target.value;
    if (target instanceof HTMLSelectElement && target.dataset.profileField === 'workEnd')
      legacyState.workEnd = target.value;
    if (target instanceof HTMLSelectElement && target.dataset.profileField === 'waterAccess') {
      legacyState.waterAccess = target.value;
      legacyState.water = target.value !== 'UNAVAILABLE';
    }
    if (target instanceof HTMLSelectElement && target.dataset.profileField === 'shadeAccess') {
      legacyState.shadeAccess = target.value;
      legacyState.shade = target.value !== 'UNAVAILABLE';
    }
    if (
      target instanceof HTMLSelectElement &&
      target.dataset.profileField === 'scheduleFlexibility'
    )
      legacyState.scheduleFlexibility = target.value;
    if (target instanceof HTMLSelectElement && target.dataset.simulationField === 'waterAccess')
      legacyState.simWaterAccess = target.value;
    if (target instanceof HTMLSelectElement && target.dataset.simulationField === 'shadeAccess')
      legacyState.simShadeAccess = target.value;
    if (
      target instanceof HTMLSelectElement &&
      target.dataset.simulationField === 'scheduleFlexibility'
    )
      legacyState.simScheduleFlexibility = target.value;
    if (target instanceof HTMLSelectElement && target.dataset.profileField) {
      setProfileVersion((value) => value + 1);
      setRevision((value) => value + 1);
    }
    if (target instanceof HTMLSelectElement && target.dataset.simulationField)
      setRevision((value) => value + 1);
    if (target instanceof HTMLInputElement && target.dataset.toggle) {
      if (target.dataset.toggle === 'simAlternativeDutiesAvailable' && view === 'heatlab') {
        legacyState.simAlternativeDutiesAvailable = target.checked;
      } else if (view !== 'heatlab') {
        setProfileVersion((value) => value + 1);
      }
      setRevision((value) => value + 1);
    }
  };

  const handleBlur = (event: FormEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.id === 'workCity') {
      legacyState.location = { ...profile.location, city: target.value || 'Pune' };
      setProfileVersion((value) => value + 1);
      setRevision((value) => value + 1);
    }
  };

  if (location.pathname === '/sos') return <EmergencyPage />;
  if (location.pathname === '/enterprise/dashboard') return <EnterpriseDemoPage />;
  if (location.pathname === '/enterprise/planner') return <EnterpriseDemoPage planner />;
  if (location.pathname === '/safe-zones/add') {
    return (
      <main className="min-h-screen bg-sunshield-cloud px-4 py-8 sm:px-6 sm:py-12">
        <Card className="mx-auto max-w-2xl">
          <Badge tone="demo">Submission schema pending</Badge>
          <h1 className="mt-4 font-display text-2xl font-semibold">Suggest a cooling resource</h1>
          <p className="mt-3 leading-7 text-slate-600">
            The shared TRD does not yet define the facility submission fields. This frontend
            placeholder will not send data until the backend team agrees on the schema.
          </p>
          <Button className="mt-5" onClick={() => navigate('/safe-zones')} variant="secondary">
            Back to Safe Zones
          </Button>
        </Card>
      </main>
    );
  }

  const needsApi = ['connect', 'plan', 'zones'].includes(view);
  const unavailable = !isMockMode() && needsApi && loadState === 'error';
  const mapFacilities = (legacyState.safeZonesData?.facilities || []) as SafeZone[];
  const language = legacyState.language || 'en';

  return (
    <div
      onClick={(event) => void handleClick(event)}
      onInput={handleInput}
      onChange={handleChange}
      onBlur={handleBlur}
    >
      <ApiNotice
        mode={isMockMode() ? 'MOCK' : 'API'}
        state={needsApi ? loadState : view === 'heatlab' ? loadState : 'idle'}
        dataMode={dataMode}
        message={errorMessage}
        onRetry={() => void refresh()}
      />
      {unavailable ? (
        <main className="main api-unavailable" role="alert">
          <h1>Live information is unavailable</h1>
          <p>{errorMessage}</p>
          <button className="btn dark" onClick={() => void refresh()}>
            Retry connection
          </button>
        </main>
      ) : (
        <div dangerouslySetInnerHTML={{ __html: markup }} />
      )}
      <Suspense fallback={<div className="chart-empty">Loading SunShield visualization…</div>}>
        {view === 'zones' &&
          mapHost &&
          createPortal(<SafeZoneMap facilities={mapFacilities} />, mapHost)}
        {view === 'connect' &&
          chartHost &&
          createPortal(
            <WeatherChart data={legacyState.weatherData as WeatherResponse | undefined} />,
            chartHost,
          )}
      </Suspense>
      {!isAuxiliaryRoute && (
        <nav className="mobile-nav" aria-label="Worker navigation">
          <button
            className={view === 'connect' ? 'active' : ''}
            onClick={() => navigate('/worker/dashboard')}
          >
            Connect
          </button>
          <button
            className={view === 'plan' ? 'active' : ''}
            onClick={() => navigate('/worker/plan')}
          >
            My Plan
          </button>
          <button
            className={view === 'zones' ? 'active' : ''}
            onClick={() => navigate('/safe-zones')}
          >
            Safe Zones
          </button>
          <button
            className={view === 'heatlab' ? 'active' : ''}
            onClick={() => navigate('/heatlab')}
          >
            HeatLab
          </button>
        </nav>
      )}
      <span className="sr-only" aria-live="polite">
        Language: {language}
      </span>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppRoutes />} />
        <Route path="/onboarding" element={<AppRoutes />} />
        <Route path="/worker/dashboard" element={<AppRoutes />} />
        <Route path="/worker/plan" element={<AppRoutes />} />
        <Route path="/worker/profile" element={<AppRoutes />} />
        <Route path="/safe-zones" element={<AppRoutes />} />
        <Route path="/safe-zones/add" element={<AppRoutes />} />
        <Route path="/sos" element={<AppRoutes />} />
        <Route path="/enterprise/dashboard" element={<AppRoutes />} />
        <Route path="/enterprise/planner" element={<AppRoutes />} />
        <Route path="/heatlab" element={<AppRoutes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
