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
  Paper,
  Stack,
  Typography,
} from "@mui/material";


import AppCard from "../../../components/common/AppCard";
import CardHeader from "../../../components/common/CardHeader";



interface PerformanceRun {

  id:number;

  model:string;

  period:string;

  accuracy:string;

  time:string;

  status:
    | "Completed"
    | "Running"
    | "Failed";

}



/* MOCK evaluation runs 98.6%. UNUSED. */
const history: PerformanceRun[] = [

  {
    id:2048,
    model:"Burn Forecast Model v2.4",
    period:"July 2026",
    accuracy:"98.6%",
    time:"09:42",
    status:"Completed",
  },


  {
    id:2047,
    model:"Burn Forecast Model v2.3",
    period:"June 2026",
    accuracy:"97.9%",
    time:"08:15",
    status:"Completed",
  },


  {
    id:2046,
    model:"Burn Forecast Model v2.4",
    period:"May 2026",
    accuracy:"--",
    time:"07:30",
    status:"Running",
  },


  {
    id:2045,
    model:"Burn Forecast Model v2.2",
    period:"April 2026",
    accuracy:"--",
    time:"06:55",
    status:"Failed",
  },

];



const PerformanceHistory = () => {


  return (

    <AppCard
      sx={{
        p:4,
      }}
    >


      <CardHeader
        title="Performance History"
        subtitle="Previous model evaluation runs and outcomes"
      />



      <Stack
        spacing={2}
        mt={4}
      >


        {
          history.map((item,index)=>(

            <Box
              key={item.id}
            >


              <Stack
                direction="row"
                spacing={3}
                alignItems="center"
              >



                <Avatar
                  sx={{

                    bgcolor:
                      item.status === "Completed"
                      ? "#E8F5E9"
                      : item.status === "Running"
                      ? "#FFF8E1"
                      : "#FDECEC",


                    color:
                      item.status === "Completed"
                      ? "#2E7D32"
                      : item.status === "Running"
                      ? "#F9A825"
                      : "#D32F2F",

                  }}
                >

                  {
                    item.status === "Completed"
                    ?
                    <CheckCircleRounded />

                    :
                    item.status === "Running"
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
                    Evaluation #{item.id}
                  </Typography>


                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {item.model}
                  </Typography>


                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Evaluation Period: {item.period}
                  </Typography>


                </Box>





                <Box>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Accuracy
                  </Typography>


                  <Typography
                    fontWeight={700}
                  >
                    {item.accuracy}
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
                    {item.time}
                  </Typography>


                </Box>




                <Chip
                  label={item.status}
                  size="small"
                  color={
                    item.status === "Completed"
                    ? "success"
                    : item.status === "Running"
                    ? "warning"
                    : "error"
                  }
                />


              </Stack>



              {
                index < history.length - 1 &&
                (
                  <Divider
                    sx={{
                      mt:3,
                    }}
                  />
                )
              }


            </Box>

          ))
        }


      </Stack>


    </AppCard>

  );

};


export default PerformanceHistory;