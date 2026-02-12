import { PrismaClient } from "../../prisma/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  // Returns the single instance of PrismaClient
  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      });

      PrismaService.instance = new PrismaClient({ adapter });
      console.log("Prisma Client initialized!");
    }
    return PrismaService.instance;
  }
}

export default PrismaService;
