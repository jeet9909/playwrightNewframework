import dotenv from 'dotenv';

dotenv.config();

export const env = {
  BASE_URL: process.env.BASE_URL || 'https://example.com',
  API_BASE_URL: process.env.API_BASE_URL || '',
  USERNAME: process.env.USERNAME || '',
  PASSWORD: process.env.PASSWORD || ''
};
