# UI data investigation — dynamic vs hardcoded

Audit date: 2026-08-19. Scope: every Forecast page filter/card/text plus related dashboard, model-performance, and inference screens. Goal: say for each element **where the number comes from**, **which API/service**, **what we expose**, and **whether it is live or mock**.

## How the live forecast path works

There is **no mock forecast series** on the Forecast page. There is also **no backend KPI endpoint** for Average Burn / Peak / Volume. The UI:

1. Calls `GET /api/scenario-data` (`ForecastService.getScenarioData`).
2. Backend `main.py` → `src/ui.py` `get_scenario_predictions_json()` reads Gold parquet `{daily,monthly}/scenario_predictions.parquet` (Azure blob or local `config.local_gold_dir`).
3. Each record has `entity_id`, `event_date`, `horizon_step`, `scenario_id`, `Input` (burn), `Replenishment` (supply), `Stockpile`, `label`.
4. Frontend filters by horizon (daily vs monthly array), `scenario_id` (mapped from the Scenario dropdown), and `entity_id`.
5. Cards **recompute** mean / max / sum / count / % delta in the browser.

`GET /api/forecast-data` exists (`get_predictions_json` → `{daily,monthly}/predictions.parquet`) but **Forecast cards do not use it**. Entities, charts, and stats all go through scenario-data so Baseline and what-if share one payload.

Weather: `GET /api/weather-data?entity_id=` → Open-Meteo cache (`src/ui.py` `get_weather_json` / `training/weather.py`). Not mock.

Model metrics (when wired): `GET /api/forecast-metrics`, `GET /api/forecast-metrics-by-step`, `GET /api/oot-history` from metrics parquet.

Ops: `GET /api/inference-monitoring`, `GET /api/inference-monitoring/summary`, `POST /api/run-forecast`.

---

## Forecast Context bar (filters)

File: `frontend/src/components/layout/ForecastContextBar.tsx`  
State: `frontend/src/contexts/ForecastContext.tsx` (defaults **hardcoded**: `daily`, `burn`, `entity_1`, `actual`)

| Control | Options source | Selected value | Affects live data? |
|---|---|---|---|
| **Horizon** | **Hardcoded** menu: Tactical Daily / Strategic Monthly | React state | Yes — picks `scenarioData.daily` vs `.monthly` |
| **Metric** | **Hardcoded** menu: Burn / Supply / Stockpile | React state | Yes — maps to `Input` / `Replenishment` / `Stockpile` |
| **Power Station** | **Dynamic** unique `entity_id` from `GET /api/scenario-data` via `useForecastEntities` | React state | Yes — record filter (or all-station sum) |
| **Scenario** | **Hardcoded** ids: `actual`, `hotdry`, `hotwet`, `colddry`, `coldwet` mapped to backend `actual`, `weather_hot_dry`, … | React state | Yes — `scenario_id` filter |
| Export CSV | Action only | Uses current filters | Writes whatever filtered records are |
| Reset | Action | Restores defaults / first entity | — |
| Title / subtitle | Hardcoded copy | — | — |

Finding: filter **labels** are static product copy. Station **list** is live. Filter **values** only change which backend rows are aggregated — they are not themselves API fields.

---

## Forecast KPI row

File: `ForecastStatistics.tsx` → `useForecastStatistics` → `ForecastService.getStatistics`

| Card | Dynamic? | Formula | API | Exposed fields |
|---|---|---|---|---|
| **Average Forecast** | **Yes** | mean(metric series) | `GET /api/scenario-data` then client mean | `average` |
| **Peak Forecast** | **Yes** | max(metric series) | same | `peak` |
| **Projected Volume** | **Yes** | sum(metric series) | same | `projectedVolume` |
| **Forecast Horizon** | **Yes (count)** | `records.length` | same | `horizon` (integer days/months, **not** the filter enum) |
| Sparkline | **Yes** | same series | same | — |
| Units / subtitles | Hardcoded templates | `t/day` vs `tonnes` from filter | — | — |

Empty series → zeros. Error card is static copy.

Legacy/alternate: `components/dashboard/ForecastMetrics.tsx` — same `getStatistics` (metric forced to burn). Its “Forecast Horizon” text is the **filter label** Daily/Monthly, not the count. `ForecastTrend.tsx` has another Average/Peak/Horizon strip from the same hook.

---

## Forecast Trend chart strip

File: `ForecastTrendChart.tsx` → `useForecastChart` → same filtered `scenario-data` rows. Burn always `Input`; supply always `Replenishment` (stockpile **not** plotted here even if Metric=stockpile).

| Element | Dynamic? | Formula |
|---|---|---|
| Title “Tactical Daily / Strategic Monthly Burn Forecast” | Horizon filter only | Hardcoded strings + filter |
| Days/Months badge | **Yes** | `chartData.length` |
| “Forecast Generated” badge | **Hardcoded** label | Not a backend status |
| Chart type toggle | Local UI state | — |
| Chart lines Burn / Supply | **Yes** | `Input`, `Replenishment` |
| **Average Burn** | **Yes** | mean(Input) |
| **Peak Burn** | **Yes** | max(Input) |
| **Horizon Trend** | **Yes** | (last−first)/|first| × 100 |
| **Periods** | **Yes** | point count |
| Lowest Projected | **Yes** | min(Input) |
| Avg Supply | **Yes** | mean(Replenishment) |
| Peak Projected + date | **Yes** | max(Input) + that date |
| Unit “t/day” | **Hardcoded** even on monthly | Display only |

No mock arrays in this file.

---

## Scenario Comparison

File: `ScenarioComparison.tsx` → `forecastService.getScenarioData()` (`GET /api/scenario-data`). Duplicate logic also in `ScenarioTrendChart.tsx`.

| Element | Dynamic? | Source |
|---|---|---|
| Periods count | **Yes** | unique dates after join |
| **Baseline Average** | **Yes** | mean of metric where `scenario_id === "actual"` |
| Selected scenario average (label Actual / Hot & Dry / …) | **Yes** | mean of mapped `scenario_id` |
| **Scenario Impact** | **Yes** | % vs baseline |
| Chart baseline vs scenario | **Yes** | same rows |
| Footer Baseline / Scenario Average | **Yes** | same means |
| Scenario colour/label maps | Hardcoded | presentation |

If Scenario filter is already Baseline (`actual`), both series are the same actual rows — impact ~0. Not mock.

---

## Forecast Insights

File: `ForecastInsights.tsx` → `useForecastChart` (`scenario-data`).

| Card / text | Dynamic? |
|---|---|
| Peak Burn | **Yes** max(Input) |
| Peak vs Average | **Yes** % |
| Lowest Stockpile | **Yes** min(Stockpile) |
| Stockpile Risk | **Yes** count of Stockpile < 0 |
| Narrative “average burn of X / highest Y” | **Yes** |
| Operational attention banner | **Yes** from negative period count |

---

## Other Forecast page widgets

| Widget | File | Dynamic? | API |
|---|---|---|---|
| Weather Intelligence / Outlook / Signals | `WeatherIntelligence.tsx` + `weather.service.ts` | **Yes** (aggregates in FE) | `GET /api/weather-data` |
| Stockpile Trajectory | `StockpileTrajectory.tsx` | **Yes** Stockpile series | `scenario-data` |
| Station Fleet | `StationFleetOverview.tsx` | **Yes** entities + sums | `scenario-data` |
| Weather Correlation | `WeatherCorrelation.tsx` | **Yes** aligned dates | `weather-data` + forecast records |
| Export | `ExportForecast.tsx` | **Yes** filtered rows | `scenario-data` |
| Forecast History | `ForecastHistory.tsx` | **MOCK** Kendal/Matimba rows | unused / not on overview |
| Forecast Table “Arnot • …” | `ForecastTable.tsx` | mixed — table can bind records; some header copy hardcoded | — |
| ForecastHeader “96.8% Accuracy” | `ForecastHeader.tsx` | **MOCK** | — |

---

## Dashboard (non-forecast home)

| Element | File | Verdict |
|---|---|---|
| Forecast Accuracy 96.8%, Peak Demand 36,120 MW, Generation 35,080 MW, Execution Time 4.2 s | `DashboardKPIs.tsx` | **MOCK** |
| StationHealth 96.8% | `StationHealth.tsx` | **MOCK** |
| ForecastMetrics Average/Peak | `ForecastMetrics.tsx` | **Dynamic** via `scenario-data` |

---

## Model Performance

| Element | File | Verdict | API |
|---|---|---|---|
| Average RMSE / MAE / NRMSE / R² | `ModelPerformanceKPIs.tsx` | **Dynamic** (when metrics parquet exists) | `GET /api/forecast-metrics` |
| OOT Actual vs Predicted | `OotPerformanceChart.tsx`, `CumulativeBurnHistory.tsx` | **Dynamic** | `GET /api/oot-history` |
| Model Accuracy 98.6%, MAE 85, RMSE 120, Confidence 96.8% | `ModelPerformanceStatistics.tsx` | **MOCK** | none |
| AccuracyTrend / ModelComparison 96.8% | those components | **MOCK** | none |

---

## Inference / monitoring

| Element | Verdict | API |
|---|---|---|
| Monitoring summary cards (runs, success, failed, resources) | **Dynamic** | `GET /api/inference-monitoring/summary` |
| Event / resource tables | **Dynamic** | `GET /api/inference-monitoring` |
| Run Forecast button | **Dynamic** action | `POST /api/run-forecast` |
| `ApiMetrics` 12,540 / 99.2% / 320ms | **MOCK** | none |
| `InferenceHistory` demo rows | **MOCK** (file comments say so) | none |
| `InferenceStatistics` health copy | mostly static presentation | — |

---

## Backend catalogue (what we expose)

| Method | Path | Implementation | Payload |
|---|---|---|---|
| GET | `/api/forecast-data` | `get_predictions_json` | `{ daily, monthly }` baseline predictions — **not used by Forecast cards** |
| GET | `/api/scenario-data` | `get_scenario_predictions_json` | `{ daily, monthly }` **primary Forecast UI source** |
| GET | `/api/forecast-metrics` | `get_metrics_json` | RMSE/MAE/MAPE/… |
| GET | `/api/forecast-metrics-by-step` | `get_metrics_by_step_json` | per-step metrics |
| GET | `/api/oot-history` | `get_oot_history_json` | actual vs predicted history |
| GET | `/api/weather-data` | `get_weather_json` | daily weather series |
| GET | `/api/inference-monitoring` | `get_events` | raw events |
| GET | `/api/inference-monitoring/summary` | computed in `main.py` | dashboard ops summary |
| POST | `/api/run-forecast` | `_run_monitored_forecast` | trigger |
| POST | `/api/ingest-bronze-data` | SQL → bronze | ops |
| POST | `/api/refresh-weather-cache` | Open-Meteo | ops |
| POST | `/api/initialize` | full pipeline | ops |
| GET | `/api/initialize-progress` | in-memory | ops |
| GET | `/api/db-operations` | ingest log | ops |
| GET | `/healthz` | `{status: ok}` | k8s |

Gold/metrics files are **model output**, not hand-written UI fixtures. `src/generate_mock_data.py` is a pipeline helper, not what the React cards import.

---

## Findings / caveats (verify these)

1. **Forecast numbers are live aggregates, not a second mock layer.** If a card looks “wrong”, check parquet + filters, not a JSON fixture.
2. **KPI formulas live in the browser**, not the API. Two cards can disagree if they use different filters (e.g. Trend strip always burn; Statistics follow Metric).
3. **Trend chart always plots burn+supply** and always labels **t/day**, ignoring Metric and monthly horizon.
4. **`/api/forecast-data` is unused** by the current Forecast service.
5. **Default station `entity_1`** is hardcoded until entities load; bar then snaps to first real id.
6. **Scenario option list is static**; if Gold gains a new `scenario_id`, the dropdown will not show it until code changes.
7. **Dashboard home + some Model Performance / Inference cards remain mock** (96.8%, 36,120 MW, 12,540 requests). Do not use those to validate backend pull.

Code comments marked `DYNAMIC` / `MOCK` / `DATA SOURCE` were added on the files above so each element can be verified in-place.
