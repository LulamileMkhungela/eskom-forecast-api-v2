import { Stack, Typography } from "@mui/material";

import ForecastContextBar from "../../../components/forecast/ForecastContextBar";

/*
 * MOCK UI COMMENTED OUT — these components use hardcoded arrays
 * (Healthy, 10 min, 12,540 requests, fake pipeline times).
 *
 * Live ops UI is /inference-monitoring:
 *   GET /api/inference-monitoring
 *   GET /api/inference-monitoring/summary
 *   POST /api/run-forecast
 *
 * Uncomment the blocks below ONLY after data engineering exposes
 * dedicated endpoints for this page (or after you rewire each
 * component to the monitoring APIs above).
 *
 * import InferenceStatistics from "../components/InferenceStatistics";
 * import PipelineStatus from "../components/PipelineStatus";
 * import ResourceLogs from "../components/ResourceLogs";
 * import ApiMetrics from "../components/ApiMetrics";
 * import InferenceHistory from "../components/InferenceHistory";
 * import ErrorMonitor from "../components/ErrorMonitor";
 */

/** ROUTE /inference. Only dynamic chrome (context bar) is shown. */
const InferencePage = () => {
  return (
    <Stack
      spacing={4}
      sx={{
        pb: 4,
      }}
    >
      <ForecastContextBar />

      <Typography color="text.secondary">
        This page no longer renders mock health / pipeline / API metrics.
        Use Inference Monitoring for live run, latency and resource data
        (GET /api/inference-monitoring/summary).
      </Typography>

      {/*
        MOCK — uncomment when DE wires real APIs (or point these
        components at /api/inference-monitoring/summary):
        - InferenceStatistics: needs health, last-run timestamp
        - PipelineStatus: needs per-step pipeline events
        - ResourceLogs: needs resource activity stream
        - ApiMetrics: needs request volume / latency (not in current API)
        - InferenceHistory: needs run list (summary.runs already exists)
        - ErrorMonitor: needs failed/warning events (already on monitoring)

        <InferenceStatistics />
        <PipelineStatus />
        <ResourceLogs />
        <ApiMetrics />
        <InferenceHistory />
        <ErrorMonitor />
      */}
    </Stack>
  );
};

export default InferencePage;
