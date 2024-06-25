const axios = require('axios');
const async = require('async');
const http = require('http');

// HTTP and HTTPS agents
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: Infinity });

// Configuration
const baseURL = 'http://Restau-LB8A1-B3rOelGQuUo6-1088538611.us-east-1.elb.amazonaws.com'; // my LB URL
const requestCount = 1; // Total number of requests to send
const concurrencyLevel = 1; // Number of concurrent requests, adjust based on system capacity

// Example Cuisines and Regions
const cuisines = ['Italian', 'Chinese', 'Indian', 'Mexican', 'American', 'Japanese', 'French', 'Thai', 'Greek', 'Mediterranean'];
const regions = ['North', 'South', 'East', 'West', 'Central'];

// Function to generate a random restaurant name
const generateRestaurantName = () => {
  const adjectives = ['Delicious', 'Tasty', 'Yummy', 'Savory', 'Flavorful'];
  const nouns = ['Bistro', 'Cafe', 'Diner', 'Eatery', 'Restaurant'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 10000)}`;
};

// Function to generate random data for requests
const generateRandomData = () => {
  return {
    name: generateRestaurantName(),
    cuisine: 'Chinese', // You can make this random if needed
    region: 'South', // You can make this random if needed
    rating: Math.floor(Math.random() * 5) + 1
  };
};

// // Function to make an HTTP request
// const makeRequest = (endpoint, done) => {
//   const startTime = Date.now();
//   axios({
//     method: endpoint.method,
//     url: `${baseURL}${endpoint.url}`,
//     data: endpoint.data || {},
//     httpAgent,
//   })
//     .then(response => {
//       const endTime = Date.now();
//       const duration = endTime - startTime;
//       console.log(`Endpoint: ${endpoint.method} ${endpoint.url} | data: ${JSON.stringify(endpoint.data)} | Response status: ${response.status}, Time Taken: ${duration} ms`);
//       done(null, duration);
//     })
//     .catch(error => {
//       const endTime = Date.now();
//       const duration = endTime - startTime;
//       console.error(`Endpoint: ${endpoint.method} ${endpoint.url} | data: ${JSON.stringify(endpoint.data)} | Error: ${error.response ? error.response.status : error.message}, Time Taken: ${duration} ms`);
//       done(error, duration);
//     });
// };

// // Main function to perform the load test
// const loadTest = () => {
//   const tasks = [];
//   for (let i = 0; i < requestCount; i++) {
//     const randomData = generateRandomData(); // Generate data once per iteration
//     console.log("randomData", randomData);
//     const endpointsForIteration = [
//       { method: 'POST', url: '/restaurants', data: randomData },
//     //   { method: 'GET', url: `/restaurants/${randomData.name}` },
//     //   { method: 'DELETE', url: `/restaurants/${encodeURIComponent(randomData.name)}` },
//     //   { method: 'POST', url: '/restaurants/rating', data: { RestaurantName: randomData.name, Rating: randomData.rating }},
//     //   { method: 'GET', url: `/restaurants/cuisine/${randomData.cuisine}` },
//     //   { method: 'GET', url: `/restaurants/region/${randomData.region}` },
//     //   { method: 'GET', url: `/restaurants/region/${randomData.region}/cuisine/${randomData.cuisine}` },
//     ];

//     // Push all endpoints for this iteration into tasks
//     endpointsForIteration.forEach(endpoint => {
//       tasks.push(done => makeRequest(endpoint, done));
//     });
//   }
//   console.log("after for");
//   async.parallelLimit(tasks, concurrencyLevel, (err, results) => {
//     if (err) {
//     //   console.error('A request failed:', err);
//     } else {
//       console.log('All requests completed successfully.');
//       const totalDuration = results.reduce((total, current) => total + current, 0);
//       const averageDuration = totalDuration / results.length;
//       console.log('Average Request Time:', averageDuration, 'ms');
//     }
//   });
// };

// Function to make an HTTP request
const makeRequest = async () => {
    const randomData = generateRandomData();
    console.log("Sending request to create restaurant with data:", randomData);
    
    try {
      const response = await axios.post(`${baseURL}/restaurants`, randomData, {
        httpAgent,
      });
      console.log('Restaurant created successfully:', response.data);
    } catch (error) {
      console.error('Error creating restaurant:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
      }
    }
  };

  // Main function to perform the load test (single request)
const loadTest = async () => {
    await makeRequest();
  };

// Start the load testing
loadTest();
