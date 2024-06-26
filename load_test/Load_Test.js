const axios = require('axios');
const async = require('async');
const http = require('http');

// HTTP agent configuration
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: Infinity });

// Configuration
const baseURL = 'http://Restau-LB8A1-smqXVqZogCE9-873483369.us-east-1.elb.amazonaws.com'; // my load balancer URL
const requestCount = 100; // Total number of requests to send
const concurrencyLevel = 2; // Number of concurrent requests

// Example cuisines and regions
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
    cuisine: cuisines[Math.floor(Math.random() * cuisines.length)],
    regional: regions[Math.floor(Math.random() * regions.length)],
    rating: Math.floor(Math.random() * 5) + 1
  };
};

// Endpoints configuration with placeholders for dynamic data
const endpoints = [
  { method: 'GET', url: '/' },
  { method: 'POST', url: '/restaurants', data: null },
  { method: 'GET', url: `/restaurants/{name}` },
  { method: 'DELETE', url: `/restaurants/{name}` },
  { method: 'POST', url: '/restaurants/rating', data: null },
  { method: 'GET', url: `/restaurants/cuisine/{cuisine}` },
  { method: 'GET', url: `/restaurants/region/{region}` },
  { method: 'GET', url: `/restaurants/region/{region}/cuisine/{cuisine}` },
];

// Function to make an HTTP request
const makeRequest = (endpoint, restaurantName, done) => {
  const startTime = Date.now();
  let url = endpoint.url.replace('{name}', restaurantName)
                        .replace('{cuisine}', encodeURIComponent(generateRandomData().cuisine))
                        .replace('{region}', encodeURIComponent(generateRandomData().regional));
  let data = endpoint.data ? generateRandomData() : {};

  axios({
    method: endpoint.method,
    url: `${baseURL}${url}`,
    data: data,
    httpAgent,
  })
    .then(response => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`Endpoint: ${endpoint.method} ${url} | Response status: ${response.status}, Time Taken: ${duration} ms`);
      if (endpoint.method === 'POST' && (endpoint.url === '/restaurants' || endpoint.url === '/restaurants/rating')) {
        console.log('Data Sent:', data);
      }
      done(null, duration);
    })
    .catch(error => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(`Endpoint: ${endpoint.method} ${url} | Error: ${error.response ? error.response.status : error.message}, Time Taken: ${duration} ms`);
      console.log('Data Sent:', data);
      done(error, duration);
    });
};

// Main function to perform the load test
const loadTest = () => {
  const tasks = [];
  let currentRestaurantName = generateRestaurantName();

  for (let i = 0; i < requestCount; i++) {
    const endpoint = endpoints[i % endpoints.length];

    // Regenerate data for POST requests and update URL placeholders
    if (endpoint.method === 'POST' && (endpoint.url === '/restaurants' || endpoint.url === '/restaurants/rating')) {
      endpoint.data = true; // Mark that we need to generate data
    }

    tasks.push(done => makeRequest(endpoint, currentRestaurantName, done));

    // Update current restaurant name for next set of requests
    currentRestaurantName = generateRestaurantName();
  }

  async.parallelLimit(tasks, concurrencyLevel, (err, results) => {
    if (err) {
      // console.error('A request failed:', err);
      console.error('A request failed');
    } else {
      console.log('All requests completed successfully.');
      const totalDuration = results.reduce((total, current) => total + current, 0);
      const averageDuration = totalDuration / results.length;
      console.log('Average Request Time:', averageDuration, 'ms');
    }
  });
};

// Start the load testing
loadTest();
