import Grid from "@mui/material/Grid";

import {
  AssessmentRounded,
  BoltRounded,
  SpeedRounded,
  TimelineRounded,
} from "@mui/icons-material";

import StatCard, { StatCardProps } from "../common/StatCard";

const kpis: StatCardProps[] = [
  {
    title: "Forecast Accuracy",
    value: "96.8%",
    subtitle: "Model prediction accuracy",
    trend: "+0.8%",
    color: "success",
    icon: <AssessmentRounded />,
  },
  {
    title: "Peak Demand",
    value: "36,120 MW",
    subtitle: "Expected peak demand",
    trend: "+1.2%",
    color: "warning",
    icon: <BoltRounded />,
  },
  {
    title: "Generation",
    value: "35,080 MW",
    subtitle: "Current generation",
    trend: "-0.3%",
    color: "primary",
    icon: <TimelineRounded />,
  },
  {
    title: "Execution Time",
    value: "4.2 s",
    subtitle: "Average processing time",
    trend: "-0.5 s",
    color: "info",
    icon: <SpeedRounded />,
  },
];

const DashboardKPIs = () => {
  return (
    <Grid container spacing={3}>
      {kpis.map((kpi) => (
      <Grid
        item
        key={kpi.title}
        xs={12}
        md={6}
        xl={3}
      >
          <StatCard {...kpi} />
        </Grid>
      ))}
    </Grid>
  );
};

export default DashboardKPIs;