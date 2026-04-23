# Mara’s Velouré — real Stripe cart version

This version keeps your storefront design but upgrades checkout so customers can:
- add multiple products to the cart
- mix sizes and colors
- check out together in one Stripe Checkout session

## What is included
- static storefront pages
- real cart in the browser
- Netlify Function that creates Stripe Checkout Sessions
- success and cancel pages
- Stripe catalog validation on the server side

## Before you deploy
Do **not** put your Stripe secret key into any front-end file.

You only add it in Netlify as an environment variable named:

`STRIPE_SECRET_KEY`

## Deploy on Netlify
1. Upload this whole folder to a GitHub repo or drag it into Netlify.
2. In Netlify, open **Site configuration → Environment variables**.
3. Add a variable named `STRIPE_SECRET_KEY` and paste your **live Stripe secret key**.
4. Redeploy the site.
5. Test by adding more than one item to the cart and clicking **Checkout with card**.

## Local setup
If you want to run this locally with functions:
1. Install Node.js.
2. In this folder, run `npm install`.
3. Install Netlify CLI if needed.
4. Run `netlify dev`.
5. Put your Stripe secret key in a local `.env` file as `STRIPE_SECRET_KEY=...`

## How to add new products later
When you add a new shirt later, update **both** files:
- `products.js` for the storefront card, colors, images, and size options
- `stripe-catalog.js` for the secure checkout pricing rules

That second file is what protects the real Stripe cart from fake price edits in the browser.
