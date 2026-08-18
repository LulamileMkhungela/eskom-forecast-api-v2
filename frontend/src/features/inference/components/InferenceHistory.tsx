import { useState, useMemo } from "react";
import {
  CheckCircleRounded,
  ErrorRounded,
  ScheduleRounded,
} from "@mui/icons-material";


import {
  Avatar,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";


import AppCard from "../../../components/common/AppCard";
import CardHeader from "../../../components/common/CardHeader";
import FilterBar, { FilterConfig } from "../../../components/common/FilterBar";
import ViewSwitcher, { ViewMode } from "../../../components/common/ViewSwitcher";



interface InferenceRun {

  id: number;

  station: string;

  model: string;

  scenario: string;

  duration: string;

  time: string;

  status:
  | "Completed"
  | "Running"
  | "Failed";

}



const history: InferenceRun[] = [

  {
    id: 5012,
    station: "Arnot",
    model: "Burn Forecast Model v2.4",
    scenario: "Tactical Daily",
    duration: "4.8 sec",
    time: "10:32",
    status: "Completed",
  },


  {
    id: 5011,
    station: "Kendal",
    model: "Supply Forecast Model v2.4",
    scenario: "Hot & Dry",
    duration: "6.1 sec",
    time: "09:45",
    status: "Completed",
  },


  {
    id: 5010,
    station: "Medupi",
    model: "Stockpile Forecast Model v2.3",
    scenario: "Cold & Wet",
    duration: "--",
    time: "08:20",
    status: "Running",
  },


  {
    id: 5009,
    station: "Tutuka",
    model: "Burn Forecast Model v2.2",
    scenario: "Actual",
    duration: "--",
    time: "07:15",
    status: "Failed",
  },


];


const filterConfigs: FilterConfig[] = [
  {
    name: "status",
    label: "Status",
    options: [
      { label: "Completed", value: "Completed" },
      { label: "Running", value: "Running" },
      { label: "Failed", value: "Failed" },
    ],
  },
  {
    name: "station",
    label: "Station",
    options: [
      { label: "Arnot", value: "Arnot" },
      { label: "Kendal", value: "Kendal" },
      { label: "Medupi", value: "Medupi" },
      { label: "Tutuka", value: "Tutuka" },
    ],
  },
];




const InferenceHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Filter data based on search and filters
  const filteredHistory = useMemo(() => {
    return history.filter((run) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        run.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.scenario.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = !filters.status || run.status === filters.status;

      // Station filter
      const matchesStation = !filters.station || run.station === filters.station;

      return matchesSearch && matchesStatus && matchesStation;
    });
  }, [searchTerm, filters]);


  return (

    <AppCard
      sx={{
        p: 4,
        overflow: "hidden !important",
      }}
    >


      <CardHeader
        title="Inference Execution History"
        subtitle="Previous forecasting inference runs and execution outcomes"
        action={
          <ViewSwitcher
            value={viewMode}
            onChange={setViewMode}
            options={[
              {
                value: "list",
                label: "List",
                icon: <span>📝</span>,
                tooltip: "List View",
              },
            ]}
          />
        }
      />

      <FilterBar
        filters={filterConfigs}
        onFilterChange={setFilters}
        searchPlaceholder="Search by station, model, or scenario..."
        onSearchChange={setSearchTerm}
      />

      <Stack
        spacing={3}
        mt={2}
        sx={{ maxHeight: 600, overflowY: "auto", overflowX: "hidden" }}
      >
        {filteredHistory.length === 0 ? (
          <Box py={6}>
            <Typography align="center" color="text.secondary">
              No inference runs match your filters.
            </Typography>
          </Box>
        ) : (
          filteredHistory.map((run, index) => (


            <Box
              key={run.id}
            >


              <Stack

                direction={{
                  xs: "column",
                  md: "row",
                }}

                spacing={3}

                alignItems={{
                  md: "center",
                }}

              >



                <Avatar

                  sx={{

                    bgcolor:

                      run.status === "Completed"

                        ?

                        "#E8F5E9"

                        :

                        run.status === "Running"

                          ?

                          "#FFF8E1"

                          :

                          "#FDECEC",



                    color:

                      run.status === "Completed"

                        ?

                        "success.main"

                        :

                        run.status === "Running"

                          ?

                          "warning.main"

                          :

                          "error.main",

                  }}

                >


                  {
                    run.status === "Completed"

                      ?

                      <CheckCircleRounded />

                      :

                      run.status === "Running"

                        ?

                        <ScheduleRounded />

                        :

                        <ErrorRounded />

                  }


                </Avatar>





                <Box
                  flex={1}
                >


                  <Typography
                    fontWeight={700}
                  >

                    Inference #{run.id}

                  </Typography>



                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >

                    {run.station} • {run.model}

                  </Typography>



                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >

                    Scenario: {run.scenario}

                  </Typography>


                </Box>





                <Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >

                    Duration

                  </Typography>


                  <Typography
                    fontWeight={600}
                  >

                    {run.duration}

                  </Typography>


                </Box>





                <Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >

                    Executed

                  </Typography>


                  <Typography
                    fontWeight={600}
                  >

                    {run.time}

                  </Typography>


                </Box>





                <Chip

                  label={run.status}

                  size="small"

                  color={

                    run.status === "Completed"

                      ?

                      "success"

                      :

                      run.status === "Running"

                        ?

                        "warning"

                        :

                        "error"

                  }

                />



              </Stack>



              {
                index < filteredHistory.length - 1 &&
                (
                  <Divider
                    sx={{
                      mt: 3,
                    }}
                  />
                )
              }



            </Box>


          ))
        )
        }



      </Stack>


    </AppCard>

  );

};


export default InferenceHistory;