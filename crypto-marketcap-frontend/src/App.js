//Kareena Matwani
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import './App.css';

function App() {
  const [selectedCryptos, setSelectedCryptos] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    },
  ]);
  const [cryptosList, setCryptosList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCryptosList = async () => {
      try {
        const response = await axios.get('http://localhost:3001/cryptocurrency/listings/latest');
        const cryptosData = response.data.data;

        const cryptosList = cryptosData.map((crypto) => ({
          id: crypto.id,
          symbol: crypto.symbol,
          name: crypto.name,
        }));
        setCryptosList(cryptosList);
      } catch (error) {
        console.error('Error fetching cryptocurrency list:', error);
      }
    };

    fetchCryptosList();
  }, []);

  const handleCheckboxChange = (cryptoSymbol) => {
    setSelectedCryptos((prevSelectedCryptos) => {
      if (prevSelectedCryptos.includes(cryptoSymbol)) {
        return prevSelectedCryptos.filter((symbol) => symbol !== cryptoSymbol);
      } else {
        return [...prevSelectedCryptos, cryptoSymbol];
      }
    });
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      console.log('Selected Cryptos:', selectedCryptos);
      const response = await axios.get('http://localhost:3001/performOperations', {
        params: {
          cryptos: selectedCryptos.join(','),
        },
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = response.data.data;
      console.log(responseData);

      // Download JSON as TXT file
      const jsonData = JSON.stringify(responseData);
      const blob = new Blob([jsonData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'crypto_data.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const infoSteps = [
    'Select cryptocurrencies for downloading information regarding the same.',
    'Select date range for fetching information based on the selection of days.',
    'Click "Fetch Data" and download the data using the provided link.',
  ];

  return (  
    <div className="App">
      <h1>Crypto Market Cap Tracker</h1> <div className="InfoIcon" onClick={() => alert(infoSteps.join('\n'))}>
        <button>Information about the Tool</button>
      </div>
      <label style={{ textAlign: 'center' }}>Select Cryptocurrencies:</label>
      <div className="CryptoSelection">
        <div className="slider">
          {cryptosList.map((crypto) => (
            <label key={crypto.id}>
              <input
                type="checkbox"
                id={crypto.symbol}
                value={crypto.symbol}
                checked={selectedCryptos.includes(crypto.symbol)}
                onChange={() => handleCheckboxChange(crypto.symbol)}
              />
              {crypto.name} ({crypto.symbol})
            </label>
          ))}
        </div>
      </div>

      <div>
        <label>Select Date Range:</label>
        <DateRange
          ranges={selectedDateRange}
          onChange={(ranges) => setSelectedDateRange([ranges.selection])}
        />
      </div>

      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>

     
    </div>
  );
}

export default App;
