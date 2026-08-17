export interface Seeder {
  readonly name: string;
  readonly order: number;

  run(): Promise<void>;
}