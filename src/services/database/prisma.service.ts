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

  public static async connect() {
    try {
      const prisma = PrismaService.getInstance();
      await prisma.$connect();

      // Teste real de query
      await prisma.$queryRaw`SELECT 1`;

      console.log("✅ Successfully connected to the database!");
    } catch (error) {
      console.error("❌Error on connecting to the database:", error);
      throw error;
    }
  }
}

export default PrismaService;
