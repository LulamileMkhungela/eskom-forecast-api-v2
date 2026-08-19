# Complete Element-by-Element Data Source Investigation

**Date:** 19 August 2026  
**Scope:** Every Forecast page element + every Model Performance page element  
**Method:** Read `main.py`, `src/ui.py`, `docs/ARCHITECTURE.md`, and each TSX/service file.  
**This file corrects a common mistake:** there is **no** `GET /api/entities` in this repo.

---

## How live forecast data actually works

1. Frontend `ForecastService` calls **`GET /api/scenario-data`** (`forecast.service.ts`).
2. `main.py` `scenario_data()` → `src/ui.py` `get_scenario_predictions_json()`.
3. Reads Gold parquet `{daily,monthly}/scenario_predictions.parquet` (Azure or local gold dir).
4. Records: `entity_id`, `event_date`, `horizon_step`, `scenario_id`, `Input` (burn), `Replenishment` (supply), `Stockpile`, `label`.
5. Frontend filters by horizon array, mapped `scenario_id`, `entity_id`, then **computes** mean / max / sum / count / % in the browser.

`GET /api/forecast-data` exists (`predictions.parquet`) but **Forecast cards/charts do not call it**.

Power stations are **not** a dedicated API. `getEntities()` unique-sorts `entity_id` from the **same** `scenario-data` payload.

---

## Backend APIs that exist (`main.py`)

| Method | Path | Backend | What it exposes |
|---|---|---|---|
| GET | `/api/scenario-data` | `get_scenario_predictions_json` | `{ daily, monthly }` scenario forecasts — **primary Forecast UI** |
| GET | `/api/forecast-data` | `get_predictions_json` | `{ daily, monthly }` baseline predictions — **unused by Forecast service** |
| GET | `/api/weather-data` | `get_weather_json` | daily weather series (Open-Meteo cache) |
| GET | `/api/forecast-metrics` | `get_metrics_json` | RMSE/MAE/SMAPE/R2/NRMSE per entity/target |
| GET | `/api/forecast-metrics-by-step` | `get_metrics_by_step_json` | per-step metrics — **not used by ModelAccuracyMatrix** |
| GET | `/api/oot-history` | `get_oot_history_json` | actual vs predicted history |
| GET | `/api/inference-monitoring` | event log | raw events |
| GET | `/api/inference-monitoring/summary` | computed in `main.py` | ops KPIs |
| POST | `/api/run-forecast` | pipeline | trigger |
| GET | `/healthz` | — | health |

**Does not exist:** `/api/entities`, `/api/accuracy-trend`, `/api/model-versions`.

Docs folder (`ARCHITECTURE.md`, `RUNBOOK.md`) describes AKS/SQL/blob topology, not UI mock vs live. Gold/metrics parquet is model output, not React fixtures.

---

## SECTION 1 — Forecast Context bar

**File:** `frontend/src/components/layout/ForecastContextBar.tsx`  
**State:** `ForecastContext.tsx` defaults **hardcoded**: `daily`, `burn`, `entity_1`, `actual`.

### 1.1 Horizon

- Options **hardcoded**: Tactical (Daily) / Strategic (Monthly).
- Selection is React state. No API.
- Effect: picks `scenarioData.daily` vs `.monthly`.
- Status: dynamic **selection**, static **labels**. Acceptable.

### 1.2 Metric

- Options **hardcoded**: Burn / Supply / Stockpile Predictions.
- Maps to `Input` / `Replenishment` / `Stockpile`.
- Status: dynamic selection, static labels.

### 1.3 Power Station

- Options **dynamic**: unique `entity_id` from `GET /api/scenario-data` via `useForecastEntities()` → `forecastService.getEntities()` (client extract, **not** `/api/entities`).
- Labels = raw ids.
- Default `entity_1` is hardcoded; bar replaces it with first real id if missing.
- Status: **dynamic list**.

### 1.4 Scenario

- Options **hardcoded** ids: `actual`, `hotdry`, `hotwet`, `colddry`, `coldwet`.
- Mapped in service: `actual` → `actual`, `hotdry` → `weather_hot_dry`, etc.
- Data rows for those ids are **dynamic** in parquet.
- New backend scenario_id will not appear until the menu is updated.

Export CSV / Reset: actions. Titles: static copy.

---

## SECTION 2 — Average Forecast / Peak / Volume / Horizon (KPI row)

**File:** `ForecastStatistics.tsx` → `useForecastStatistics` → `getStatistics`.

| Card | Dynamic? | Formula | API |
|---|---|---|---|
| **Average Forecast** | Yes | mean(metric series) | `GET /api/scenario-data` then client |
| **Peak Forecast** | Yes | max(series) | same |
| **Projected Volume** | Yes | sum(series) | same |
| **Forecast Horizon** | Yes (count) | `records.length` | same — **not** the filter enum |
| Sparkline | Yes | same series | same |
| Titles / colours / icons | Hardcoded UI | — | — |
| Units | Filter-driven | t/day vs tonnes | — |

Empty → zeros. Error card is static text.

Legacy `components/dashboard/ForecastMetrics.tsx`: same `getStatistics` (metric forced burn). Its “Forecast Horizon” is the **filter word** Daily/Monthly, not the count.

---

## SECTION 3 — Average Burn, Peak Burn, Horizon Trend, Periods

**File:** `ForecastTrendChart.tsx` → `useForecastChart` → same filtered `scenario-data`.

Always plots **burn = Input**, **supply = Replenishment**. Ignores Metric=stockpile for the lines.

| Element | Dynamic? | Formula / source |
|---|---|---|
| Title Tactical Daily / Strategic Monthly Burn Forecast | Horizon filter + hardcoded “Burn Forecast” | — |
| Subtitle | Hardcoded copy | — |
| Days/Months badge | Yes | `chartData.length` |
| “Forecast Generated” | **Hardcoded badge** | not a backend status |
| Chart type toggle | Local UI | — |
| Burn line | Yes | `Input` |
| Supply line | Yes | `Replenishment` |
| **Average Burn** | **Yes** | mean(Input) |
| **Peak Burn** | **Yes** | max(Input) |
| **Horizon Trend** | **Yes** | (last−first)/|first| × 100 + increase/decrease |
| **Periods** | **Yes** | `chartData.length` |
| Lowest Projected | Yes | min(Input) |
| Avg Supply | Yes | mean(Replenishment) |
| Peak Projected + date | Yes | max(Input) + date |
| Unit **t/day** | **Hardcoded even on monthly** | display only |

No mock arrays in this file.

---

## SECTION 4 — Baseline Average, Actual, Scenario Impact, Scenario Average

**File:** `ScenarioComparison.tsx` (duplicate UI in `ScenarioTrendChart.tsx`).

`GET /api/scenario-data`. Baseline = `scenario_id === "actual"`. Scenario = mapped filter id.

| Element | Dynamic? |
|---|---|
| Periods badge | Yes — unique dates |
| **Baseline Average** | Yes — mean of metric on actual |
| Selected scenario value (label Actual / Hot & Dry / …) | Yes — mean on that `scenario_id` |
| **Scenario Impact** | Yes — % vs baseline |
| Chart baseline vs scenario | Yes |
| Footer Baseline Average / {Scenario} Average | Yes — same means |
| Colour/label maps | Hardcoded presentation |

If Scenario filter is already Baseline, both series are actual → impact ~0. Still live, not mock.

OOT **Actual** / **Actual Average** are **not** on this card. They are on Model Performance (`Input_actual` etc. from `/api/oot-history`).

---

## SECTION 5 — Forecast Insights

**File:** `ForecastInsights.tsx` → `useForecastChart`.

| Element | Dynamic? |
|---|---|
| Peak Burn | Yes max(Input) |
| Peak vs Average | Yes % |
| Lowest Stockpile | Yes min(Stockpile) |
| Stockpile Risk | Yes count Stockpile < 0 |
| Narrative average/peak burn | Yes |
| Operational banner | Yes from negative count |

Stations via `useForecastEntities()` (same scenario-data extract).

---

## SECTION 6 — Other Forecast widgets (mounted on `ForecastOverview`)

| Widget | File | Dynamic? | API |
|---|---|---|---|
| Weather Intelligence | `WeatherIntelligence.tsx` | Yes (FE aggregates) | `GET /api/weather-data` |
| Weather Summary / Outlook / Signals | those files | Yes | weather-data |
| Stockpile Trajectory | `StockpileTrajectory.tsx` | Yes Stockpile series | scenario-data |
| Station Fleet | `StationFleetOverview.tsx` | Yes ids + avg Input/Replenishment (`actual`) | scenario-data |
| Weather Correlation | `WeatherCorrelation.tsx` | Yes | weather + forecast dates |
| Export | `ExportForecast.tsx` | Yes filtered rows | scenario-data |

There is **no** `CurrentWeather.tsx` / `WeatherForecast.tsx` / `WeatherAlerts.tsx` in this repo.

---

## SECTION 7 — Forecast files that are unused / mock

| File | Verdict |
|---|---|
| `ForecastHeader.tsx` | **Not** on ForecastPage. Chips **96.8% Accuracy**, **Last Run • Today 09:42**, **Engine Online** are **MOCK**. |
| `ForecastHistory.tsx` | Unused. Mock Kendal/Matimba/Medupi/Tutuka. |
| `ForecastFilterBar.tsx` | Unused. Hardcoded Kendal/Matla/Tutuka/Lethabo. |
| `ForecastTable.tsx` | Unused. Mock rows + hardcoded “Arnot • …” string. |

`ForecastTrend.tsx` / `ForecastComparison.tsx` / `ForecastResults.tsx` / `ForecastChart.tsx` bind `scenario-data` if mounted; Overview uses TrendChart + ScenarioComparison, not all of these.

---

## SECTION 8 — Model Performance (active page)

**Page:** `ModelPerformancePage.tsx` mounts: Context bar + Evaluation View + `ModelPerformanceKPIs` + `OotPerformanceChart` + `CumulativeBurnHistory` + `ModelAccuracyMatrix`.

Horizon/metric/station come from the **same ForecastContext**. Horizon toggle **is enabled** (not disabled). Metric maps: burn→Input, supply→Replenishment, stockpile→Stockpile.

### 8.1 ModelPerformanceKPIs (the live KPI row)

**Not** “Model Accuracy 96.8% / MAE 85 / RMSE 120”. Those literals are only on unused `ModelPerformanceStatistics.tsx`.

| Card | Dynamic? | Source |
|---|---|---|
| **Average RMSE** | Yes | mean(`rmse`) of `GET /api/forecast-metrics` after entity + horizon filter |
| **Average MAE** | Yes | mean(`mae`) |
| **Average NRMSE** | Yes | mean(`nrmse`) + Strong/Review/Attention from thresholds |
| **Average R²** | Yes | mean(`r2`) |
| SMAPE | Computed, **hidden** (`display: none`) | `smape` |

Horizon filter uses backend values **`tactical` / `strategic`**, not `daily` / `monthly`.

### 8.2 OotPerformanceChart

- `GET /api/oot-history`.
- Lines: **Actual** / **Predicted** from `{Input|Replenishment|Stockpile}_actual/_predicted`.
- Point count badge dynamic.
- No footer “Actual Average” card in this file (unlike the pasted template).

### 8.3 CumulativeBurnHistory

- Same `/api/oot-history`.
- Running sum of actual vs predicted for selected metric.

### 8.4 ModelAccuracyMatrix

- **`GET /api/forecast-metrics`**, **not** `/api/forecast-metrics-by-step`.
- Table: station × Burn/Supply/Stockpile cells RMSE, MAE, SMAPE or R², NRMSE.
- Station list from metrics `entity_id`.
- NRMSE colour bands hardcoded thresholds (≤25 / ≤50 / >50).

---

## SECTION 9 — Model Performance unused / mock

| File | Verdict |
|---|---|
| `ModelPerformanceStatistics.tsx` | **MOCK** 98.6% / 85 / 120 / 96.8%. Not imported by the page. |
| `AccuracyTrend.tsx` | Mock monthly accuracy. Unused. |
| `ModelComparison.tsx` | Mock model versions. Unused. |
| `ErrorAnalysis.tsx` | Mock weekly errors. Unused. |
| `PerformanceHistory.tsx` | Mock run list. Unused. |
| `PowerStationsPage.tsx` | Placeholder title only. |

---

## Requested elements — one-line answers

| Element | Live? | Where | API / field |
|---|---|---|---|
| Horizon / Metric / Scenario menus | Options hardcoded; selection live | Context bar | filters scenario-data |
| Power Station list | Live | Context bar + fleet | unique `entity_id` on scenario-data |
| Average Forecast | Live | KPI row | mean of Input/Repl/Stock |
| Peak Forecast | Live | KPI row | max |
| Projected Volume | Live | KPI row | sum |
| Forecast Horizon (KPI) | Live count | KPI row | record length |
| **Average Burn** | Live | Trend strip | mean(Input) |
| **Peak Burn** | Live | Trend strip + Insights | max(Input) |
| **Horizon Trend** | Live | Trend strip | first→last % |
| **Periods** | Live | Trend strip | count |
| **Baseline Average** | Live | Scenario Comparison | mean where scenario_id=actual |
| Scenario / “Actual” series | Live | Scenario Comparison | mapped scenario_id |
| **Scenario Impact** | Live | Scenario Comparison | % vs baseline |
| Scenario Average | Live | Scenario Comparison footer | mean selected |
| **Actual** (OOT) | Live | OOT + Cumulative | `*_actual` on oot-history |
| **Actual Average** | Not a dedicated Forecast card | would be mean of OOT actual | oot-history |
| Weather tiles | Live | Weather Intelligence | weather-data |
| Dashboard 96.8% / 36,120 MW | **Mock** | `DashboardKPIs.tsx` | none |
| Header 96.8% / 09:42 | **Mock** | unused ForecastHeader | none |
| MP unused 96.8% cards | **Mock** | unused statistics | none |

---

## Code comments added

`DYNAMIC` / `MOCK` / `DATA SOURCE` notes are on:

- `forecast.service.ts`, `ForecastContext.tsx`, `ForecastContextBar.tsx`
- `ForecastStatistics.tsx`, `ForecastTrendChart.tsx`, `ScenarioComparison.tsx`, `ForecastInsights.tsx`
- `ForecastMetrics.tsx`, `DashboardKPIs.tsx`, `ForecastHeader.tsx`, `StationFleetOverview.tsx`
- `model-performance.service.ts`, `ModelPerformanceKPIs.tsx`, `OotPerformanceChart.tsx`, `CumulativeBurnHistory.tsx`, `ModelAccuracyMatrix.tsx`, `ModelPerformanceStatistics.tsx`

---

## Verdict (verify against this, not the pasted template)

- **Active Forecast numbers are live client aggregates of `GET /api/scenario-data`.** No mock series on Overview cards.
- **There is no `/api/entities`.** Stations come from scenario-data `entity_id`.
- **Active Model Performance KPIs are RMSE/MAE/NRMSE/R² from `GET /api/forecast-metrics`**, not 96.8% mock cards.
- **OOT Actual vs Predicted is live** from `GET /api/oot-history`.
- **Hardcoded leftovers:** filter option lists, `entity_1` default, t/day on monthly trend, unused History/Table/FilterBar/Header, unused MP prototypes, Dashboard home KPIs.
- **`/api/forecast-metrics-by-step` is not wired** to the accuracy matrix (matrix uses overall metrics).
