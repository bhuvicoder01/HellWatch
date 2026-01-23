const express = require('express');
require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const TARGET_URL = process.env.TARGET_URL; // The URL of your MAIN service (Service A)


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// A simple endpoint to keep this service (Service B) responsive to external pings
app.get('/', (req, res) => {
  res.status(200).send('Pinger Service B is awake and running cron tasks.');
});



app.listen(PORT, () => {
  console.log(`Pinger Service B running on port ${PORT}`);
  
  if (TARGET_URL) {
    console.log(`Scheduled pinging task for: ${TARGET_URL}`);
    
    // Schedule a task to run every 10 minutes (*/10 * * * *)
    // This wakes up Service A before Render's 15-minute timeout.
    cron.schedule('*/10 * * * *', async () => {
      try {
        console.log(`--- Pinging target service at ${new Date().toISOString()} ---`);
        const response = await axios.get(`${TARGET_URL}/ping-reverse`);
        console.log(`✅ Ping successful. Status: ${response.status}`);
      } catch (error) {
        console.error(`❌ Ping failed for ${TARGET_URL}:${error.status} ${error.message}`);
      }
    });

  } else {
    console.error("❌ CRON task not started: TARGET_URL environment variable is missing.");
  }
});

