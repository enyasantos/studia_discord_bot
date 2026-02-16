import pino from "pino";

export default pino({
  transport: {
    target: "pino-pretty", // deixa legível e colorido
    options: { colorize: true },
  },
});
