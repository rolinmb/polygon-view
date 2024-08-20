import { restClient } from '@polygon.io/client-js';
import { API_KEY } from './utils.mjs';
const polygon = restClient(API_KEY);
import ApexCharts from 'apexcharts';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const tickers = ['DIA', 'IWM', 'QQQ', 'SPY']; // Only available with free API access
const chainLabels = ['Type', 'Ticker', 'Expiry', 'Strike'];
let optionChain = {
  Calls: {},
  Puts: {},
};
let expirations = [];
let optionChartData = [];
let optionApexCandleData = {
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

async function getChainExpirations(ticker) {
  document.querySelector("#chain-wrap").innerHTML = '';
  expirations = [];
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

async function getOptionChain(ticker) {
  document.querySelector("#chain-wrap").innerHTML = '';
  optionChain.Calls = {};
  optionChain.Puts = {};
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
      optionChain.Calls[expiry] = callData.results.map(call => (
        {
          'ticker': call.ticker,
          'expiry': call.expiration_date,
          'strike': call.strike_price,
        }
      ));
    } catch (e) {
      console.error('getOptionChain :: An error occurred while fetching call options:', e);
    }
    query['contract_type'] = 'put';
    await sleep(12000);
    try {
      const putData = await polygon.reference.optionsContracts(query);
      console.log(`Fetched ${ticker} ${expiry} Puts`);
      //console.log(putData.results);
      optionChain.Puts[expiry] = putData.results.map(put => new Object(
        {
          'ticker': put.ticker,
          'expiry': put.expiration_date,
          'strike': put.strike_price,
        }
      ));
    } catch (e) {
      console.error('getOptionChain :: An error occurred while fetching put options:', e);
    }
    await sleep(12000);
  }
}

async function getOptionChartData(optionTicker) {
  await sleep(12000);
  const optionChartDiv = document.querySelector("#option-chart");
  optionChartDiv.innerHTML = '';
  optionChartData = [];
  optionApexCandleData.series = [];
  try {
    const data = await polygon.options.aggregates(optionTicker, 1, 'day', '2020-01-01', '2024-08-19', false, 'desc', 50000);
    if (data && data.results && data.results.length > 0) {
      optionChartData = data.results;
      optionApexCandleData.series.push(
        {
          name: 'line',
          type: 'line',
          data: optionChartData.map(data => new Object(
            {
              x: new Date(data.t),
              y: data.c
            }
          ))
        }
      );
      optionApexCandleData.series.push(
        {
          name: 'candle',
          type: 'candlestick',
          data: optionChartData.map(data => new Object(
            {
              x: new Date(data.t),
              y: [data.o, data.h, data.l, data.c]
            }
          ))
        }
      );
      optionApexCandleData.title.text = `${optionTicker} Trading History`;
      let chart = new ApexCharts(optionChartDiv, optionApexCandleData);
      chart.render();
    } else {
      optionChartDiv.innerHTML = 'No data from polygon.io to display.';
      console.error('getOptionChartData :: An error occured while fetching and displaying option chart candlestick data; no data returned from API');
    }
  } catch (e) {
    console.error('getOptionChartData :: An error occured while fetching and displaying option chart candlestick data:', e);
  }
}

function displayOptionChain() {
  const chainWrap = document.querySelector('#chain-wrap');
  const table = document.createElement('table');
  table.setAttribute('border', '1');
  const tHead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  chainLabels.forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  }); 
  tHead.appendChild(headerRow);
  table.appendChild(tHead);
  const tBody = document.createElement('tbody');
  const addRow = (type, option) => {
    const newRow = document.createElement('tr');
    const typeTd = document.createElement('td');
    typeTd.textContent = type;
    newRow.appendChild(typeTd);
    const tickerTd = document.createElement('td');
    tickerTd.textContent = option.ticker;
    tickerTd.onclick = () => getOptionChartData(option.ticker);
    newRow.appendChild(tickerTd);
    const expiryTd = document.createElement('td');
    expiryTd.textContent = option.expiry;
    newRow.appendChild(expiryTd);
    const strikeTd = document.createElement('td');
    strikeTd.textContent = option.strike;
    newRow.appendChild(strikeTd);
    tBody.appendChild(newRow);
  };
  for (const expiry in optionChain.Calls) {
    optionChain.Calls[expiry].forEach(call => addRow('Call', call));
  }
  for (const expiry in optionChain.Puts) {
    optionChain.Puts[expiry].forEach(put => addRow('Put', put));
  }
  table.append(tBody);
  chainWrap.appendChild(table);
}

async function test() {
  let ticker = tickers[0];
  await getChainExpirations(ticker);
  console.log(`\nFetched ${ticker} Option Chain Expirations\n`);
  await sleep(12000);
  await getOptionChain(ticker);
  console.log(`\nFetched ${ticker} Full Option Chain\n`);
  displayOptionChain();
  const optionTicker = optionChain.Calls['2024-12-20'][0]['ticker'];
  await getOptionChartData(optionTicker);
  console.log(`\nSuccessfully fetched chart data for option contract ${optionTicker}\n`);
}

async function getUnderlying(ticker) {
  document.querySelector("#underlying-chart").innerHTML = '';
  document.querySelector("#option-chart").innerHTML = '';
  document.querySelector("#chain-wrap").innerHTML = '';
  optionChain.Calls = {};
  optionChain.Puts = {};
  expirations = [];
  optionChartData = [];
  optionApexCandleData.series = [];
  await sleep(12000);
  await getChainExpirations(ticker);
  console.log(`\nFetched ${ticker} Option Chain Expirations\n`);
  await sleep(12000);
  await getOptionChain(ticker);
  console.log(`\nFetched ${ticker} Full Option Chain\n`);
  displayOptionChain();
}

function initUi() {
  const tickerList = document.querySelector('#tickers-list');
  tickers.forEach(tkr => {
    const tickerLi = document.createElement('li');
    tickerLi.textContent = tkr;
    tickerLi.onclick = () => getUnderlying(tkr);
    tickerList.appendChild(tickerLi);
  });
}

window.onload = function() {
  initUi();
  /*test().catch(e => {
    console.error('main.js :: main() function failed to load and/or execute:', e);
  });*/
}