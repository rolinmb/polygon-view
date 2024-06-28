import { restClient } from '@polygon.io/client-js';
import { API_KEY } from './utils.mjs';
const polygon = restClient(API_KEY);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Seems to only allow SPY / QQQ / DIA / IWM etf tickers with free API access
const ticker = 'DIA';
const optionChain = {
  'Calls': {},
  'Puts': {},
};
var expirations = [];

async function getChainExpirations() {
  let query = {
    'underlying_ticker': ticker,
    'contract_type': 'call',
    'strike_price': 550,
    'expired': false,
    'limit': 1000,
    'sort': 'expiration_date',
  };
  try {
    const data = await polygon.reference.optionsContracts(query);
    data.results.forEach(contract => {
      expirations.push(contract['expiration_date']);
    });
  } catch (e) {
    console.error('An error occured while fetching option chain expirations:', e);
  }
}

async function fetchOptionChain() {
  for (const expiry of expirations) {
    let query = {
      'underlying_ticker': ticker,
      'contract_type': 'call',
      'expiration_date': expiry,
      'strike_price.gt': 0,
      'expired': false,
      'limit': 1000,
      'sort': 'expiration_date',
    };
    try {
      const callData = await polygon.reference.optionsContracts(query);
      console.log(`Fetched ${ticker} ${expiry} Calls`);
      //console.log(callData.results);
      optionChain['Calls'][expiry] = callData.results.map(call => new Object(
        {
          'ticker': call.ticker,
          'expiry': call.expiration_date,
          'strike': call.strike_price,
        }
      ));
    } catch (e) {
      console.error('An error occurred while fetching call options:', e);
    }
    query['contract_type'] = 'put';
    await sleep(12000);
    try {
      const putData = await polygon.reference.optionsContracts(query);
      console.log(`Fetched ${ticker} ${expiry} Puts`);
      //console.log(putData.results);
      optionChain['Puts'][expiry] = putData.results.map(put => new Object({
          'ticker': put.ticker,
          'expiry': put.expiration_date,
          'strike': put.strike_price,
        }
      ));
    } catch (e) {
      console.error('An error occurred while fetching put options:', e);
    }
    await sleep(12000);
  }
}

getChainExpirations().then(() => {
  console.log('\nFetched '+ticker+' Option Chain Expirations\n');
  sleep(12000).then(() => {
    fetchOptionChain().then(() => {
      console.log('\nFetched '+ticker+' Full Option Chain:\n');
      console.log('\n'+ticker+' Calls:\n', optionChain['Calls']);
      console.log('\n'+ticker+' Puts:\n', optionChain['Puts']);
    });
  });
});

// Test fetching candlesticks for SPY 650 C; expiry Dec 19th 2025
/*polygon.options.aggregates("O:SPY251219C00650000", 1, "day", "2020-01-01", "2024-06-21", false, "desc", 50000).then(data => {
  console.log(data);
}).catch(e => {
  console.error("An error occured while fetching Polygon.io options api:", e);
});*/
