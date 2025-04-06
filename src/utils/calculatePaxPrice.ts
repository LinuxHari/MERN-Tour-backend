import { TourModel } from "../models/tourModel";
import formatPrice from "./formatPrice";

const calculatePaxPrice = (pax: TourModel["price"], exchangeRate: number) => {
  pax.adult = formatPrice(pax.adult * exchangeRate);
  if (pax?.teen) pax.teen = formatPrice(pax.teen * exchangeRate);
  if (pax?.child) pax.child = formatPrice(pax.child * exchangeRate);
  if (pax?.infant) pax.infant = formatPrice(pax.infant * exchangeRate);

  return pax;
};

export default calculatePaxPrice;
