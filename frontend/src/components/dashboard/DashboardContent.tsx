import Grid from "@mui/material/Grid";

import ForecastTrend from "./ForecastTrend";
import RecentForecasts from "./RecentForecasts";

/*
 * MOCK UI COMMENTED OUT — do not show until DE / product wires APIs:
 *   DashboardKPIs  — 96.8%, 36,120 MW, 35,080 MW, 4.2 s (no endpoint)
 *   StationHealth  — 47 200 MW, 96.8% (no endpoint)
 *   WeatherSummary — 24°C / 18 km/h (use GET /api/weather-data instead)
 *
 * import DashboardKPIs from "./DashboardKPIs";
 * import StationHealth from "./StationHealth";
 * import WeatherSummary from "./WeatherSummary";
 */

/** DYNAMIC only: ForecastTrend + RecentForecasts → GET /api/scenario-data. */
const DashboardContent = () => {
  return (
    <Grid
      container
      spacing={{
        xs: 2,
        md: 3,
      }}
    >
      {/*
        MOCK — uncomment when DE provides:
        GET accuracy / peak demand / generation / execution-time
        <Grid item xs={12}>
          <DashboardKPIs />
        </Grid>
      */}

      <Grid item xs={12} lg={8}>
        <ForecastTrend />
      </Grid>

      {/*
        MOCK — uncomment when DE provides station capacity / availability
        <Grid item xs={12} lg={4}>
          <StationHealth />
        </Grid>
      */}

      <Grid item xs={12} lg={8}>
        <RecentForecasts />
      </Grid>

      {/*
        MOCK — uncomment when this card is switched to GET /api/weather-data
        <Grid item xs={12} lg={4}>
          <WeatherSummary />
        </Grid>
      */}
    </Grid>
  );
};

export default DashboardContent;
