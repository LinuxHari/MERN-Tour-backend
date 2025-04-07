import { Client, Receiver } from "@upstash/qstash";
import envConfig from "../config/envConfig";
import { UpstashData, UpstashPublishData } from "../type";

const upstashClient = new Client({
  token: envConfig.upstashToken
});

const upstashReciever = new Receiver({
  currentSigningKey: envConfig.upstashCurrentSignKey as string,
  nextSigningKey: envConfig.upstashNextSignKey as string
});

const upstashWebhook = `${envConfig.backend}/webhook/upstash`;

export const upstashValidate = async ({ signature, body }: UpstashData) => {
  return await upstashReciever.verify({
    signature,
    body,
    url: upstashWebhook
  });
};

export const upstashPublish = async ({ body, delay }: UpstashPublishData) =>
  await upstashClient.publishJSON({
    body,
    delay,
    url: upstashWebhook
  });
