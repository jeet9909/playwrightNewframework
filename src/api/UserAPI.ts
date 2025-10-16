import { BaseAPI } from './base/BaseAPI';

export class UserAPI extends BaseAPI {
  private readonly endpoint = '/users';

  async createUser(userData: any) {
    return await this.post(this.endpoint, userData);
  }

  async getUser(userId: string) {
    return await this.get(`${this.endpoint}/${userId}`);
  }

  async updateUser(userId: string, userData: any) {
    return await this.put(`${this.endpoint}/${userId}`, userData);
  }

  async deleteUser(userId: string) {
    return await this.delete(`${this.endpoint}/${userId}`);
  }

  async getAllUsers() {
    return await this.get(this.endpoint);
  }
}
