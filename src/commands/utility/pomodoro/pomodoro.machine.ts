import { createMachine, assign } from "xstate";

const NODE_ENV = process.env.NODE_ENV || "DEVELOPMENT";

export interface PomodoroContext {
  focusDuration: number;
  breakDuration: number;
  remainingTime: number;
  cycles: number;
  endsAt: number | null;
}

export type PomodoroEvent =
  | { type: "START"; duration: number }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "ADD_TIME"; amount: number }
  | { type: "CANCEL" }
  | { type: "BREAK_5" }
  | { type: "BREAK_15" }
  | {
      type: "HYDRATE";
      stateValue:
        | "idle"
        | "breakDecision"
        | "breakEndDecision"
        | { focus: "running" | "paused" }
        | { break: "running" };
      context: Partial<PomodoroContext>;
    };

type HydrateEvent = Extract<PomodoroEvent, { type: "HYDRATE" }>;

const toNonNegativeNumber = (value: unknown, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const isHydrateEvent = (event: PomodoroEvent): event is HydrateEvent =>
  event.type === "HYDRATE";

const isHydrateWithState = (
  event: PomodoroEvent,
  state: Extract<HydrateEvent["stateValue"], string>,
) => isHydrateEvent(event) && event.stateValue === state;

const isHydrateFocusState = (
  event: PomodoroEvent,
  state: "running" | "paused",
) =>
  isHydrateEvent(event) &&
  typeof event.stateValue === "object" &&
  event.stateValue !== null &&
  "focus" in event.stateValue &&
  event.stateValue.focus === state;

const isHydrateBreakState = (event: PomodoroEvent, state: "running") =>
  isHydrateEvent(event) &&
  typeof event.stateValue === "object" &&
  event.stateValue !== null &&
  "break" in event.stateValue &&
  event.stateValue.break === state;

type HydrateAssignArgs = {
  context: PomodoroContext;
  event: PomodoroEvent;
};

const hydrateAssignment = () => ({
  focusDuration: ({ context, event }: HydrateAssignArgs) =>
    event.type === "HYDRATE"
      ? toNonNegativeNumber(event.context.focusDuration, context.focusDuration)
      : context.focusDuration,
  breakDuration: ({ context, event }: HydrateAssignArgs) =>
    event.type === "HYDRATE"
      ? toNonNegativeNumber(event.context.breakDuration, context.breakDuration)
      : context.breakDuration,
  remainingTime: ({ context, event }: HydrateAssignArgs) =>
    event.type === "HYDRATE"
      ? toNonNegativeNumber(event.context.remainingTime, context.remainingTime)
      : context.remainingTime,
  cycles: ({ context, event }: HydrateAssignArgs) =>
    event.type === "HYDRATE"
      ? toNonNegativeNumber(event.context.cycles, context.cycles)
      : context.cycles,
  endsAt: ({ context, event }: HydrateAssignArgs) =>
    event.type === "HYDRATE"
      ? (event.context.endsAt ?? context.endsAt ?? null)
      : context.endsAt,
});

export const pomodoroMachine = createMachine({
  types: {} as {
    context: PomodoroContext;
    events: PomodoroEvent;
  },

  id: "pomodoro",
  initial: "idle",

  context: {
    focusDuration: 0,
    breakDuration: 0,
    remainingTime: 0,
    cycles: 0,
    endsAt: null,
  },
  on: {
    HYDRATE: [
      {
        guard: ({ event }) => isHydrateWithState(event, "idle"),
        target: ".idle",
        actions: assign(hydrateAssignment()),
      },
      {
        guard: ({ event }) => isHydrateWithState(event, "breakDecision"),
        target: ".breakDecision",
        actions: assign(hydrateAssignment()),
      },
      {
        guard: ({ event }) => isHydrateWithState(event, "breakEndDecision"),
        target: ".breakEndDecision",
        actions: assign(hydrateAssignment()),
      },
      {
        guard: ({ event }) => isHydrateFocusState(event, "running"),
        target: ".focus.running",
        actions: assign(hydrateAssignment()),
      },
      {
        guard: ({ event }) => isHydrateFocusState(event, "paused"),
        target: ".focus.paused",
        actions: assign(hydrateAssignment()),
      },
      {
        guard: ({ event }) => isHydrateBreakState(event, "running"),
        target: ".break.running",
        actions: assign(hydrateAssignment()),
      },
    ],
  },
  states: {
    idle: {
      entry: assign({ cycles: () => 0 }),
      on: {
        START: {
          target: "focus.running",
          actions: assign({
            focusDuration: ({ event }) => event.duration,
            remainingTime: ({ event }) => event.duration,
            endsAt: ({ event }) => Date.now() + event.duration,
            cycles: () => 1,
          }),
        },
      },
    },

    focus: {
      initial: "running",

      states: {
        running: {
          always: {
            guard: ({ context }) =>
              context.endsAt !== null && Date.now() >= context.endsAt,
            target: "#pomodoro.breakDecision",
            actions: assign({
              remainingTime: () => 0,
              endsAt: () => null,
            }),
          },

          after: {
            1000: [
              {
                target: "running",
                reenter: true,
                actions: assign({
                  remainingTime: ({ context }) =>
                    context.endsAt
                      ? Math.max(0, context.endsAt - Date.now())
                      : context.remainingTime,
                }),
              },
            ],
          },

          on: {
            PAUSE: {
              target: "paused",
              actions: assign({
                remainingTime: ({ context }) =>
                  context.endsAt
                    ? Math.max(0, context.endsAt - Date.now())
                    : context.remainingTime,
                endsAt: () => null,
              }),
            },

            ADD_TIME: {
              actions: assign({
                focusDuration: ({ context, event }) =>
                  context.focusDuration + event.amount,
                remainingTime: ({ context, event }) =>
                  context.remainingTime + event.amount,
                endsAt: ({ context, event }) =>
                  context.endsAt ? context.endsAt + event.amount : null,
              }),
            },

            CANCEL: {
              target: "#pomodoro.idle",
              actions: assign({ cycles: () => 0 }),
            },
          },
        },

        paused: {
          on: {
            RESUME: {
              target: "running",
              actions: assign({
                endsAt: ({ context }) => Date.now() + context.remainingTime,
              }),
            },

            ADD_TIME: {
              actions: assign({
                focusDuration: ({ context, event }) =>
                  context.focusDuration + event.amount,
                remainingTime: ({ context, event }) =>
                  context.remainingTime + event.amount,
              }),
            },

            CANCEL: {
              target: "#pomodoro.idle",
              actions: assign({ cycles: () => 0 }),
            },
          },
        },
      },
    },

    breakDecision: {
      on: {
        BREAK_5: {
          target: "break.running",
          actions: assign({
            breakDuration: () =>
              NODE_ENV === "DEVELOPMENT" ? 1 : 5 * 60 * 1000,
            endsAt: () =>
              Date.now() + (NODE_ENV === "DEVELOPMENT" ? 1 : 5 * 60 * 1000),
            remainingTime: () =>
              NODE_ENV === "DEVELOPMENT" ? 1 : 5 * 60 * 1000,
          }),
        },

        BREAK_15: {
          target: "break.running",
          actions: assign({
            breakDuration: () =>
              NODE_ENV === "DEVELOPMENT" ? 1 : 15 * 60 * 1000,
            endsAt: () =>
              Date.now() + (NODE_ENV === "DEVELOPMENT" ? 1 : 15 * 60 * 1000),
            remainingTime: () =>
              NODE_ENV === "DEVELOPMENT" ? 1 : 15 * 60 * 1000,
          }),
        },

        CANCEL: {
          target: "idle",
          actions: assign({ cycles: () => 0 }),
        },
      },
    },

    break: {
      initial: "running",

      states: {
        running: {
          after: {
            1000: [
              {
                guard: ({ context }) =>
                  context.endsAt !== null && Date.now() >= context.endsAt,
                target: "#pomodoro.breakEndDecision",
                actions: assign({
                  remainingTime: () => 0,
                  endsAt: () => null,
                }),
              },
              {
                target: "running",
                reenter: true,
                actions: assign({
                  remainingTime: ({ context }) =>
                    context.endsAt
                      ? Math.max(0, context.endsAt - Date.now())
                      : context.remainingTime,
                }),
              },
            ],
          },
        },
      },
    },

    breakEndDecision: {
      on: {
        RESUME: {
          target: "focus.running",
          actions: assign({
            remainingTime: ({ context }) => context.focusDuration,
            endsAt: ({ context }) => Date.now() + context.focusDuration,
            cycles: ({ context }) => context.cycles + 1,
          }),
        },

        CANCEL: {
          target: "idle",
          actions: assign({ cycles: () => 0 }),
        },
      },
    },
  },
});
