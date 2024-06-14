const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const Chart = require('chart.js'); // Include Chart.js library

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', './views');

const url = 'mongodb://127.0.0.1:27017';  // MongoDB connection string
const client = new MongoClient(url);
const dbName = 'temperature_vs_time';

// Function to fetch temperature data from MongoDB
async function fetchTemperatureData() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('temptime');

    // Fetch data from MongoDB, limit to 10 most recent documents
    const cursor = collection.find().sort({ timestamp: -1 }).limit(10);
    const result = await cursor.toArray();

    return result.reverse(); // Reverse to show oldest to newest in chart
  } catch (err) {
    console.error('Error fetching data from MongoDB:', err);
    return [];
  } finally {
    await client.close();
  }
}

// Render home page with initial data
app.get('/', async function (req, res) {
  const data = await fetchTemperatureData();
  res.render('home', { temp: null, data });
});

// Endpoint to handle storing temperature data
app.post('/fetch_data', async function (req, res) {
    let a = req.body.temp;
    let now = new Date();
    
    // Convert to IST
    const hrs = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    const sec = now.getSeconds().toString().padStart(2, '0');
    const timeString = `${hrs}:${min}:${sec}`;

    async function main() {
        try {
            await client.connect();
            console.log('Connected successfully to server');
            const db = client.db(dbName);
            const collection = db.collection('temptime');
            await collection.insertOne({
                "Temperature": a,
                "Time": timeString
            });
            console.log('Data inserted successfully.');
        } catch (err) {
            console.error(err);
        } finally {
            await client.close();
        }
    }
    
    main()
        .then(() => res.redirect('/'))
        .catch(err => res.status(500).send('Error processing request.'));
});
// Render temp page with Chart.js
app.get('/temp', async (req, res) => {
    async function main() {
        try {
            await client.connect();
            console.log('Connected successfully to server');
            const db = client.db(dbName);
            const collection = db.collection('temptime');
            let data = await collection.find({}).toArray();
            let xVal = data.map(item => item.Time);
            let yVal = data.map(item => item.Temperature);
            res.render('temp', { xVal, yVal});
        } catch (err) {
            console.error(err);
            res.status(500).send('Error connecting to the database.');
        } finally {
            await client.close();
        }
    }
    
    main().catch(console.error);
});

app.listen(3000, function () {
  console.log('Server is running on port 3000');
});