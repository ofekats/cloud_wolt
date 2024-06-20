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

app.get('/', (req, res) => {
    const response = {
        MEMCACHED_CONFIGURATION_ENDPOINT: MEMCACHED_CONFIGURATION_ENDPOINT,
        TABLE_NAME: TABLE_NAME,
        AWS_REGION: AWS_REGION,
        // USE_CACHE: USE_CACHE
    };
    res.send(response);
});

app.post('/restaurants', async (req, res) => {
    const restaurant = req.body;

    // Students TODO: Implement the logic to add a restaurant
    // res.status(404).send("need to implement");
    const checkParams = {
        TableName: TABLE_NAME,
        Key: {
            RestaurantName: restaurant.name // Unique name
            // GeoRegional: restaurant.region // Sort key
        }
    };
    console.log("checkParams", checkParams);
    try {
        // Check if the restaurant already exists
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
                GeoRegional: restaurant.region, // Regional Geo Location
                Rating: restaurant.Rating, // Rating between 1 to 5
                Cuisine: restaurant.cuisine // Cuisine type
            }
        };
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

app.get('/restaurants/:restaurantName', async (req, res) => {
    const restaurantName = req.params.restaurantName;

    // Students TODO: Implement the logic to get a restaurant by name
    // res.status(404).send("need to implement");
    const params = {
        TableName: TABLE_NAME, // Replace with your DynamoDB table name
        Key: {
            RestaurantName: restaurantName
        }
    };

    try {
        const data = await documentClient.get(params).promise();

        if (!data.Item) {
            // If restaurant not found, return 404
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // If restaurant found, return 200 with the restaurant details
        const restaurant = data.Item;
        res.status(200).json({
            name: restaurant.RestaurantName,
            cuisine: restaurant.Cuisine,
            rating: restaurant.Rating || 0, // Assuming Rating is an optional attribute with default 0
            region: restaurant.GeoRegional || '' // Assuming GeoRegional is an optional attribute
        });
    } catch (error) {
        console.error('Error retrieving restaurant:', error);
        res.status(500).json({ message: 'Error retrieving restaurant' });
    }
});

app.delete('/restaurants/:restaurantName', async (req, res) => {
    const restaurantName = req.params.restaurantName;
    
    // Students TODO: Implement the logic to delete a restaurant by name
    // res.status(404).send("need to implement");
    const params = {
        TableName: TABLE_NAME, 
        Key: {
            RestaurantName: restaurantName
        }
    };

    try {
        // Attempt to delete the item from the table
        await documentClient.delete(params).promise();

        // Respond with a success message
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        res.status(500).json({ message: 'Error deleting restaurant' });
    }
});

app.post('/restaurants/rating', async (req, res) => {
    const restaurantName = req.body.name;
    const rating = req.body.rating;
    
    // Students TODO: Implement the logic to add a rating to a restaurant
    // res.status(404).send("need to implement");
    const getParams = {
        TableName: TABLE_NAME,
        Key: {
            RestaurantName: restaurantName
        }
    };

    try {
        // Get the current restaurant details
        const data = await documentClient.get(getParams).promise();

        if (!data.Item) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const restaurant = data.Item;
        
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

        // Update the restaurant's rating
        await documentClient.update(updateParams).promise();

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating rating:', error);
        res.status(500).json({ message: 'Error updating rating' });
    }
});

app.get('/restaurants/cuisine/:cuisine', async (req, res) => {
    const cuisine = req.params.cuisine;
    let limit = parseInt(req.query.limit) || 10;
    limit = Math.min(limit, 100); // Ensure the limit does not exceed 100
    //for 10 point bonus
    const minRating = parseFloat(req.query.minRating) || 0; // Get the minimum rating from query params, default to 0 if not provided
    console.log("minRating: ", minRating);
    // Students TODO: Implement the logic to get top rated restaurants by cuisine
    // res.status(404).send("need to implement");
    const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'Cuisine = :cuisine', // Filter by cuisine only
        ExpressionAttributeValues: {
            ':cuisine': cuisine,
        }
    };
    // console.log("params: ", params);
    try {
        // Scan the table and filter by cuisine
        const data = await documentClient.scan(params).promise();
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

app.get('/restaurants/region/:region', async (req, res) => {
    const region = req.params.region;
    let limit = parseInt(req.query.limit) || 10;
    limit = Math.min(limit, 100); // Ensure the limit does not exceed 100
    
    // Students TODO: Implement the logic to get top rated restaurants by region
    // res.status(404).send("need to implement");
    const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'GeoRegional = :region',
        ExpressionAttributeValues: {
            ':region': region
        }
    };

    try {
        // Scan the table and filter by region
        const data = await documentClient.scan(params).promise();

        if (!data.Items || data.Items.length === 0) {
            return res.status(404).json({ message: 'No restaurants found for the given region' });
        }

        // Sort the results by rating in descending order
        const sortedRestaurants = data.Items.sort((a, b) => (b.Rating || 0) - (a.Rating || 0));

        // Limit the results
        const topRestaurants = sortedRestaurants.slice(0, limit);

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

app.get('/restaurants/region/:region/cuisine/:cuisine', async (req, res) => {
    const region = req.params.region;
    const cuisine = req.params.cuisine;

    let limit = parseInt(req.query.limit) || 10;
    limit = Math.min(limit, 100); // Ensure the limit does not exceed 100

    // Students TODO: Implement the logic to get top rated restaurants by region and cuisine
    // res.status(404).send("need to implement");
    const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'GeoRegional = :region and Cuisine = :cuisine',
        ExpressionAttributeValues: {
            ':region': region,
            ':cuisine': cuisine
        }
    };

    try {
        // Scan the table and filter by region and cuisine
        const data = await documentClient.scan(params).promise();

        if (!data.Items || data.Items.length === 0) {
            return res.status(404).json({ message: 'No restaurants found for the given region and cuisine' });
        }

        // Sort the results by rating in descending order
        const sortedRestaurants = data.Items.sort((a, b) => (b.Rating || 0) - (a.Rating || 0));

        // Limit the results
        const topRestaurants = sortedRestaurants.slice(0, limit);

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