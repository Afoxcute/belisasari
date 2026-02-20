import { SocialFi } from 'socialfi';

const TAPESTRY_URL =
  typeof window === 'undefined'
    ? process.env.TAPESTRY_URL
    : process.env.NEXT_PUBLIC_TAPESTRY_URL;

export const socialfi = new SocialFi({
  baseURL: TAPESTRY_URL,
});
