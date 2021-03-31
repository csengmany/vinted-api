# Vinted API

<div align="center">
<img src="https://res.cloudinary.com/cathy-cloud/image/upload/v1617192035/api/vinted/v_m4ol0p.png?raw=true" alt="drawing" width="500"/></div>
<br>

## Packages

-   [Cloudinary](https://cloudinary.com/)
-   [Cors](https://www.npmjs.com/package/cors)
-   [Crypto-js](https://www.npmjs.com/package/crypto-js)
-   [Dotenv](https://www.npmjs.com/package/dotenv)
-   [Express](https://github.com/expressjs/express)
-   [Express-formidable](https://github.com/hatashiro/express-formidable)
-   [Mongoose](https://www.npmjs.com/package/mongoose)
-   [Stripe](https://www.npmjs.com/package/stripe)
-   [Uid2](https://www.npmjs.com/package/uid2)

<br>

## User

### /user/signup (POST)

Create a new user

| Body       | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | Yes      |
| `password` | string | Yes      |
| `username` | string | Yes      |
| `phone`    | string | No       |

### /user/login (POST)

Log a user

| Body       | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | Yes      |
| `password` | string | Yes      |

<br>

## Offer

### /offers/ (GET)

Receive a list of offers.
Possibility to filter the results.

| Query      | Required | Description                                                                                                                                                                                                                                                 |
| ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`    | No       | get a list of offers that contain `title`                                                                                                                                                                                                                   |
| `priceMin` | No       | get offers above `priceMin`                                                                                                                                                                                                                                 |
| `priceMax` | No       | get offers below `priceMax`                                                                                                                                                                                                                                 |
| `sort`     | No       | `date-asc` : get a list of offers sort by ascending dates <br> `date-desc`: get a list of offers sort by descending dates <br> `price-asc`: get a list of offers sort by ascending prices <br> `price-desc`: get a list of offers sort by descending prices |
| `page`     | No       | set the results page                                                                                                                                                                                                                                        |
| `limit`    | No       | set the limit of results                                                                                                                                                                                                                                    |

### /offer/:id (GET)

Get an offer

| Param | Required | Description |
| ----- | -------- | ----------- |
| `id`  | Yes      | offer id    |

### /offer/publish (POST)

Create a new offer

| formData      | Required | Description                            |
| ------------- | -------- | -------------------------------------- |
| `title`       | Yes      | offer title                            |
| `description` | Yes      | product description                    |
| `price`       | Yes      | product price                          |
| `brand`       | Yes      | product brand                          |
| `size`        | Yes      | product size                           |
| `condition`   | Yes      | product condition                      |
| `color`       | Yes      | offer color                            |
| `city`        | Yes      | the city in which the offer is located |
| `picture`     | Yes      | product picture                        |

| Headers        | Required | Description |
| -------------- | -------- | ----------- |
| `Bearer token` | Yes      | user token  |

### /offer/update/:id (PUT)

Update an offer

| Param | Required | Description |
| ----- | -------- | ----------- |
| `id`  | Yes      | offer id    |

| Headers        | Required | Description |
| -------------- | -------- | ----------- |
| `Bearer token` | Yes      | user token  |

| formData      | Required | Description         |
| ------------- | -------- | ------------------- |
| `title`       | No       | offer title         |
| `description` | No       | product description |
| `price`       | No       | product price       |
| `brand`       | No       | product brand       |
| `size`        | No       | product size        |
| `condition`   | No       | product condition   |
| `color`       | No       | offer color         |
| `location`    | No       | offer location      |
| `picture`     | No       | product picture     |

### /offer/delete/picture/:id (DELETE)

Delete a picture of an offer

| Param | Required | Description |
| ----- | -------- | ----------- |
| `id`  | Yes      | offer id    |

| Headers        | Required | Description |
| -------------- | -------- | ----------- |
| `Bearer token` | Yes      | user token  |

### /offer/delete/:id (DELETE)

Delete an offer

| Param | Required | Description |
| ----- | -------- | ----------- |
| `id`  | Yes      | offer id    |

| Headers        | Required | Description |
| -------------- | -------- | ----------- |
| `Bearer token` | Yes      | user token  |

## Payment

### /payment (POST)

Route to pay an offer

| formData      | Required | Description       |
| ------------- | -------- | ----------------- |
| `amount`      | Yes      | amount of payment |
| `stripeToken` | Yes      | Stripe token      |
