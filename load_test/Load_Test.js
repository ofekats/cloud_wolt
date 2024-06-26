const axios = require('axios');
const assert = require('assert');

const endPoint = 'http://Restau-LB8A1-mZ9s7kMGGy4T-931628069.us-east-1.elb.amazonaws.com'; // Update with your endpoint
const restaurants = [
    { name: 'Restaurant 1', region: 'Region 1', cuisine: 'Cuisine 1', rating: 4 },
    { name: 'Restaurant 2', region: 'Region 2', cuisine: 'Cuisine 2', rating: 3 },
    { name: 'Restaurant 3', region: 'Region 1', cuisine: 'Cuisine 3', rating: 5 }
];

const numberOfTimes = 1; // Specify the number of times to run each test

async function insertRestaurants() {
  try {
      const totalTimeMeasurements = [];

      for (let t = 0; t < numberOfTimes; t++) {
          const start = Date.now();
          const requests = restaurants.map(async (restaurant) => {
              await axios.post(`${endPoint}/restaurants`, restaurant);
              const end = Date.now();
              const timeTaken = end - start;
              console.log(`Restaurant ${restaurant.name} inserted successfully. Time taken: ${timeTaken}ms`);
              totalTimeMeasurements.push(timeTaken);
          });
          await Promise.all(requests);
      }

      // Calculate total time for all insertions
      const totalInsertionTime = totalTimeMeasurements.reduce((acc, curr) => acc + curr, 0);
      console.log(`Insertion of ${restaurants.length * numberOfTimes} restaurants completed in ${totalInsertionTime}ms.`);
  } catch (error) {
      console.error('Error inserting restaurants:', error.response ? error.response.data : error.message);
  }
}


async function testGetRestaurant(restaurant) {
    try {
        const start = Date.now();
        for (let t = 0; t < numberOfTimes; t++) {
            const response = await axios.get(`${endPoint}/restaurants/${restaurant.name}`);
            const end = Date.now();
            const timeTaken = end - start;
            assert.strictEqual(response.status, 200, 'Expected status code 200');
            console.log(`GET /restaurants/${restaurant.name} status code: ${response.status}, time taken: ${timeTaken}ms`);
        }
        return timeTaken;
    } catch (error) {
        console.error(`Error testing GET /restaurants/${restaurant.name}:`, error.response ? error.response.data : error.message);
        return 0; // Return 0 time if there's an error
    }
}

async function testDeleteRestaurant(restaurant) {
    try {
        const start = Date.now();
        for (let t = 0; t < numberOfTimes; t++) {
            await axios.delete(`${endPoint}/restaurants/$restaurant{.name}`);
            const end = Date.now();
            const timeTaken = end - start;
            console.log(`Restaurant ${restaurant.name} deleted successfully. Time taken: ${timeTaken}ms`);
        }
        return timeTaken;
    } catch (error) {
        console.error(`Error deleting restaurant ${restaurant.name}:`, error.response ? error.response.data : error.message);
        return 0; // Return 0 time if there's an error
    }
}

async function testGetRootEndpoint() {
    try {
        const start = Date.now();
        for (let t = 0; t < numberOfTimes; t++) {
            const response = await axios.get(`${endPoint}/`);
            const end = Date.now();
            const timeTaken = end - start;
            assert.strictEqual(response.status, 200, 'Expected status code 200');
            console.log(`GET / status code: ${response.status}, time taken: ${timeTaken}ms`);
        }
        return timeTaken;
    } catch (error) {
        console.error('Error testing GET /:', error.response ? error.response.data : error.message);
        return 0; // Return 0 time if there's an error
    }
}

async function testAddRating() {
    try {
        const start = Date.now();
        for (let t = 0; t < numberOfTimes; t++) {
            const ratingData = { name: 'Restaurant 1', rating: 4 }; // Example rating data
            const response = await axios.post(`${endPoint}/restaurants/rating`, ratingData);
            const end = Date.now();
            const timeTaken = end - start;
            assert.strictEqual(response.status, 200, 'Expected status code 200');
            console.log(`POST /restaurants/rating status code: ${response.status}, time taken: ${timeTaken}ms`);
        }
        return timeTaken;
    } catch (error) {
        console.error('Error testing POST /restaurants/rating:', error.response ? error.response.data : error.message);
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
        console.error(`Error testing GET /restaurants/cuisine/${cuisine}:`, error.response ? error.response.data : error.message);
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
        console.error(`Error testing GET /restaurants/region/${region}:`, error.response ? error.response.data : error.message);
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
        console.error(`Error testing GET /restaurants/region/${region}/cuisine/${cuisine}:`, error.response ? error.response.data : error.message);
        return 0; // Return 0 time if there's an error
    }
}

async function runTests() {
    try {
        const startTime = Date.now();

        // Insert restaurants
        await insertRestaurants();

        // Array to hold all promises for time measurement
        const timeMeasurements = [];

        // Test GET / endpoint
        timeMeasurements.push(await testGetRootEndpoint());

        // Test individual restaurants (GET)
        for (let i = 0; i < restaurants.length; i++) {
            const restaurant = restaurants[i];
            timeMeasurements.push(await testGetRestaurant(restaurant));
        }

        // Test POST /restaurants/rating endpoint
        timeMeasurements.push(await testAddRating());

        // Example tests for GET by cuisine, region, and region/cuisine
        timeMeasurements.push(await testGetRestaurantsByCuisine('Cuisine 1'));
        timeMeasurements.push(await testGetRestaurantsByRegion('Region 1'));
        timeMeasurements.push(await testGetRestaurantsByRegionAndCuisine('Region 1', 'Cuisine 1'));

        // // Test individual restaurants (DELETE)
        // for (let i = 0; i < restaurants.length; i++) {
        //     const restaurant = restaurants[i];
        //     timeMeasurements.push(await testDeleteRestaurant(restaurant));
        // }

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        // Calculate average time
        const averageTime = timeMeasurements.reduce((acc, curr) => acc + curr, 0) / timeMeasurements.length;

        console.log(`All tests completed in ${totalTime}ms.`);
        console.log(`Average time per request: ${averageTime}ms.`);
    } catch (error) {
        console.error('Error running tests:', error.response ? error.response.data : error.message);
    }
}

runTests();
