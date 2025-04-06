import NodeCache from "node-cache";

export const cachePerDay = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });
