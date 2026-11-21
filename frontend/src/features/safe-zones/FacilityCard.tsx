import { useTranslation } from 'react-i18next';
import type { Facility, Location } from '../../schemas/contracts';
import { Card, Button } from '../../components/common/Primitives';
import { directionsUrl } from '../../utils/safety';
export function FacilityCard({
  facility,
  origin,
  onDetails,
}: {
  facility: Facility;
  origin: Location;
  onDetails?: () => void;
}) {
  const { t } = useTranslation();
  const url = directionsUrl(origin, facility);
  return (
    <Card className="facility">
      <span className={`badge verification-${facility.verificationStatus.toLowerCase()}`}>
        {t(`enum.${facility.verificationStatus}`)}
      </span>
      <h3>{facility.name}</h3>
      <p>{t(`enum.${facility.category}`)}</p>
      <p className="small">
        {t('zones.distance')}: {facility.distanceKm.toFixed(2)} km
      </p>
      <ul className="chips">
        {facility.waterAvailable && <li>{t('enum.DRINKING_WATER')}</li>}
        {facility.shadeAvailable && <li>{t('enum.SHADED_REST_AREA')}</li>}
      </ul>
      <div className="row wrap">
        {url && (
          <a className="button" href={url} target="_blank" rel="noopener noreferrer">
            {t('zones.directions')}
          </a>
        )}
        {onDetails && <Button onClick={onDetails}>{t('ui.details')}</Button>}
      </div>
    </Card>
  );
}
