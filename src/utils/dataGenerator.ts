export class DataGenerator {
  static randomEmail(): string {
    return `test_${Date.now()}@example.com`;
  }

  static randomString(length: number = 10): string {
    return Math.random().toString(36).substring(2, length + 2);
  }

  static randomNumber(min: number = 0, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
