import { test, expect } from '@fixtures/testFixtures';
import { DataGenerator } from '@utils/dataGenerator';

test.describe('User API Tests', () => {
  test('should create a new user', async ({ userAPI }) => {
    const userData = {
      name: 'Test User',
      email: DataGenerator.randomEmail(),
      age: DataGenerator.randomNumber(18, 80)
    };

    const response = await userAPI.createUser(userData);
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body.email).toBe(userData.email);
  });

  test('should get user by ID', async ({ userAPI }) => {
    const response = await userAPI.getUser('1');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('id');
  });

  test('should update user', async ({ userAPI }) => {
    const updateData = {
      name: 'Updated Name'
    };

    const response = await userAPI.updateUser('1', updateData);
    expect(response.status()).toBe(200);
  });
});
