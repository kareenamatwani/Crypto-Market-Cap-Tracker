const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());

const coinMarketCapUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';
const apiKey = '20c65520-d42b-49da-b6ab-475bba88050e';
const fetchWeeklyMarketCapSummary = async (selectedCryptos, dateRange) => {
  try {
    console.log('Selected Cryptos:', selectedCryptos);

    const response = await axios.get(coinMarketCapUrl, {
      params: {},
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    });

    const responseData = response.data;

    if (responseData.status.error_code !== 0) {
      throw new Error(`CoinMarketCap API error: ${responseData.status.error_message}`);
    }

    const selectedData = responseData.data
      .filter(item => selectedCryptos.includes(item.symbol))
      .map(item => ({
        name: item.name,
        symbol: item.symbol,
        date_added: item.date_added,
        price: item.quote.USD.price,
        circulating_supply: item.circulating_supply,
        total_supply: item.total_supply,
        max_supply: item.max_supply,
        num_market_pairs: item.num_market_pairs,
        market_cap_strict: item.quote.USD.market_cap * item.circulating_supply, 
        market_cap_by_total_supply_strict: item.quote.USD.market_cap * item.total_supply,
        volume_24h: item.quote.USD.volume_24h,
        percent_change_1h: item.quote.USD.percent_change_1h,
        percent_change_24h: item.quote.USD.percent_change_24h,
        percent_change_7d: item.quote.USD.percent_change_7d,
      }));


    return { status: responseData.status, data: selectedData };
  } catch (error) {
    console.error('Error fetching weekly market cap summary:', error);
    throw error;
  }
};

const saveDataAsJSON = (data, filePath) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('Data saved as JSON successfully.');
  } catch (error) {
    console.error('Error saving data as JSON:', error);
    throw error;
  }
};

const downloadFile = (filePath, res) => {
  res.download(filePath, 'market_cap_summary.json', (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Internal Server Error');
    } else {
      console.log('File downloaded successfully.');
    }
  });
};

app.get('/cryptocurrency/listings/latest', async (req, res) => {
  try {
    const response = await axios.get(coinMarketCapUrl, {
      params: {},
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying request to CoinMarketCap API:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/performOperations', async (req, res) => {
  try {
    const startTime = Date.now();
    const selectedCryptos = req.query.cryptos; 
    const dateRange = req.query.dateRange;

    if (!selectedCryptos || !Array.isArray(selectedCryptos.split(','))) {
      console.error('No selected cryptocurrencies provided or invalid format.');
      return res.status(400).send('Bad Request: No selected cryptocurrencies provided or invalid format.');
    }

    const weeklySummary = await fetchWeeklyMarketCapSummary(selectedCryptos.split(','), dateRange);

    const outputFilePath = path.join(__dirname, 'market_cap_summary.json');
    saveDataAsJSON(weeklySummary, outputFilePath);

    downloadFile(outputFilePath, res);

    const endTime = Date.now();
    const totalOperationTime = endTime - startTime;
    console.log('Total operation time:', totalOperationTime, 'ms');
  } catch (error) {
    console.error('Error performing operations:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
