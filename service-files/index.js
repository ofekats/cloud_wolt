const express = require('express');
const AWS = require('aws-sdk');
const RestaurantsMemcachedActions = require('./model/restaurantsMemcachedActions');
const documentClient = new AWS.DynamoDB.DocumentClient(); // Initialize DocumentClient
const app = express();
app.use(express.json());

const MEMCACHED_CONFIGURATION_ENDPOINT = process.env.MEMCACHED_CONFIGURATION_ENDPOINT;
const TABLE_NAME = process.env.TABLE_NAME;
const AWS_REGION = process.env.AWS_REGION;
const USE_CACHE = process.env.USE_CACHE === 'true';

const memcachedActions = new RestaurantsMemcachedActions(MEMCACHED_CONFIGURATION_ENDPOINT);

//Returns the current configuration settings of the API
app.get('/', (req, res) => {
    const response = {
        MEMCACHED_CONFIGURATION_ENDPOINT: MEMCACHED_CONFIGURATION_ENDPOINT,
        TABLE_NAME: TABLE_NAME,
        AWS_REGION: AWS_REGION,
        // USE_CACHE: USE_CACHE
    };
    res.send(response);
});

// Adds a new restaurant to the database. Returns a success message or error if the restaurant already exists.
app.post('/restaurants', async (req, res) => {
    const restaurant = req.body;

    const checkParams = {
        TableName: TABLE_NAME,
        Key: {
            RestaurantName: restaurant.name // Unique name
        }
    };
    console.log("checkParams", checkParams);
    try {
        //cache
        if(USE_CACHE){
            // Check if the restaurant already exists in cache
            if(await memcachedActions.getRestaurants(restaurant.name) != false){
                // Restaurant already exists, respond with 409 Conflict
                console.log("restaurant in cache!");
                return res.status(409).json({ success: false, message: 'Restaurant already exists' });
            }
        }
        // Check if the restaurant already exists in db
        const data = await documentClient.get(checkParams).promise();
        if (data.Item) {
            // Restaurant already exists, respond with 409 Conflict
            return res.status(409).json({ success: false, message: 'Restaurant already exists' });
        }

        // If restaurant does not exist, add it to the table
        const addParams = {
            TableName: TABLE_NAME,
            Item: {
                RestaurantName: restaurant.name, // Unique name
                GeoRegional: restaurant.region || '', // Regional Geo Location
                Rating: restaurant.Rating || 0, // Rating between 1 to 5
                Cuisine: restaurant.cuisine || '' // Cuisine type
            }
        };
        //cache
        if(USE_CACHE){
            // add resturant to cache
            const res = await memcachedActions.addRestaurants(restaurant.name, addParams);
            console.log("res cache: ", res);
            console.log("resturant added to cache!")
        }
        console.log("addParams", addParams);
        await documentClient.put(addParams).promise();
        // Respond with 200 OK and success message
        console.log('Restaurant added successfully');
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Unable to add restaurant:", error);
        // Handle any errors and respond with 500 Internal Server Error
        res.status(500).send("Error adding restaurant");
    }
});

// Retrieves details of a restaurant by its name. Returns 404 if not found.
app.get('/restaurants/:restaurantName', async (req, res) => {
    const restaurantName = req.params.restaurantName;

    const params = {
        TableName: TABLE_NAME, 
        Key: {
            RestaurantName: restaurantName
        }
    };

    try {
        //cache
        if(USE_CACHE){
            // Check if the restaurant exists in cache
            const cacheData = await memcachedActions.getRestaurants(restaurantName);
            console.log("cache data: ", cacheData);
            if (cacheData) {
                const restaurant = cacheData.Item;
                return res.status(200).json({
                    name: restaurant.RestaurantName,
                    cuisine: restaurant.Cuisine || '',
                    rating: restaurant.Rating || 0, 
                    region: restaurant.GeoRegional || ''
                });
            }
        }
        // restaurant not exists in cache
        console.log("cache data not found");

        const data = await documentClient.get(params).promise();

        if (!data.Item) {
            // If restaurant not found, return 404
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // If restaurant found, return 200 with the restaurant details
        const restaurant = data.Item;
        res.status(200).json({
            name: restaurant.RestaurantName,
            cuisine: restaurant.Cuisine || '',
            rating: restaurant.Rating || 0, 
            region: restaurant.GeoRegional || ''
        });
    } catch (error) {
        console.error('Error retrieving restaurant:', error);
        res.status(500).json({ message: 'Error retrieving restaurant' });
    }
});

// Deletes a restaurant by its name. Returns a success message.
app.delete('/restaurants/:restaurantName', async (req, res) => {
    const restaurantName = req.params.restaurantName;
    
    const params = {
        TableName: TABLE_NAME, 
        Key: {
            RestaurantName: restaurantName
        }
    };

    try {
        //cache
        if(USE_CACHE){
            // Check if the restaurant exists in cache
            if (await memcachedActions.getRestaurants(restaurantName) != false) {
                //delete restaurant from cache
                const res = await memcachedActions.deleteRestaurants(restaurantName);
                console.log("res cache for delete: ", res);
            }else{
                console.log("restaurant not exists in cache");
            }
        }

        // Attempt to delete the item from the table
        await documentClient.delete(params).promise();

        // Respond with a success message
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        res.status(500).json({ message: 'Error deleting restaurant' });
    }
});

// Adds a rating to a restaurant and calculates the average rating. Returns a success message.
app.post('/restaurants/rating', async (req, res) => {
    const restaurantName = req.body.name;
    const rating = req.body.rating;
    
    const getParams = {
        TableName: TABLE_NAME,
        Key: {
            RestaurantName: restaurantName
        }
    };

    try {
        // Get the current restaurant details from DB
        const data = await documentClient.get(getParams).promise();

        if (!data.Item) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const restaurant = data.Item;
        
        console.log("restaurant details: ", restaurant);
        // Calculate the new average rating
        const currentRating = restaurant.Rating || 0;
        const ratingCount = restaurant.RatingCount || 0;
        const newRating = ((currentRating * ratingCount) + rating) / (ratingCount + 1);

        const updateParams = {
            TableName: TABLE_NAME,
            Key: {
                RestaurantName: restaurantName
            },
            UpdateExpression: 'set Rating = :r, RatingCount = :c',
            ExpressionAttributeValues: {
                ':r': newRating,
                ':c': ratingCount + 1
            },
            ReturnValues: 'UPDATED_NEW'
        };
        //delete from cache if it there
        if(USE_CACHE){
            const cacheData = await memcachedActions.getRestaurants(restaurantName);
            console.log("cache data: ", cacheData);
            if (cacheData) {
                const res = await memcachedActions.deleteRestaurants(restaurantName);
                console.log("cache res for delete: ", res);
            }
        }
        // Update the restaurant's rating
        await documentClient.update(updateParams).promise();

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating rating:', error);
        res.status(500).json({ message: 'Error updating rating' });
    }
});

//Retrieves top-rated restaurants by cuisine. Supports an optional limit query parameter (default 10, max 100).
app.get('/restaurants/cuisine/:cuisine', async (req, res) => {
    const cuisine = req.params.cuisine;
    let limit = parseInt(req.query.limit) || 10;
    limit = Math.min(limit, 100); // Ensure the limit does not exceed 100
    //for 10 point bonus
    const minRating = parseFloat(req.query.minRating) || 0; // Get the minimum rating from query params, default to 0 if not provided
    console.log("minRating: ", minRating);
    const params = {
        TableName: TABLE_NAME,
        IndexName: 'Cuisine-index',
        KeyConditionExpression: 'Cuisine = :cuisine', // Query by cuisine
        ExpressionAttributeValues: {
            ':cuisine': cuisine,
        },
        Limit: limit 
    };
    const cacheKey = "cuisine:"+ cuisine+ "-minRating:"+minRating+"-limit:"+limit;
    console.log("cacheKey: ", cacheKey);
    try {
        //cache
        if(USE_CACHE){
            // Check if the key exists in cache
            const cacheData = await memcachedActions.getRestaurants(cacheKey);
            console.log("cache data top cuisine: ", cacheData);
            if (cacheData) {
                return res.status(200).json(cacheData);
            }
        }
        // Query the table by cuisine
        const data = await documentClient.query(params).promise();
        console.log("data: ", data);
        if (!data.Items || data.Items.length === 0) {
            return res.status(404).json({ message: 'No restaurants found for the given cuisine' });
        }

        // Filter and sort the results by rating in descending order
        const filteredRestaurants = data.Items.filter(item => (item.Rating || 0) >= minRating);
        const sortedRestaurants = filteredRestaurants.sort((a, b) => (b.Rating || 0) - (a.Rating || 0));
        // console.log("filteredRestaurants: ", filteredRestaurants);
        // console.log("sortedRestaurants: ", sortedRestaurants);
        // Limit the results
        const topRestaurants = sortedRestaurants.slice(0, limit);
        console.log("topRestaurants: ", topRestaurants);
        // Check if topRestaurants is empty
        if (topRestaurants.length === 0) {
            return res.status(404).json({ message: 'No restaurants found for the given cuisine and rating criteria' });
        }
        //cache
        if(USE_CACHE){
            // add to cache
            const res = memcachedActions.addRestaurants(cacheKey,topRestaurants.map(restaurant => ({
                name: restaurant.RestaurantName,
                cuisine: restaurant.Cuisine,
                rating: restaurant.Rating || 0,
                region: restaurant.GeoRegional || ''
            })));
            console.log("res: ", res);
        }
        // Respond with the top restaurants
        res.status(200).json(topRestaurants.map(restaurant => ({
            name: restaurant.RestaurantName,
            cuisine: restaurant.Cuisine,
            rating: restaurant.Rating || 0,
            region: restaurant.GeoRegional || ''
        })));
    } catch (error) {
        console.error('Error retrieving top restaurants by cuisine:', error);
        res.status(500).json({ message: 'Error retrieving top restaurants by cuisine' });
    }

});

// Retrieves top-rated restaurants by region. Supports an optional limit query parameter (default 10, max 100).
app.get('/restaurants/region/:region', async (req, res) => {
    const region = req.params.region;
    let limit = parseInt(req.query.limit) || 10;
    limit = Math.min(limit, 100); // Ensure the limit does not exceed 100
    const params = {
        TableName: TABLE_NAME,
        IndexName: 'GeoRegional-index',
        KeyConditionExpression: 'GeoRegional = :region', // Query by region
        ExpressionAttributeValues: {
            ':region': region,
        },
        Limit: limit 
    };
    const cacheKey = "region:"+ region+"-limit:"+limit;
    console.log("cacheKey: ", cacheKey);
    try {
        //cache
        if(USE_CACHE){
            // Check if the key exists in cache
            const cacheData = await memcachedActions.getRestaurants(cacheKey);
            console.log("cache data top region: ", cacheData);
            if (cacheData) {
                return res.status(200).json(cacheData);
            }
        }
        // Query the table by region
        const data = await documentClient.query(params).promise();

        if (!data.Items || data.Items.length === 0) {
            return res.status(404).json({ message: 'No restaurants found for the given region' });
        }

        // Sort the results by rating in descending order
        const sortedRestaurants = data.Items.sort((a, b) => (b.Rating || 0) - (a.Rating || 0));

        // Limit the results
        const topRestaurants = sortedRestaurants.slice(0, limit);

        //cache
        if(USE_CACHE){
            // add to cache
            const res = memcachedActions.addRestaurants(cacheKey,topRestaurants.map(restaurant => ({
                name: restaurant.RestaurantName,
                cuisine: restaurant.Cuisine,
                rating: restaurant.Rating || 0,
                region: restaurant.GeoRegional || ''
            })));
            console.log("res: ", res);
        }

        // Respond with the top restaurants
        res.status(200).json(topRestaurants.map(restaurant => ({
            name: restaurant.RestaurantName,
            cuisine: restaurant.Cuisine,
            rating: restaurant.Rating || 0,
            region: restaurant.GeoRegional || ''
        })));
    } catch (error) {
        console.error('Error retrieving top restaurants by region:', error);
        res.status(500).json({ message: 'Error retrieving top restaurants by region' });
    }
});

//Retrieves top-rated restaurants by region and cuisine. Supports an optional limit query parameter (default 10, max 100).
app.get('/restaurants/region/:region/cuisine/:cuisine', async (req, res) => {
    const region = req.params.region;
    const cuisine = req.params.cuisine;

    let limit = parseInt(req.query.limit) || 10;
    limit = Math.min(limit, 100); // Ensure the limit does not exceed 100
    
    const params = {
        TableName: TABLE_NAME,
        IndexName: 'GeoRegionalCuisine-index',
        KeyConditionExpression: 'GeoRegional = :region and Cuisine = :cuisine', // Query by region and cuisine
        ExpressionAttributeValues: {
            ':region': region,
            ':cuisine': cuisine,
        },
        Limit: limit
    };

    const cacheKey = "region:"+ region+"-cuisine:"+cuisine+"-limit:"+limit;
    console.log("cacheKey: ", cacheKey);
    try {
        //cache
        if(USE_CACHE){
            // Check if the key exists in cache
            const cacheData = await memcachedActions.getRestaurants(cacheKey);
            console.log("cache data top region and cuisine: ", cacheData);
            if (cacheData) {
                return res.status(200).json(cacheData);
            }
        }
        // Query the table by region and cuisine
        const data = await documentClient.query(params).promise();

        if (!data.Items || data.Items.length === 0) {
            return res.status(404).json({ message: 'No restaurants found for the given region and cuisine' });
        }

        // Sort the results by rating in descending order
        const sortedRestaurants = data.Items.sort((a, b) => (b.Rating || 0) - (a.Rating || 0));

        // Limit the results
        const topRestaurants = sortedRestaurants.slice(0, limit);

        //cache
        if(USE_CACHE){
            // add to cache
            const res = memcachedActions.addRestaurants(cacheKey,topRestaurants.map(restaurant => ({
                name: restaurant.RestaurantName,
                cuisine: restaurant.Cuisine,
                rating: restaurant.Rating || 0,
                region: restaurant.GeoRegional || ''
            })));
            console.log("res: ", res);
        }

        // Respond with the top restaurants
        res.status(200).json(topRestaurants.map(restaurant => ({
            name: restaurant.RestaurantName,
            cuisine: restaurant.Cuisine,
            rating: restaurant.Rating || 0,
            region: restaurant.GeoRegional || ''
        })));
    } catch (error) {
        console.error('Error retrieving top restaurants by region and cuisine:', error);
        res.status(500).json({ message: 'Error retrieving top restaurants by region and cuisine' });
    }

});

app.listen(80, () => {
    console.log('Server is running on http://localhost:80');
});

module.exports = { app };