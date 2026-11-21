import { AlertTriangle, PhoneCall, Snowflake, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/ui/Badge';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function EmergencyPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-sunshield-cloud px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-7 flex items-start gap-4 sm:mb-9">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-800">
            <ShieldAlert aria-hidden="true" size={25} />
          </span>
          <div>
            <Badge tone="critical">SunShield · Field support</Badge>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('sos.title')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              {t('sos.subtitle')}
            </p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <Card className="border-red-200 bg-red-50/70">
            <AlertTriangle aria-hidden="true" className="text-red-800" size={25} />
            <h2 className="mt-4 font-display text-xl font-semibold">{t('sos.warningSigns')}</h2>
            <p className="mt-3 min-h-14 leading-7 text-slate-700">{t('sos.signs')}</p>
            <ButtonLink className="mt-5 w-full" href="tel:112" variant="critical">
              <PhoneCall aria-hidden="true" size={18} />
              {t('sos.callAction')}
            </ButtonLink>
          </Card>

          <Card>
            <Snowflake aria-hidden="true" className="text-teal-800" size={25} />
            <h2 className="mt-4 font-display text-xl font-semibold">{t('sos.cool')}</h2>
            <p className="mt-3 leading-7 text-slate-700">{t('sos.coolText')}</p>
            <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              {t('sos.fluids')}
            </p>
          </Card>
        </section>

        <p className="my-5 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          {t('sos.notice')}
        </p>
        <Button onClick={() => history.back()} variant="secondary">
          ← Back to SunShield
        </Button>
      </div>
    </main>
  );
}
