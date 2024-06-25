function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

import { restClient } from '@polygon.io/client-js';
import { API_KEY } from './utils.mjs';
const polygon = restClient(API_KEY);

const ticker = 'SPY';
const optionChain = {
  'Calls': [],
  'Puts': [],
};

async function fetchOptionChain() {
  for (let strike = 300; strike <= 700; strike += 25) {
    let query = {
      'underlying_ticker': ticker,
      'contract_type': 'call',
      'as_of': '2024-06-25',
      'strike_price': strike,
      'expired': false,
      'limit': 1000,
      'sort': 'strike_price',
    };
    try {
      const callData = await polygon.reference.optionsContracts(query);
      optionChain['Calls'].push(callData);
      console.log(`Fetched ${ticker} $${strike} Calls`);
    } catch (e) {
      console.error("An error occurred while fetching call options:", e);
    }
    await sleep(12000);
    query['contract_type'] = 'put';
    try {
      const putData = await polygon.reference.optionsContracts(query);
      optionChain['Puts'].push(putData);
      console.log(`Fetched ${ticker} $${strike} Puts`);
    } catch (e) {
      console.error("An error occurred while fetching put options:", e);
    }
    await sleep(12000);
  }
}

fetchOptionChain().then(() => {
  console.log(ticker+' Option Chain Successfully fetched');
  console.log('Calls:', optionChain['Calls']);
  console.log('Puts:', optionChain['Puts']);
});

/*let query_params = {
  'underlying_ticker': ticker,
  'contract_type': 'call',
  'as_of': '2024-06-25',
  'strike_price': strike,
  'expired': false,
  'limit': 1000,
  'sort': 'strike_price',
};

polygon.reference.optionsContracts(query_params).then(data => {
  console.log("\nAll "+ticker+" "+strike+" Calls\n");
  console.log(data);
}).catch(e => {
  console.error("An error occured while fetching Polygon.io options api:", e);
});

query_params['contract_type'] = 'put';

polygon.reference.optionsContracts(query_params).then(data => {
  console.log("\nAll "+ticker+" "+strike+" Puts\n");
  console.log(data);
}).catch(e => {
  console.error("An error occured while fetching Polygon.io options api:", e);
});*/

// Test fetching candlesticks for SPY 650 C; expiry Dec 19th 2025
/*polygon.options.aggregates("O:SPY251219C00650000", 1, "day", "2020-01-01", "2024-06-21", false, "desc", 50000).then(data => {
  console.log(data);
}).catch(e => {
  console.error("An error occured while fetching Polygon.io options api:", e);
});*/
