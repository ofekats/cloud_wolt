const axios = require('axios');
const assert = require('assert');

const endPoint = 'http://Restau-LB8A1-VvD2Oxnsbqxv-1341499121.us-east-1.elb.amazonaws.com'; // Update with your endpoint
const restaurants = [
    { name: 'Restaurant 1', region: 'Region1', cuisine: 'Cuisine1', rating: 4},
    { name: 'Restaurant 2', region: 'Region2', cuisine: 'Cuisine2', rating: 3},
    { name: 'Restaurant 3', region: 'Region1', cuisine: 'Cuisine3', rating: 5}
];

const numberOfTimes = 1; // Specify the number of times to run each test

async function insertRestaurants() {
  try {
      for (let t = 0; t < numberOfTimes; t++) {
          const start = Date.now();
          const requests = restaurants.map(async (restaurant) => {
            try{
              const res = await axios.post(`${endPoint}/restaurants`, restaurant);
              const end = Date.now();
              const timeTaken = end - start;
              console.log(`Restaurant ${restaurant.name} inserted successfully. status: ${res.status} Time taken: ${timeTaken}ms`);
          }
          catch(error){
            return console.error('Error inserting restaurant:', error.response ? error.response.status : error.message);
          }
              
          });
          await Promise.all(requests);
      }
  } catch (error) {
  }
}


async function testGetRestaurant(restaurant) {
    try {
        for (let t = 0; t < numberOfTimes; t++) {
            const start = Date.now();
            const response = await axios.get(`${endPoint}/restaurants/${restaurant.name}`);
            const end = Date.now();
            const timeTaken = end - start;
            assert.strictEqual(response.status, 200, 'Expected status code 200');
            console.log(`GET /restaurants/${restaurant.name} status code: ${response.status}, time taken: ${timeTaken}ms`);
        }
        return timeTaken;
    } catch (error) {
        // console.log(`error status code: ${error}`);
        return 0; // Return 0 time if there's an error
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDeleteRestaurant(restaurant) {
    const timeResults = []; // Array to store time taken for each request

    for (let t = 0; t < numberOfTimes; t++) {
        try {
            const start = Date.now();
            await axios.delete(`${endPoint}/restaurants/${restaurant.name}`);
            const end = Date.now();
            const timeTaken = end - start;
            timeResults.push(timeTaken);
            console.log(`Request ${t + 1}: Restaurant ${restaurant.name} deleted successfully. Time taken: ${timeTaken}ms`);
        } catch (error) {
            timeResults.push(0); // Log 0 time if there's an error
            // console.log(`error status code: ${error}`);
        }
        await sleep(100); // Add delay between requests
    }

    return timeResults;
}

async function testGetRootEndpoint() {
    try {
        for (let t = 0; t < numberOfTimes; t++) {
            const start = Date.now();
            const response = await axios.get(`${endPoint}/`);
            const end = Date.now();
            const timeTaken = end - start;
            assert.strictEqual(response.status, 200, 'Expected status code 200');
            console.log(`GET / status code: ${response.status}, time taken: ${timeTaken}ms`);
        }
        return timeTaken;
    } catch (error) {
        // console.log(`error status code: ${error}`);
        return 0; // Return 0 time if there's an error
    }
}

async function testAddRating() {
    try {
        for (let t = 0; t < numberOfTimes; t++) {
            const start = Date.now();
            const ratingData = { name: 'Restaurant 1', rating: 4 }; // Example rating data
            const response = await axios.post(`${endPoint}/restaurants/rating`, ratingData);
            const end = Date.now();
            const timeTaken = end - start;
            assert.strictEqual(response.status, 200, 'Expected status code 200');
            console.log(`POST /restaurants/rating status code: ${response.status}, time taken: ${timeTaken}ms`);
        }
        return timeTaken;
    } catch (error) {
        // console.log(`error status code: ${error}`);
        return 0; // Return 0 time if there's an error
    }
}

async function testGetRestaurantsByCuisine(cuisine) {
    try {
        const start = Date.now();
        for (let t = 0; t < numberOfTimes; t++) {
            const response = await axios.get(`${endPoint}/restaurants/cuisine/${cuisine}`);
            const end = Date.now();
            const timeTaken = end - start;
            assert.strictEqual(response.status, 200, 'Expected status code 200');
            console.log(`GET /restaurants/cuisine/${cuisine} status code: ${response.status}, time taken: ${timeTaken}ms`);
        }
        return timeTaken;
    } catch (error) {
        // console.log(`error status code: ${error}`);
        return 0; // Return 0 time if there's an error
    }
}

async function testGetRestaurantsByRegion(region) {
    try {
        const start = Date.now();
        for (let t = 0; t < numberOfTimes; t++) {
            const response = await axios.get(`${endPoint}/restaurants/region/${region}`);
            const end = Date.now();
            const timeTaken = end - start;
            assert.strictEqual(response.status, 200, 'Expected status code 200');
            console.log(`GET /restaurants/region/${region} status code: ${response.status}, time taken: ${timeTaken}ms`);
        }
        return timeTaken;
    } catch (error) {
        // console.log(`error status code: ${error}`);
        return 0; // Return 0 time if there's an error
    }
}

async function testGetRestaurantsByRegionAndCuisine(region, cuisine) {
    try {
        const start = Date.now();
        for (let t = 0; t < numberOfTimes; t++) {
            const response = await axios.get(`${endPoint}/restaurants/region/${region}/cuisine/${cuisine}`);
            const end = Date.now();
            const timeTaken = end - start;
            assert.strictEqual(response.status, 200, 'Expected status code 200');
            console.log(`GET /restaurants/region/${region}/cuisine/${cuisine} status code: ${response.status}, time taken: ${timeTaken}ms`);
        }
        return timeTaken;
    } catch (error) {
        // console.log(`error status code: ${error}`);
        return 0; // Return 0 time if there's an error
    }
}

async function runTests() {
    try {
        const startTime = Date.now();

        // Test GET / endpoint
        await testGetRootEndpoint();

        // Insert restaurants
        await insertRestaurants();

        await sleep(100);

        // Test individual restaurants (GET)
        for (let i = 0; i < restaurants.length; i++) {
            const restaurant = restaurants[i];
            await testGetRestaurant(restaurant);
        }

        await sleep(100);

        // Test POST /restaurants/rating endpoint
        await testAddRating();

        await sleep(100);

        // // Example tests for GET by cuisine, region, and region/cuisine
        // await testGetRestaurantsByCuisine('Cuisine1');
        // await testGetRestaurantsByRegion('Region1');
        // await testGetRestaurantsByRegionAndCuisine('Region1', 'Cuisine1');

        // // // Test individual restaurants (DELETE)
        // // for (let i = 0; i < restaurants.length; i++) {
        // //     const restaurant = restaurants[i];
        // //     timeMeasurements.push(await testDeleteRestaurant(restaurant));
        // // }

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        console.log(`All tests completed in ${totalTime}ms.`);
    } catch (error) {
        console.error('Error running tests:', error.response ? error.response.data : error.message);
    }
}

runTests();
