import envConfig from "../config/envConfig";
import { CURRENCY_CODES } from "../config/otherConfig";
import { cachePerDay } from "../utils/cache";

export const fetchExchangeRates = async () => {
  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${envConfig.exchangeKey}/latest/USD`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (data?.conversion_rates) {
      cachePerDay.set("exchangeRates", data.conversion_rates);
      return data.conversion_rates;
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to fetch exchange rates`, error);
  }
  return null;
};

const getCurrencyExchangeRate = async (currency: string) => {
  let rates = cachePerDay.get<{ [key: string]: number }>("exchangeRates");

  if (!rates) rates = await fetchExchangeRates();

  const exchangeRate = rates?.[currency];
  const currencyCode = CURRENCY_CODES[currency as keyof typeof CURRENCY_CODES];

  if (!rates || !currencyCode || !rates[currency]) return null;

  return { exchangeRate, currencyCode };
};

export { getCurrencyExchangeRate };
