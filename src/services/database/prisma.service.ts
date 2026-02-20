import { PrismaClient } from "../../../prisma/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import logger from "../../config/logger.js";

declare global {
  var __prismaClient__: PrismaClient | undefined;
  var __prismaConnecting__: Promise<void> | undefined;
  var __prismaShutdownHooksRegistered__: boolean | undefined;
}

class PrismaService {
  private static instance: PrismaClient | null = null;

  private constructor() {}

  // Returns the single instance of PrismaClient
  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      if (globalThis.__prismaClient__) {
        PrismaService.instance = globalThis.__prismaClient__;
        return PrismaService.instance;
      }

      const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      });

      PrismaService.instance = new PrismaClient({ adapter });
      globalThis.__prismaClient__ = PrismaService.instance;
      logger.info("[PrismaService] Prisma Client initialized!");
    }

    return PrismaService.instance;
  }

  public static async connect() {
    if (globalThis.__prismaConnecting__) {
      await globalThis.__prismaConnecting__;
      return;
    }

    try {
      const connectPromise = (async () => {
        const prisma = PrismaService.getInstance();
        await prisma.$connect();

        // Teste real de query
        await prisma.$queryRaw`SELECT 1`;

        PrismaService.registerShutdownHooks();
        logger.info(
          "[PrismaService] ✅ Successfully connected to the database!",
        );
      })();

      globalThis.__prismaConnecting__ = connectPromise;
      await connectPromise;
    } catch (error) {
      logger.error(
        { err: error },
        "[PrismaService] ❌Error on connecting to the database:",
      );
      throw error;
    } finally {
      globalThis.__prismaConnecting__ = undefined;
    }
  }

  private static registerShutdownHooks() {
    if (globalThis.__prismaShutdownHooksRegistered__) {
      return;
    }

    const shutdown = async (signal: string) => {
      try {
        const prisma = PrismaService.getInstance();
        await prisma.$disconnect();
        logger.info(`[PrismaService] Disconnected on ${signal}`);
      } catch (error) {
        logger.error({ err: error }, `[PrismaService] Error on ${signal}`);
      } finally {
        process.exit(0);
      }
    };

    process.once("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.once("SIGTERM", () => {
      void shutdown("SIGTERM");
    });

    globalThis.__prismaShutdownHooksRegistered__ = true;
  }
}

export default PrismaService;
