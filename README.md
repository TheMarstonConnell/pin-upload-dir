# Directory Uploader for Pin

!! Needs Node version 20+ !!

## Setup
In the Pin interface, create a new collection. This will be the collection we upload everything to.

## Install
```sh
npm i
```

Make sure you have a `.env` file in your working directory when running the upload process:
```sh
touch .env
echo "API_TOKEN={your api key}" >> .env
```

```sh
node uploadImages.js {folder name} {collection_name}
```