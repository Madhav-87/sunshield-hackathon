import type { DataMode, HeatAssessmentResponse } from './types/api.types';
import type { ProtectionPlanResponse } from './types/protection.types';
import type { SafeZonesResponse } from './types/safezone.types';
import type { VerificationStatus } from './types/api.types';
import type { WeatherResponse } from './types/weather.types';
import type { Language } from './types/worker.types';
import type { SimulationViewResult } from './types/simulation.types';

interface LegacyState {
  page: string;
  step: number;
  role: string;
  weather: number;
  humidity: number;
  windSpeedKmh: number;
  workload: string;
  environment: string;
  preset: string;
  filter: string;
  query: string;
  water: boolean;
  shade: boolean;
  waterAccess: string;
  shadeAccess: string;
  scheduleFlexibility: string;
  alternativeDutiesAvailable: boolean;
  workStart: string;
  workEnd: string;
  language: Language;
  dataMode?: DataMode;
  location: { latitude: number; longitude: number; city: string; timezone: string };
  weatherData?: WeatherResponse;
  assessmentData?: HeatAssessmentResponse;
  planData?: ProtectionPlanResponse;
  safeZonesData?: SafeZonesResponse;
  simulationResult?: SimulationViewResult;
  comparisonResults?: SimulationViewResult[];
  simRole?: string;
  simWorkload?: string;
  simEnvironment?: string;
  simWaterAccess?: string;
  simShadeAccess?: string;
  simScheduleFlexibility?: string;
  simAlternativeDutiesAvailable?: boolean;
  simProfileInitialized?: boolean;
  pendingCity?: string;
  [key: string]: unknown;
}

const html = (parts: TemplateStringsArray, ...values: unknown[]) =>
  parts.reduce((result, part, index) => result + part + String(values[index] ?? ''), '');
export const state: LegacyState = {
  page: 'connect',
  step: 1,
  role: 'Construction worker',
  weather: 44,
  humidity: 45,
  windSpeedKmh: 12,
  workload: 'Heavy',
  environment: 'Direct Sunlight',
  preset: 'Extreme Dry Heat',
  filter: 'Nearest',
  query: '',
  water: true,
  shade: false,
  waterAccess: 'LIMITED',
  shadeAccess: 'UNAVAILABLE',
  scheduleFlexibility: 'EMPLOYER_CONTROLLED',
  alternativeDutiesAvailable: false,
  workStart: '09:00',
  workEnd: '18:00',
  language: 'en',
  dataMode: 'SIMULATION',
  location: { latitude: 18.5204, longitude: 73.8567, city: 'Pune', timezone: 'Asia/Kolkata' },
};
const navItems = [
  ['connect', 'Connect'],
  ['plan', 'My Plan'],
  ['zones', 'Safe Zones'],
  ['heatlab', 'HeatLab'],
];
const icon = (name: string) => html`<span class="icon">${name}</span>`;
const footerMarkup = html`<footer class="footer">
  <span>SunShield — Adaptive Occupational Heat Intelligence & Protection Platform</span
  ><span>© 2025 SunShield Climate Systems</span>
</footer>`;
function header() {
  return html`<header class="topbar">
    <div class="brand"><span class="brand-mark">${icon('wb_sunny')}</span>SunShield</div>
    <nav class="nav">
      ${navItems.map(([id, label]) => html`<button class="${state.page === id ? 'active' : ''}" data-page="${id}">${label}</button>`).join('')}
    </nav>
    <div class="top-right">
      <span class="pill">${icon('location_on')} Pune, MH</span
      ><span class="pill live"
        >${state.dataMode === 'LIVE' ? '● LIVE' : state.dataMode === 'CACHED' ? '● CACHED' : '● DEMO'}</span
      ><button class="pill" data-action="language">
        ${state.language === 'hi' ? 'हिंदी' : state.language === 'mr' ? 'मराठी' : 'EN'} / हिंदी /
        मराठी</button
      ><button class="sos" data-action="sos">✳ SOS</button
      ><button class="avatar" data-page="onboarding" aria-label="Profile setup">●</button>
    </div>
  </header>`;
}
function codeText(code: string) {
  const labels: Record<string, Record<string, string>> = {
    en: {
      ESCALATE_TO_SUPERVISOR: 'Coordinate with a site supervisor',
      REDUCE_STRENUOUS_ACTIVITY: 'Reduce strenuous activity',
      ARRANGE_SHADED_RECOVERY: 'Arrange shaded recovery',
    },
    hi: {
      ESCALATE_TO_SUPERVISOR: 'कार्यस्थल पर्यवेक्षक से समन्वय करें',
      REDUCE_STRENUOUS_ACTIVITY: 'कठिन गतिविधि कम करें',
      ARRANGE_SHADED_RECOVERY: 'छायादार स्थान पर आराम की व्यवस्था करें',
    },
    mr: {
      ESCALATE_TO_SUPERVISOR: 'कामाच्या ठिकाणच्या पर्यवेक्षकाशी समन्वय साधा',
      REDUCE_STRENUOUS_ACTIVITY: 'कठीण काम कमी करा',
      ARRANGE_SHADED_RECOVERY: 'सावलीत विश्रांतीची व्यवस्था करा',
    },
  };
  const language = state.language || 'en';
  return (
    labels[language]?.[code] ||
    {
      en: 'Review the advisory with your site supervisor.',
      hi: 'कार्यस्थल पर्यवेक्षक के साथ सलाह की समीक्षा करें।',
      mr: 'पर्यवेक्षकासोबत सूचनेचा आढावा घ्या.',
    }[language] ||
    'Review the advisory with your site supervisor.'
  );
}
function connect() {
  const current = state.weatherData?.current;
  const assessment = state.assessmentData?.assessment;
  const facilities = state.safeZonesData?.facilities || [];
  const mode = state.weatherData?.dataMode || 'SIMULATION';
  const level = assessment?.advisoryLevel || 'UNKNOWN';
  const riskLabel = level === 'UNKNOWN' ? 'Assessment unavailable' : `${level} heat advisory`;
  const advice = assessment?.recommendations?.length
    ? assessment.recommendations
        .slice(0, 2)
        .map((item) => codeText(item.code))
        .join(' and ')
    : 'No backend assessment is available in demonstration mode.';
  return html`<main class="main">
    <section class="grid connect-hero">
      <article class="card">
        <div class="row">
          <span class="badge ${level === 'CRITICAL' || level === 'HIGH' ? 'red' : ''}"
            >⚠ ${riskLabel}</span
          ><span class="tiny"
            >◷ ${current?.observedAt || 'No observation time'} •
            ${state.location?.city || 'Pune'}</span
          >
        </div>
        <div class="weather">
          <div>
            <div class="row" style="justify-content:flex-start;gap:14px;margin:10px 0">
              <strong class="temp">${current?.temperatureC ?? '—'}°C</strong>
              <div>
                <div class="eyebrow">Feels like</div>
                <strong style="color:#8a4c00;font-size:17px"
                  >${current?.apparentTemperatureC ?? '—'}°C</strong
                >
              </div>
            </div>
            <span class="badge blue"
              >${mode} • ${state.weatherData?.source || 'No weather source'}</span
            >
          </div>
          <div class="weather-detail">
            <div>
              <div class="eyebrow">MEASURED WEATHER</div>
              <p>Rel. Humidity<br /><b>${current?.humidityPercent ?? '—'}%</b></p>
            </div>
            <div>
              <div class="eyebrow">WIND SPEED</div>
              <p>
                ${current?.windSpeedKmh ?? '—'} km/h<br /><span class="tiny">Data mode</span
                ><br /><b>${mode}</b>
              </p>
            </div>
          </div>
        </div>
      </article>
      <article class="card dark-card">
        <div>
          <span class="eyebrow" style="color:#67e7d8"
            >◉ ${mode === 'LIVE' ? 'PROTECTIVE ACTION' : 'DEMONSTRATION ASSESSMENT'}</span
          >
          <p>${advice}</p>
          ${assessment?.medicalValidation === false ? '<span class="tiny" style="color:#d5d9e2">Estimated advisory only · Not medically validated</span>' : ''}
        </div>
        <div class="actions">
          <button class="btn teal" data-action="listen">◖ Listen to Guidance</button
          ><button class="btn small" data-page="plan">☑ View My Protection Plan</button
          ><button class="btn small" data-page="zones">⌖ Find Nearby Cooling</button>
        </div>
      </article>
    </section>
    <section class="grid dash-grid">
      <article class="card">
        <div class="row">
          <div>
            <div class="eyebrow">
              SHIFT FORECAST · ${state.workStart || '09:00'} – ${state.workEnd || '18:00'}
            </div>
            <h2 style="margin:5px 0">Hourly Weather Forecast</h2>
          </div>
          <div class="tiny">${mode} DATA</div>
        </div>
        <div class="weather-chart" id="weather-chart" aria-label="Hourly temperatures"></div>
      </article>
      <article class="card">
        <div class="eyebrow">PERSONALIZED PROFILE</div>
        <h2 style="margin:5px 0 12px">Protection Summary</h2>
        <div class="profile-row"><span>Role</span><b>${state.role}</b></div>
        <div class="profile-row"><span>Workload</span><b>${state.workload} Workload</b></div>
        <div class="profile-row"><span>Exposure</span><b>${state.environment}</b></div>
        <div class="profile-row highlight">
          <span class="eyebrow">ASSESSMENT STATUS</span><br /><b>${level}</b><br /><small
            >${assessment?.disclaimerCode || 'DEMONSTRATION_DATA_ONLY'} · Engine
            ${assessment?.engineVersion || 'not available'}</small
          >
        </div>
        <div class="profile-row">
          <span>Contributing exposure factors</span>
          <b>${assessment?.factors?.length ?? 0} returned</b>
        </div>
      </article>
    </section>
    <section class="quick">
      <div class="row">
        <h3>Quick Actions</h3>
        <span class="tiny">Tap for immediate field support</span>
      </div>
      <div class="grid quick-grid">
        ${[
          ['water_drop', 'Drinking Water'],
          ['park', 'Find Shade'],
          ['assignment', 'My Protection Plan'],
          ['record_voice_over', 'Voice Warnings'],
          ['warning', 'Report Unsafe'],
          ['emergency', 'Emergency (112)'],
        ]
          .map(
            ([ic, l], i) =>
              html`<button
                class="${i === 5 ? 'danger' : ''}"
                data-action="${['water', 'shade', 'plan', 'listen', 'report', 'sos'][i]}"
              >
                ${icon(ic)}${l}
              </button>`,
          )
          .join('')}
      </div>
    </section>
    <section class="grid zones">
      <article class="card">
        <div class="row">
          <div>
            <div class="eyebrow">COOLING & HYDRATION</div>
            <h2 style="margin:5px 0">Nearby Safe Zones</h2>
          </div>
          <span class="badge teal"
            >${facilities.length} ${mode === 'SIMULATION' ? 'Demo Locations' : 'Nearby'}</span
          >
        </div>
        ${
          facilities
            .slice(0, 3)
            .map(
              (place) =>
                html`<div class="zone">
                  <div class="zone-icon">
                    ${icon(place.waterAvailable ? 'water_drop' : place.shadeAvailable ? 'park' : 'ac_unit')}
                  </div>
                  <div class="zone-content">
                    <b>${place.name}</b>
                    <div class="tiny">
                      ${place.category.replaceAll('_', ' ')} • ${place.distanceKm.toFixed(2)} km
                      <span class="badge ${place.verificationStatus === 'VERIFIED' ? 'teal' : ''}"
                        >${place.verificationStatus === 'VERIFIED' ? 'Verified' : place.verificationStatus === 'PENDING' ? 'Pending' : 'DEMO · Not verified'}</span
                      >
                    </div>
                  </div>
                  <button
                    class="btn dark small"
                    data-action="directions"
                    data-facility-id="${place.id}"
                  >
                    ⌖ Directions
                  </button>
                </div>`,
            )
            .join('') || '<div class="empty">No nearby facilities returned.</div>'
        }
      </article>
      <article class="card">
        <div class="zone-map">
          ${state.location?.city || 'Pune'}<span class="pin" style="left:36%;top:27%"
            >${icon('ac_unit')}</span
          >
        </div>
        <p>
          <span class="badge"
            >${mode === 'SIMULATION' ? 'DEMONSTRATION LOCATION' : 'NEARBY RESOURCE'}</span
          ><br /><b>${facilities[0]?.name || 'No facility selected'}</b><br /><span class="tiny"
            >${facilities[0]?.verificationStatus === 'VERIFIED' ? 'Verified by the Safe Zones service.' : 'Demonstration location · Not verified.'}</span
          >
        </p>
      </article>
    </section>
  </main>`;
}
function plan() {
  const data = state.planData;
  const timeline = data?.timeline || [];
  const recommendations = Array.from(
    new Set(timeline.flatMap((period) => period.recommendationCodes || [])),
  );
  return html`<main class="main">
    <div class="planner-top">
      <span class="eyebrow" style="color:#008e7f"
        >ADAPTIVE HEAT PROTECTION PLANNER • ${data?.dataMode || 'DEMO'}</span
      >
      <h1 class="title">Your workday. Your protection plan.</h1>
      <div class="context">
        <b class="eyebrow">WORKER CONTEXT:</b><span class="pill">♟ ${state.role}</span
        ><span class="pill"
          >◷ ${data?.workStart || state.workStart || '09:00'} –
          ${data?.workEnd || state.workEnd || '18:00'}</span
        ><span class="pill">⚒ ${state.workload} Workload</span
        ><span class="pill">☀ ${state.environment}</span
        ><span class="pill"
          >💧 Water ${state.waterAccess || (state.water ? 'AVAILABLE' : 'UNAVAILABLE')}</span
        ><span class="pill"
          >⛱ Shade ${state.shadeAccess || (state.shade ? 'AVAILABLE' : 'UNAVAILABLE')}</span
        >
      </div>
    </div>
    <section class="card">
      <div class="row">
        <span class="eyebrow">01 / PROTECTION TIMELINE</span
        ><span class="tiny">Periods and recommendations returned by the protection service</span>
      </div>
      ${
        timeline.length
          ? html`<div class="curve"></div>
              <div class="grid timeline">
                ${timeline
                  .map(
                    (period, index) =>
                      html`<article class="card period">
                        <div class="row">
                          <span class="eyebrow">PERIOD ${String(index + 1).padStart(2, '0')}</span
                          ><span class="tiny">${period.start} – ${period.end}</span>
                        </div>
                        <p>
                          <span
                            class="badge ${period.advisoryLevel === 'CRITICAL' || period.advisoryLevel === 'HIGH' ? 'red' : period.advisoryLevel === 'UNKNOWN' ? '' : 'teal'}"
                            >${period.advisoryLevel}</span
                          >
                        </p>
                        <div class="profile-row">
                          <span>Temperature</span
                          ><b
                            >${period.temperatureC === null ? 'Unavailable' : `${period.temperatureC}°C`}</b
                          >
                        </div>
                        <div class="eyebrow">Recommendations</div>
                        <p class="tiny">
                          ${period.recommendationCodes.length ? period.recommendationCodes.map((code) => `✓ ${codeText(code)}`).join('<br>') : 'No recommendation codes returned.'}
                        </p>
                        <button class="btn small" data-action="explain">
                          Why this advisory? ⌄
                        </button>
                      </article>`,
                  )
                  .join('')}
              </div>`
          : '<div class="empty">No forecast periods were returned. Check weather availability or adjust the work schedule.</div>'
      }
    </section>
    <section class="grid planner-lower">
      <article class="card">
        <div class="eyebrow" style="color:#008e7f">02 / OCCUPATION-SPECIFIC ACTIONS</div>
        <h2>Recommended protective actions</h2>
        ${recommendations.length ? html`<div class="grid task-grid">${recommendations.map((code) => html`<div class="task"><span>${icon('shield')}</span><b>${codeText(code)}</b></div>`).join('')}</div>` : '<div class="empty">Recommendations will appear here when provided by the backend heat intelligence service.</div>'}
      </article>
      <article class="card">
        <div class="eyebrow">03 / DECISION TRANSPARENCY</div>
        <h2>About this plan</h2>
        <div class="factor"><span>Data mode</span><b>${data?.dataMode || 'UNKNOWN'}</b></div>
        <div class="factor">
          <span>Schedule</span><b>${data?.workStart || '—'} – ${data?.workEnd || '—'}</b>
        </div>
        <div class="factor"><span>Forecast periods</span><b>${timeline.length}</b></div>
        <div class="factor">
          <span>Disclaimer</span><b>${data?.disclaimerCode || 'Not provided'}</b>
        </div>
        <p class="tiny">
          SunShield decision support is not medical certification or a certified work-rest plan.
          Follow local safety regulations and seek emergency help for severe symptoms.
        </p>
      </article>
    </section>
  </main>`;
}
function zones() {
  const facilities = state.safeZonesData?.facilities || [];
  const categoryLabel = (category: string) =>
    (
      ({
        COOLING_CENTRE: 'Cooling Centre',
        SHADED_REST: 'Shaded Rest',
        DRINKING_WATER: 'Drinking Water',
        MEDICAL: 'Medical Assistance',
      }) as Record<string, string>
    )[category] || category.replaceAll('_', ' ');
  const verifiedLabel = (status: VerificationStatus) =>
    status === 'VERIFIED'
      ? 'Verified Facility'
      : status === 'PENDING'
        ? 'Pending Verification'
        : status === 'DEMO'
          ? 'Demo location · Not verified'
          : 'Facility status unavailable';
  return html`<main class="main">
    <div class="row card" style="margin-bottom:14px">
      <div>
        <span class="badge teal"
          >01 / NETWORK
          ${state.dataMode === 'LIVE' ? 'LIVE' : state.dataMode === 'CACHED' ? 'CACHED' : 'DEMO'}</span
        >
        Showing ${facilities.length}
        ${state.dataMode === 'SIMULATION' ? 'demonstration locations' : 'cooling resources'} within
        5 km of Pune Central
      </div>
      <span class="pill"
        >${state.dataMode === 'SIMULATION' ? 'Sample conditions — not live' : 'Nearby resources'}</span
      >
    </div>
    <section class="grid map-layout">
      <div class="map-side">
        <article class="card">
          <div class="search">
            <input
              id="zoneSearch"
              placeholder="⌕ Search street, landmark, or amenity"
              value="${state.query}"
            /><button class="btn dark" data-action="add-zone">＋ Add a Safe Zone</button>
          </div>
          <div class="filter">
            ${['Nearest', 'Drinking Water', 'Shade', 'Cooling Centres', 'Available Now', 'Recently Verified', 'Medical Assistance'].map((x) => html`<button class="${state.filter === x ? 'active' : ''}" data-filter="${x}">${x}</button>`).join('')}
          </div>
        </article>
        <div id="zoneList">
          ${
            facilities.length
              ? facilities
                  .map((z) => {
                    const text = `${z.name} ${categoryLabel(z.category)} ${z.distanceKm.toFixed(2)} km ${z.waterAvailable ? 'water' : ''} ${z.shadeAvailable ? 'shade' : ''}`;
                    const kind =
                      z.category === 'DRINKING_WATER'
                        ? 'Drinking Water'
                        : z.category === 'SHADED_REST'
                          ? 'Shade'
                          : z.category === 'MEDICAL'
                            ? 'Medical Assistance'
                            : 'Cooling Centres';
                    return html`<article
                      class="card zone-card"
                      data-kind="${kind}"
                      data-verification="${z.verificationStatus}"
                      data-last-verified="${z.lastVerifiedAt || ''}"
                      data-search="${text.toLowerCase()}"
                    >
                      <div class="row">
                        <div>
                          <span class="zone-icon"
                            >${icon(z.category === 'DRINKING_WATER' ? 'water_drop' : z.category === 'SHADED_REST' ? 'park' : z.category === 'MEDICAL' ? 'local_hospital' : 'ac_unit')}</span
                          >
                          <b>${z.name}</b>
                        </div>
                        <span class="badge ${z.verificationStatus === 'VERIFIED' ? 'teal' : ''}"
                          >${verifiedLabel(z.verificationStatus)}</span
                        >
                      </div>
                      <p class="tiny">
                        ${categoryLabel(z.category)} • ${z.distanceKm.toFixed(2)} km away
                      </p>
                      <div class="filter">
                        <span class="pill"
                          >${z.waterAvailable ? 'Drinking Water' : 'No water listed'}</span
                        ><span class="pill"
                          >${z.shadeAvailable ? 'Shade available' : 'No shade listed'}</span
                        >
                      </div>
                      <div class="row" style="margin-top:12px">
                        <button class="btn" data-action="directions" data-facility-id="${z.id}">
                          ⌖ Directions</button
                        ><button class="btn dark" data-action="confirm" data-facility-id="${z.id}">
                          ✓ Report Availability
                        </button>
                      </div>
                    </article>`;
                  })
                  .join('')
              : '<div class="card empty">No nearby cooling facilities were returned. Try another area or refresh your location.</div>'
          }
        </div>
      </div>
      <div class="map-wrap">
        <div
          class="map-large"
          id="safe-zone-map"
          aria-label="OpenStreetMap showing nearby cooling locations"
        ></div>
        <div class="map-detail">
          <div>
            <b>Nearby cooling resources</b>
            <div class="tiny">
              ${state.dataMode === 'SIMULATION' ? 'Demonstration map markers · Not verified' : 'OpenStreetMap · Marker status shown per facility'}
            </div>
          </div>
          <button class="btn dark" data-action="directions">⌖ Directions</button>
        </div>
      </div>
    </section>
  </main>`;
}
function heatlab() {
  const result = state.simulationResult;
  const recommendations = result?.recommendations || [];
  const comparison = state.comparisonResults || [];
  return html`<main class="main">
    <span class="badge" style="background:#ffb21c;color:#572d00"
      >● SIMULATION MODE — DEMONSTRATION INPUTS</span
    >
    <span class="tiny">Demo mode does not calculate heat risk or safety recommendations.</span>
    <div class="row">
      <h1 class="title">
        SunShield HeatLab — Explore how extreme heat<br />
        affects different workers and working conditions
      </h1>
      <button class="btn" data-action="live-weather">Switch to Live Weather</button>
    </div>
    <section class="grid heatlab">
      <div>
        <article class="card">
          <div class="row">
            <span class="eyebrow">01 / SIMULATION PRESETS</span
            ><button class="btn small" data-action="reset">↻ Reset Scenario</button>
          </div>
          <div class="grid task-grid" style="margin-top:12px">
            ${[
              ['Normal Summer Day', '34°C • 40% RH'],
              ['Extreme Dry Heat', '44°C • 45% RH'],
              ['High-Humidity Heatwave', '39°C • 82% RH'],
              ['Heavy Outdoor Workload', '42°C • 55% RH'],
            ]
              .map(
                ([name, desc]) =>
                  html`<button
                    class="btn small"
                    data-preset="${name}"
                    style="text-align:left;background:${state.preset === name ? '#ffe0c1' : 'var(--soft)'}"
                  >
                    ${name}<br /><small>${desc}</small>
                  </button>`,
              )
              .join('')}
          </div>
        </article>
        <article class="card" style="margin-top:14px">
          <div class="eyebrow">02 / ENVIRONMENTAL PARAMETERS</div>
          ${[
            ['weather', 'Ambient Temperature', 25, 50, '°C'],
            ['humidity', 'Relative Humidity', 20, 95, '%'],
            ['windSpeedKmh', 'Wind Speed', 0, 60, 'km/h'],
          ]
            .map(
              ([key, label, min, max, unit]) =>
                html`<div class="control">
                  <div class="row"><b>${label}</b><b>${state[key] ?? 12}${unit}</b></div>
                  <input
                    type="range"
                    min="${min}"
                    max="${max}"
                    value="${state[key] ?? 12}"
                    data-range="${key}"
                  />
                  <div class="row tiny"><span>${min}${unit}</span><span>${max}${unit}</span></div>
                </div>`,
            )
            .join('')}
        </article>
        <article class="card" style="margin-top:14px">
          <div class="eyebrow">03 / OCCUPATIONAL & SITE FACTORS</div>
          <p>Occupation Role</p>
          <div class="segment">
            ${[
              ['Construction worker', 'CONSTRUCTION'],
              ['Delivery rider', 'DELIVERY'],
              ['Street vendor', 'STREET_VENDOR'],
              ['Agricultural worker', 'AGRICULTURE'],
            ]
              .map(
                ([role]) =>
                  html`<button
                    class="${(state.simRole || state.role) === role ? 'selected' : ''}"
                    data-role="${role}"
                  >
                    ${role}
                  </button>`,
              )
              .join('')}
          </div>
          <p>Physical Workload</p>
          <div class="segment">
            ${['Light', 'Moderate', 'Heavy'].map((value) => html`<button class="${(state.simWorkload || state.workload) === value ? 'selected' : ''}" data-workload="${value}">${value}</button>`).join('')}
          </div>
          <p>Working Environment</p>
          <div class="segment">
            ${['Direct Sunlight', 'Partial Shade', 'Mostly Shaded'].map((value) => html`<button class="${(state.simEnvironment || state.environment) === value ? 'selected' : ''}" data-env="${value}">${value}</button>`).join('')}
          </div>
          <div class="grid task-grid">
            <label
              >💧 Water access<select data-simulation-field="waterAccess">
                <option value="AVAILABLE">Available</option>
                <option value="LIMITED">Limited</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select></label
            ><label
              >⛱ Shade access<select data-simulation-field="shadeAccess">
                <option value="AVAILABLE">Available</option>
                <option value="LIMITED">Limited</option>
                <option value="UNAVAILABLE">Unavailable</option>
              </select></label
            >
          </div>
          <p>
            <label
              >Schedule
              <select data-simulation-field="scheduleFlexibility">
                <option value="EMPLOYER_CONTROLLED">Employer controlled</option>
                <option value="FIXED">Fixed</option>
                <option value="FLEXIBLE">Flexible</option>
              </select></label
            >
            <label
              >Alternative duties
              <input
                type="checkbox"
                data-toggle="simAlternativeDutiesAvailable"
                ${state.simAlternativeDutiesAvailable ? 'checked' : ''}
            /></label>
          </p>
          <button class="btn dark" style="width:100%" data-action="apply">
            ⚡ Evaluate simulation
          </button>
        </article>
      </div>
      <div>
        <article class="card">
          <div class="row">
            <div>
              <span class="badge">ASSESSMENT · ${result?.advisoryLabel || 'UNKNOWN'}</span
              ><span class="tiny">
                ${state.simRole || state.role} • ${state.simWorkload || state.workload}</span
              >
              <div class="row" style="justify-content:flex-start;gap:18px;margin-top:12px">
                <strong class="score">${result?.advisoryLabel || '—'}</strong>
                <div>
                  <b>Backend assessment</b>
                  <div class="tiny">
                    ${result?.message || 'No simulation result yet. Evaluate this scenario to preview the response state.'}
                  </div>
                </div>
              </div>
            </div>
            <div class="profile-row">
              <span>Medical validation</span><br /><b
                >${result ? 'Not medically validated' : 'Not provided'}</b
              >
            </div>
          </div>
          <div class="row" style="margin-top:20px">
            <div style="flex:1">
              <b class="eyebrow">CONTRIBUTING FACTORS</b>
              <p class="tiny">
                ${result?.factorCount ? `${result.factorCount} factors returned` : 'No factors returned.'}
              </p>
            </div>
            <div style="flex:1">
              <b class="eyebrow">DATA MODE</b>
              <p class="tiny">SIMULATION · Live weather is unchanged.</p>
            </div>
          </div>
        </article>
        <article class="card" style="margin-top:14px">
          <div class="row">
            <h2>◷ Assessment Recommendations</h2>
            <span class="badge">SIMULATION ONLY</span>
          </div>
          ${recommendations.length ? html`<div>${recommendations.map((item) => html`<div class="factor"><span>${item}</span></div>`).join('')}</div>` : '<div class="empty">No recommendations returned by demo mode.</div>'}
          <p class="tiny">
            This simulation is not medical advice or a certified work-rest schedule.
          </p>
        </article>
        <article class="card" style="margin-top:14px">
          <div class="eyebrow">04 / OCCUPATION COMPARISON</div>
          <h2>Same environmental input · Different worker profiles</h2>
          <div class="grid task-grid">
            ${[state.simRole || state.role, 'Street vendor']
              .map((role, index) => {
                const outcome = comparison[index];
                return html`<div class="profile-row">
                  <b>${role}</b>
                  <p class="tiny">
                    Advisory: ${outcome?.advisoryLabel || 'Awaiting assessment'}<br />${outcome?.recommendations?.length ? outcome.recommendations.join('<br>') : 'No recommendations returned.'}
                  </p>
                </div>`;
              })
              .join('')}
          </div>
        </article>
      </div>
    </section>
  </main>`;
}
function onboarding() {
  const roleOptions = [
    ['construction', 'Construction worker', 'Site, masonry & scaffolding'],
    ['two_wheeler', 'Delivery rider', 'Food, parcel & courier'],
    ['storefront', 'Street vendor', 'Cart, stall & market'],
    ['agriculture', 'Agricultural worker', 'Farming, fields & harvest'],
    ['construction', 'Road maintenance worker', 'Asphalt, highway & repair'],
    ['local_police', 'Traffic police personnel', 'Junctions & patrol duty'],
    ['work', 'Other outdoor worker', 'Security, sanitation, gardening, or general outdoor labor'],
  ];
  const panels = [
    html`<div class="eyebrow">STEP 01 — OCCUPATION</div>
      <h2>Let’s understand your work.</h2>
      <p>Choose the role that best matches your daily outdoor work. No typing needed.</p>
      <div class="option-grid">
        ${roleOptions
          .map(
            ([ic, name, desc]) =>
              html`<button
                class="option ${state.role === name ? 'selected' : ''} ${name === 'Other outdoor worker' ? 'wide' : ''}"
                data-role="${name}"
              >
                ${icon(ic)}<span><b>${name}</b><br /><small class="muted">${desc}</small></span>
              </button>`,
          )
          .join('')}
      </div>`,
    html`<div class="eyebrow">STEP 02 — WORKING CONDITIONS</div>
      <h2>What does a typical shift look like?</h2>
      <p>Set your working hours and the conditions that affect your exposure.</p>
      <div class="grid task-grid">
        <label
          >Work starts<select data-profile-field="workStart">
            <option value="09:00">9:00 AM</option>
            <option value="07:00">7:00 AM</option>
            <option value="08:00">8:00 AM</option>
          </select></label
        ><label
          >Work ends<select data-profile-field="workEnd">
            <option value="18:00">6:00 PM</option>
            <option value="16:00">4:00 PM</option>
            <option value="17:00">5:00 PM</option>
          </select></label
        >
      </div>
      <p>Physical workload</p>
      <div class="segment">
        ${['Light', 'Moderate', 'Heavy'].map((value) => html`<button data-workload="${value}" class="${state.workload === value ? 'selected' : ''}">${value}</button>`).join('')}
      </div>
      <p>Sun exposure</p>
      <div class="segment">
        ${['Direct Sunlight', 'Partial Shade', 'Mostly Shaded'].map((value) => html`<button data-env="${value}" class="${state.environment === value ? 'selected' : ''}">${value}</button>`).join('')}
      </div>
      <div class="grid task-grid">
        <label
          >Drinking water<select data-profile-field="waterAccess">
            <option value="AVAILABLE">Available</option>
            <option value="LIMITED">Limited</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select></label
        ><label
          >Shade access<select data-profile-field="shadeAccess">
            <option value="AVAILABLE">Available</option>
            <option value="LIMITED">Limited</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select></label
        >
      </div>
      <p>
        <label
          >Schedule control<select data-profile-field="scheduleFlexibility">
            <option value="EMPLOYER_CONTROLLED">Employer controlled</option>
            <option value="FIXED">Fixed</option>
            <option value="FLEXIBLE">Flexible</option>
          </select></label
        >
        <label
          ><input
            type="checkbox"
            data-toggle="alternativeDutiesAvailable"
            ${state.alternativeDutiesAvailable ? 'checked' : ''}
          />
          Alternative duties available</label
        >
      </p>`,
    html`<div class="eyebrow">STEP 03 — LOCATION & LANGUAGE</div>
      <h2>Where will you be working?</h2>
      <p>
        Choose a city or use device location to see local conditions and nearby cooling facilities.
      </p>
      <div class="search">
        <input
          id="workCity"
          placeholder="Search work area or city"
          value="${state.location?.city || 'Pune'}"
        /><button class="btn" data-action="locate">⌖ Use my location</button>
      </div>
      <h3>Preferred language</h3>
      <div class="segment">
        ${[
          ['en', 'English'],
          ['hi', 'हिंदी'],
          ['mr', 'मराठी'],
        ]
          .map(
            ([code, label]) =>
              html`<button class="${state.language === code ? 'selected' : ''}" data-lang="${code}">
                ${label}
              </button>`,
          )
          .join('')}
      </div>
      <div class="profile-row">
        Location is used for local heat and nearby cooling results. Your profile stays in this
        browser.
      </div>`,
  ];
  return html`<main class="main">
    <div class="onboard">
      <div style="text-align:center">
        <span class="badge" style="font-size:13px">☀ SunShield HEAT SAFETY COMPANION</span>
      </div>
      <div class="steps">
        ${['Your Work', 'Conditions', 'Location'].map((label, index) => html`<button class="${state.step === index + 1 ? 'active' : ''}" data-step="${index + 1}">${index + 1} ${label}</button>`).join('')}
      </div>
      <article class="card">
        <div class="eyebrow">
          Step ${state.step} of 3 • Worker preferences are saved on this device
        </div>
        <hr style="border:0;border-top:1px solid var(--line);margin:14px 0" />
        ${panels[state.step - 1]}
        <div class="row" style="margin-top:24px">
          <span class="tiny">◈ Your details personalize worker guidance.</span>
          <div>
            ${state.step > 1 ? '<button class="btn" data-action="back">Back</button> ' : ''}<button
              class="btn dark"
              data-action="next"
            >
              ${state.step === 3 ? 'Save profile' : 'Continue'} →
            </button>
          </div>
        </div>
      </article>
      <div class="grid task-grid" style="margin-top:14px">
        <div class="card">
          <b>WORKER PROFILE</b>
          <p>Preferences stored locally</p>
          <span class="tiny">No account or backend connection is required for setup.</span>
        </div>
        <div class="card">
          <b>HEAT SAFETY</b>
          <p>Backend assessment pending</p>
          <span class="tiny"
            >Protection recommendations require the shared heat intelligence service.</span
          >
        </div>
      </div>
    </div>
  </main>`;
}
export function renderMarkup() {
  return (
    header() +
    (state.page === 'connect'
      ? connect()
      : state.page === 'plan'
        ? plan()
        : state.page === 'zones'
          ? zones()
          : state.page === 'heatlab'
            ? heatlab()
            : onboarding()) +
    footerMarkup
  );
}
