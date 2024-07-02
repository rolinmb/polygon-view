import { restClient } from '@polygon.io/client-js';
import { API_KEY } from './utils.mjs';
const polygon = restClient(API_KEY);
import ApexCharts from 'apexcharts';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const tickers = ['DIA', 'IWM', 'QQQ', 'SPY']; // Only available with free API access
const optionChain = {
  'Calls': {},
  'Puts': {},
};
var expirations = [];
var chartData = [];
const candleData = {
  series: [],
  chart: {
    type: 'line',
    height: 350
  },
  title: {
    text: 'Option Contract Candlestick Chart',
    align: 'left'
  },
  stroke: {
    width: [3, 1]
  },
  xaxis: {
    type: 'datetime'
  },
  yaxis: {
    tooltip: {
      enabled: true
    }
  }
};

/*var testData  = {
  series: [
    {
      data: [
        {
          x: new Date(1538778600000),
          y: [6629.81, 6650.5, 6623.04, 6633.33]
        },
        {
          x: new Date(1538780400000),
          y: [6632.01, 6643.59, 6620, 6630.11]
        },
        {
          x: new Date(1538782200000),
          y: [6630.71, 6648.95, 6623.34, 6635.65]
        },
        {
          x: new Date(1538784000000),
          y: [6635.65, 6651, 6629.67, 6638.24]
        },
        {
          x: new Date(1538785800000),
          y: [6638.24, 6640, 6620, 6624.47]
        },
      ]
    }
  ],
  chart: {
    type: 'candlestick',
    height: 350
  },
  title: {
    text: 'CandleStick Chart Test',
    align: 'left'
  },
  xaxis: {
    type: 'datetime'
  },
  yaxis: {
    tooltip: {
      enabled: true
    }
  }
};*/

async function getChainExpirations(ticker) {
  let query = {
    'underlying_ticker': ticker,
    'contract_type': 'call',
    'strike_price': 550,
    'expired': false,
    'limit': 1000,
    'sort': 'expiration_date',
  };
  try {
    const expiryData = await polygon.reference.optionsContracts(query);
    expiryData.results.forEach(contract => {
      expirations.push(contract['expiration_date']);
    });
  } catch (e) {
    console.error('getChainExpirations :: An error occured while fetching option chain expirations:', e);
  }
}

async function fetchOptionChain(ticker) {
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
      optionChain['Calls'][expiry] = callData.results.map(call => (
        {
          'ticker': call.ticker,
          'expiry': call.expiration_date,
          'strike': call.strike_price,
        }
      ));
    } catch (e) {
      console.error('fetchOptionChain :: An error occurred while fetching call options:', e);
    }
    query['contract_type'] = 'put';
    await sleep(12000);
    try {
      const putData = await polygon.reference.optionsContracts(query);
      console.log(`Fetched ${ticker} ${expiry} Puts`);
      //console.log(putData.results);
      optionChain['Puts'][expiry] = putData.results.map(put => new Object(
        {
          'ticker': put.ticker,
          'expiry': put.expiration_date,
          'strike': put.strike_price,
        }
      ));
    } catch (e) {
      console.error('fetchOptionChain :: An error occurred while fetching put options:', e);
    }
    await sleep(12000);
  }
}

async function getOptionChartData(optionTicker) {
  try {
    const data = await polygon.options.aggregates(optionTicker, 1, "day", "2020-01-01", "2024-07-01", false, "desc", 50000);
    chartData = data.results;
  } catch (e) {
    console.error("getOptionChartData :: An error occured while fetching option chart data:", e);
  }
}

function displayOptionChain() {
  const chainWrap = document.querySelector("#chain-wrap");
}

async function test() {
  document.querySelector("#chart").innerHTML = '';
  document.querySelector("#chain-wrap").innerHTML = '';
  let ticker = tickers[0];
  await getChainExpirations(ticker);
  console.log(`\nFetched ${ticker} Option Chain Expirations\n`);
  await sleep(12000);
  await fetchOptionChain(ticker);
  console.log(`\nFetched ${ticker} Full Option Chain\n`);
  await sleep(12000);
  const optionTicker = optionChain['Calls']['2024-12-20'][0]['ticker'];
  await getOptionChartData(optionTicker);
  console.log(`\nSuccessfully fetched chart data for option contract ${optionTicker}\n`);
  candleData.series.push(
    {
      name: 'line',
      type: 'line',
      data: chartData.map(data => new Object(
        {
          x: new Date(data.t),
          y: data.c
        }
      ))
    }
  );
  candleData.series.push(
    {
      name: 'candle',
      type: 'candlestick',
      data: chartData.map(data => new Object(
        {
          x: new Date(data.t),
          y: [data.o, data.h, data.l, data.c]
        }
      ))
    }
  );
  candleData.title.text = `${optionTicker} Trading History`;
  var chart = new ApexCharts(document.querySelector("#chart"), candleData);
  chart.render();
  //displayOptionChain();
}

async function getUnderlying(ticker) {
  document.querySelector("#chart").innerHTML = '';
  document.querySelector("#chain-wrap").innerHTML = '';
  await getChainExpirations(ticker);
  console.log(`\nFetched ${ticker} Option Chain Expirations\n`);
  await sleep(12000);
  await fetchOptionChain(ticker);
  console.log(`\nFetched ${ticker} Full Option Chain\n`);
  //displayOptionChain();
}

function initUi() {
  const tickerList = document.querySelector('#tickers-list');
  tickers.forEach(tkr => {
    const tickerLi = document.createElement('li');
    tickerLi.innerHTML = tkr;
    tickerLi.onclick = () => getUnderlying(tkr);
    tickerList.appendChild(tickerLi);
  });
}

window.onload = function() {
  initUi();/*
  test().catch(e => {
    console.error('main.js :: main() function failed to load and/or execute:', e);
  });*/
}