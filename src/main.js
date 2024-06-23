import { restClient } from '@polygon.io/client-js';
import { API_KEY } from './utils.mjs';
const polygon = restClient(API_KEY);
//console.log(polygon);
// Test fetching candlesticks for SPY 650 C; expiry Dec 19th 2025
polygon.options.aggregates("O:SPY251219C00650000", 1, "day", "2020-01-01", "2024-06-21", false, "desc", 50000).then(data => {
  console.log(data);
}).catch(e => {
  console.error("An error occured while fetching Polygon.io options api:", e);
});
