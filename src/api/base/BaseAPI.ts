import { APIRequestContext, request } from '@playwright/test';
import { Logger } from '@utils/logger';

export class BaseAPI {
  protected apiContext!: APIRequestContext;
  protected baseURL: string;
  protected logger: Logger;
  protected headers: Record<string, string>;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.API_BASE_URL || '';
    this.logger = new Logger(this.constructor.name);
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async init(): Promise<void> {
    this.apiContext = await request.newContext({
      baseURL: this.baseURL,
      extraHTTPHeaders: this.headers
    });
  }

  async setAuthToken(token: string): Promise<void> {
    this.headers['Authorization'] = `Bearer ${token}`;
    await this.apiContext.dispose();
    await this.init();
  }

  async get(endpoint: string, params?: Record<string, any>) {
    this.logger.info(`GET request to: ${endpoint}`);
    const response = await this.apiContext.get(endpoint, { params });
    this.logger.info(`Response status: ${response.status()}`);
    return response;
  }

  async post(endpoint: string, data: any) {
    this.logger.info(`POST request to: ${endpoint}`);
    const response = await this.apiContext.post(endpoint, { data });
    this.logger.info(`Response status: ${response.status()}`);
    return response;
  }

  async put(endpoint: string, data: any) {
    this.logger.info(`PUT request to: ${endpoint}`);
    const response = await this.apiContext.put(endpoint, { data });
    this.logger.info(`Response status: ${response.status()}`);
    return response;
  }

  async delete(endpoint: string) {
    this.logger.info(`DELETE request to: ${endpoint}`);
    const response = await this.apiContext.delete(endpoint);
    this.logger.info(`Response status: ${response.status()}`);
    return response;
  }

  async dispose(): Promise<void> {
    await this.apiContext.dispose();
  }
}
