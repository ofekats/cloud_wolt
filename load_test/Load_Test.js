const axios = require('axios');
const assert = require('assert');

const endPoint = 'http://Restau-LB8A1-yky1dqAwRMFC-127528954.us-east-1.elb.amazonaws.com'; // Update with your endpoint
const createdRestaurants = []; // Array to store generated restaurant data
const number_of_rest = 10; // number of resturant for testing
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
    region: regions[Math.floor(Math.random() * regions.length)],
    rating: Math.floor(Math.random() * 5) + 1
  };
};

async function insertRestaurants(numberOfRestaurants) {
    try {
        const start = Date.now();
        for (let i = 0; i < numberOfRestaurants; i++) {
            const restaurant = generateRandomData();
            // console.log("Generated restaurant: ", restaurant);
            createdRestaurants.push(restaurant); // Save generated restaurant data

            try {
                const res = await axios.post(`${endPoint}/restaurants`, restaurant);
                const end = Date.now();
                const timeTaken = end - start;
                console.log(`Restaurant ${restaurant.name} inserted successfully. Status: ${res.status}, Time taken: ${timeTaken}ms`);
                await sleep(100);
            } catch (error) {
                console.log("error", error);
                if (error.response) {
                    console.error(`Error inserting restaurant ${restaurant.name}: ${error.response.status} - ${error.response.data}`);
                } else {
                    console.error(`Error inserting restaurant ${restaurant.name}: ${error.message}`);
                }
            }
        }
    } catch (error) {
        if (error.response) {
            console.error('Error inserting restaurants:', error.response.status, error.response.data);
        } else {
            console.error('Error inserting restaurants:', error.message);
        }
    }
}


async function testGetRestaurant(restaurant) {
    try {
        const start = Date.now();
        const response = await axios.get(`${endPoint}/restaurants/${restaurant.name}`);
        const end = Date.now();
        const timeTaken = end - start;
        assert.strictEqual(response.status, 200, 'Expected status code 200');
        console.log(`GET /restaurants/${restaurant.name} status code: ${response.status}, time taken: ${timeTaken}ms`);
        return timeTaken;
    } catch (error) {
        return 0; // Return 0 time if there's an error
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDeleteRestaurant(restaurant) {
    const timeResults = []; // Array to store time taken for each request

        try {
            const start = Date.now();
            await axios.delete(`${endPoint}/restaurants/${restaurant.name}`);
            const end = Date.now();
            const timeTaken = end - start;
            timeResults.push(timeTaken);
            console.log(`Restaurant ${restaurant.name} deleted successfully. Time taken: ${timeTaken}ms`);
        } catch (error) {
            timeResults.push(0); // Log 0 time if there's an error
        }
        await sleep(100); // Add delay between requests

    return timeResults;
}

async function testGetRootEndpoint() {
    try {
        const start = Date.now();
        const response = await axios.get(`${endPoint}/`);
        const end = Date.now();
        const timeTaken = end - start;
        assert.strictEqual(response.status, 200, 'Expected status code 200');
        console.log(`GET / status code: ${response.status}, time taken: ${timeTaken}ms`);
        return timeTaken;
    } catch (error) {
        return 0; // Return 0 time if there's an error
    }
}

async function testAddRating(restaurant) {
    try {
        const start = Date.now();
        const ratingData = { name: restaurant.name, rating: 4 }; // Example rating data
        const response = await axios.post(`${endPoint}/restaurants/rating`, ratingData);
        const end = Date.now();
        const timeTaken = end - start;
        assert.strictEqual(response.status, 200, 'Expected status code 200');
        console.log(`POST /restaurants/rating status code: ${response.status}, time taken: ${timeTaken}ms`);
        return timeTaken;
    } catch (error) {
        return 0; // Return 0 time if there's an error
    }
}

async function testGetRestaurantsByCuisine(cuisine) {
    try {
        const start = Date.now();
        const response = await axios.get(`${endPoint}/restaurants/cuisine/${cuisine}`);
        const end = Date.now();
        const timeTaken = end - start;
        await sleep(100);
        console.log(`GET /restaurants/cuisine/${cuisine} status code: ${response.status}, time taken: ${timeTaken}ms`);
        assert.strictEqual(response.status, 200, 'Expected status code 200');
        return timeTaken;
    } catch (error) {
        console.log(`error cuisine`);
        return 0; // Return 0 time if there's an error
    }
}

async function testGetRestaurantsByRegion(region) {
    try {
        const start = Date.now();
        const response = await axios.get(`${endPoint}/restaurants/region/${region}`);
        const end = Date.now();
        const timeTaken = end - start;
        assert.strictEqual(response.status, 200, 'Expected status code 200');
        console.log(`GET /restaurants/region/${region} status code: ${response.status}, time taken: ${timeTaken}ms`);
        return timeTaken;
    } catch (error) {
        console.log(`error Region`);
        return 0; // Return 0 time if there's an error
    }
}

async function testGetRestaurantsByRegionAndCuisine(region, cuisine) {
    try {
        const start = Date.now();
        const response = await axios.get(`${endPoint}/restaurants/region/${region}/cuisine/${cuisine}`);
        const end = Date.now();
        const timeTaken = end - start;
        assert.strictEqual(response.status, 200, 'Expected status code 200');
        console.log(`GET /restaurants/region/${region}/cuisine/${cuisine} status code: ${response.status}, time taken: ${timeTaken}ms`);
        return timeTaken;
    } catch (error) {
        console.log(`error Region and cuisine`);
        return 0; // Return 0 time if there's an error
    }
}

async function runTests() {
    try {
        const startTime = Date.now();
        // console.log(`GET:`);
        // Test GET / endpoint
        await testGetRootEndpoint();

        // console.log(`POST resturants:`);
        // Insert restaurants
        await insertRestaurants(number_of_rest);

        // console.log("createdRestaurants:",createdRestaurants);

        await sleep(100);
        // console.log(`GET resturants:`);
        // Test individual restaurants (GET)
        for (let i = 0; i < createdRestaurants.length; i++) {
            const restaurant = createdRestaurants[i];
            // console.log("restaurant name:",restaurant);
            await testGetRestaurant(restaurant);
        }

        await sleep(100);
        // console.log(`POST /restaurants/rating:`);
        // Test POST /restaurants/rating endpoint
        for (let i = 0; i < createdRestaurants.length; i++) {
            const restaurant = createdRestaurants[i];
            await testAddRating(restaurant);
            await sleep(100);
        }

        // console.log(`GET /restaurants/cuisine:`);
        // Example tests for GET by cuisine, region, and region/cuisine
        
        for (let i = 0; i < createdRestaurants.length; i++) {
            const restaurant = createdRestaurants[i];
            await testGetRestaurantsByCuisine(restaurant.cuisine);
            await sleep(100);
        }
        // console.log(`GET /restaurants/region:`);
        
        for (let i = 0; i < createdRestaurants.length; i++) {
            const restaurant = createdRestaurants[i];
            await testGetRestaurantsByRegion(restaurant.region);
            await sleep(100);
        }

        
        // console.log(`GET /restaurants/region/cuisine:`);
        

        for (let i = 0; i < createdRestaurants.length; i++) {
            const restaurant = createdRestaurants[i];
            await testGetRestaurantsByRegionAndCuisine(restaurant.region, restaurant.cuisine);
            await sleep(100);
        }
        

        // Test individual restaurants (DELETE)
        // console.log(`DELETE /restaurants/:`);
        for (let i = 0; i < createdRestaurants.length; i++) {
            const restaurant = createdRestaurants[i];
            await testDeleteRestaurant(restaurant);
            await sleep(100);
        }

        const endTime = Date.now();
        const totalTime = endTime - startTime;
        

        console.log(`All tests completed in ${totalTime}ms.`);
    } catch (error) {
        console.error('Error running tests:', error.response ? error.response.data : error.message);
    }
}

runTests();
