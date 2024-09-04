/**
 * @template T
 * @typedef {{ ok: true, value: T }} Ok<T>
 */

/**
 * @template E
 * @typedef {{ ok: false, error: E }} Err<E>
 */

/**
 * @template T
 * @template E
 * @typedef {Ok<T> | Err<E>} Result<T,E>
 */

/**
 * @template T
 * @param {T} value
 * @returns {Ok<T>}
 */
function ok(value) {
  return { ok: true, value };
}

/**
 * @template E
 * @param {E} error
 * @returns {Err<E>}
 */
function err(error) {
  return { ok: false, error };
}

/**
 * @param {never} value
 * @returns {never}
 */
function assertExhaustive(value) {
  throw new Error(`Non-exhaustive for value: ${JSON.stringify(value)}`);
}

/**
 * @param {boolean} assertion
 */
function assert(assertion) {
  if (!assertion) {
    throw new Error("Assertion failed!");
  }
}

/**
 * @param {boolean | null | number | string | undefined} left
 * @param {boolean | null | number | string | undefined} right
 */
function assertEqual(left, right) {
  if (left !== right) {
    throw new Error(`Assertion failed: ${String(left)} !== ${String(right)}`);
  }
}

/**
 * @template T
 * @param {T | null} value
 * @returns {T}
 */
function assertNonNull(value) {
  if (value === null) {
    throw new Error(`Assertion failed: value was null`);
  }
  return value;
}

/**
 * @template T
 * @param {T} a
 * @param {T} b
 */
function assertJSONEqual(a, b) {
  let strA = JSON.stringify(a, null, 2);
  let strB = JSON.stringify(b, null, 2);
  if (strA !== strB) {
    throw new Error(`Assertion failed: values are not equal\n${strA}\n${strB}`);
  }
}

/** @typedef {{ [K in keyof Date as Exclude<K, `set${string}`>]: Date[K] }} ImmutableDate */

/**
 * @param {ImmutableDate} a
 * @param {ImmutableDate} b
 */
function assertDatesEqual(a, b) {
  if (a.valueOf() !== b.valueOf()) {
    throw new Error(`Assertion failed: ${String(a)} !== ${String(b)}`);
  }
}

/**
 * @param {ImmutableDate} date
 * @returns {string}
 */
function serializeDate(date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.valueOf() - tzOffsetMs).toISOString().slice(0, -1);
}

assertEqual(
  serializeDate(new Date(1971, 1, 3, 4, 5, 6, 7)),
  "1971-02-03T04:05:06.007",
);

/**
 * @param {string} s
 * @returns {ImmutableDate | null}
 */
function parseDate(s) {
  const date = new Date(s);
  if (isNaN(date.valueOf())) {
    return null;
  }
  return date;
}

assertDatesEqual(
  assertNonNull(parseDate("1971-02-03T04:05:06.007")),
  new Date(1971, 1, 3, 4, 5, 6, 7),
);

/** @typedef {{ years?: number, months?: number, days?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number }} Duration */

/**
 * @param {Duration} duration
 * @returns {string}
 */
function serializeDuration(duration) {
  const { years, months, days, hours, minutes, seconds, milliseconds } =
    duration;

  let s = "P";
  if (years) {
    s += `${String(years)}Y`;
  }
  if (months) {
    s += `${String(months)}M`;
  }
  if (days) {
    s += `${String(days)}D`;
  }
  s += "T";
  if (hours) {
    s += `${String(hours)}H`;
  }
  if (minutes) {
    s += `${String(minutes)}M`;
  }
  const floatSeconds = (seconds ?? 0) + (milliseconds ?? 0) / 1000;
  if (floatSeconds !== 0) {
    s += `${floatSeconds.toFixed(3).replace(".000", "")}S`;
  }

  if (s.endsWith("T")) {
    s = s.substring(0, s.length - 1);
  }

  if (s === "P") {
    s += "0D";
  }

  return s;
}

assertEqual(
  serializeDuration({
    years: 1,
    months: 2,
    days: 3,
    hours: 4,
    minutes: 5,
    seconds: 6,
    milliseconds: 7,
  }),
  "P1Y2M3DT4H5M6.007S",
);

assertEqual(
  serializeDuration({
    days: 3,
  }),
  "P3D",
);

assertEqual(
  serializeDuration({
    hours: 5,
  }),
  "PT5H",
);

assertEqual(
  serializeDuration({
    seconds: 23,
  }),
  "PT23S",
);

assertEqual(
  serializeDuration({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  }),
  "P0D",
);

assertEqual(serializeDuration({}), "P0D");

/**
 * @param {string} s
 * @returns {Duration | null}
 */
function parseDuration(s) {
  const regex =
    /^P(?:(-?[0-9]+)Y)?(?:(-?[0-9]+)M)?(?:(-?[0-9]+)D)?(?:T(?:(-?[0-9]+)H)?(?:(-?[0-9]+)M)?(?:(-?[0-9.]+)S)?)?$/;

  /** @type {(string | undefined)[] | null} */
  const groups = regex.exec(s);
  if (groups === null) {
    return null;
  }

  const [_, rawYears, rawMonths, rawDays, rawHours, rawMinutes, rawSeconds] =
    groups;

  const years = parseInt(rawYears ?? "0");
  const months = parseInt(rawMonths ?? "0");
  const days = parseInt(rawDays ?? "0");
  const hours = parseInt(rawHours ?? "0");
  const minutes = parseInt(rawMinutes ?? "0");
  const floatSeconds = rawSeconds === undefined ? 0 : parseFloat(rawSeconds);
  if (isNaN(floatSeconds)) {
    return null;
  }
  const secondsAndMs = Math.round(floatSeconds * 1000);
  const milliseconds = secondsAndMs % 1000;
  const seconds = (secondsAndMs - milliseconds) / 1000;

  const duration = {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    milliseconds,
  };
  return Object.fromEntries(Object.entries(duration).filter((e) => e[1] !== 0));
}

assertJSONEqual(parseDuration("T0S"), null);
assertJSONEqual(parseDuration("PT0S"), {});
assertJSONEqual(parseDuration("PT0.1248S"), { milliseconds: 125 });
assertJSONEqual(parseDuration("P1Y2M3DT4H5M6.007S"), {
  years: 1,
  months: 2,
  days: 3,
  hours: 4,
  minutes: 5,
  seconds: 6,
  milliseconds: 7,
});
assertJSONEqual(parseDuration("P-1Y-2M-3DT-4H-5M-6.007S"), {
  years: -1,
  months: -2,
  days: -3,
  hours: -4,
  minutes: -5,
  seconds: -6,
  milliseconds: -7,
});
assertJSONEqual(parseDuration("P2M"), { months: 2 });

/**
 * @param {ImmutableDate} startDate
 * @param {Duration} duration
 * @returns {ImmutableDate}
 */
function datePlusDuration(startDate, duration) {
  const date = new Date(startDate.valueOf());
  date.setFullYear(date.getFullYear() + (duration.years ?? 0));
  date.setMonth(date.getMonth() + (duration.months ?? 0));
  date.setDate(date.getDate() + (duration.days ?? 0));
  const deltaHours = duration.hours ?? 0;
  const deltaMinutes = 60 * deltaHours + (duration.minutes ?? 0);
  const deltaSeconds = 60 * deltaMinutes + (duration.seconds ?? 0);
  const deltaMs = 1000 * deltaSeconds + (duration.milliseconds ?? 0);
  return new Date(date.valueOf() + deltaMs);
}

assertDatesEqual(
  datePlusDuration(new Date("1970-01-01T00:00:00.000"), {
    years: 1,
    months: 2,
    days: 3,
    hours: 4,
    minutes: 5,
    seconds: 6,
    milliseconds: 7,
  }),
  new Date("1971-03-04T04:05:06.007"),
);

/**
 * @param {Duration} duration
 * @returns {boolean}
 */
function durationIsZero(duration) {
  return datePlusDuration(new Date(0), duration).valueOf() === 0;
}

assert(durationIsZero({ years: 0, months: -0, days: undefined }));

/**
 * @param {Duration} duration
 * @returns {Duration}
 */
function negateDuration(duration) {
  return {
    years: -(duration.years ?? 0),
    months: -(duration.months ?? 0),
    days: -(duration.days ?? 0),
    hours: -(duration.hours ?? 0),
    minutes: -(duration.minutes ?? 0),
    seconds: -(duration.seconds ?? 0),
    milliseconds: -(duration.milliseconds ?? 0),
  };
}

/**
 * @param {ImmutableDate} targetDate
 * @param {ImmutableDate} baseDate
 * @param {Duration} period
 * @returns {ImmutableDate}
 */
function floorDate(targetDate, baseDate, period) {
  if (durationIsZero(period)) {
    return targetDate;
  }
  let date = baseDate;
  while (date.valueOf() < targetDate.valueOf()) {
    date = datePlusDuration(date, period);
  }
  while (date.valueOf() > targetDate.valueOf()) {
    date = datePlusDuration(date, negateDuration(period));
  }
  return date;
}

assertDatesEqual(
  floorDate(new Date("2021-12-25T00:00"), new Date("2000-01-01T00:00"), {
    months: 1,
  }),
  new Date("2021-12-01T00:00"),
);

assertDatesEqual(
  floorDate(new Date("2021-12-25T00:00"), new Date("2024-01-01T00:00"), {
    months: 1,
  }),
  new Date("2021-12-01T00:00"),
);

assertDatesEqual(
  floorDate(new Date("2021-12-01T00:00"), new Date("2021-12-01T00:00"), {
    months: 1,
  }),
  new Date("2021-12-01T00:00"),
);

assertDatesEqual(
  floorDate(new Date("2021-12-25T00:00"), new Date("2024-01-01T00:00"), {}),
  new Date("2021-12-25T00:00"),
);

/** @typedef {{ type: "once" }} OnceRepeat */
/** @typedef {{ type: "manual" }} ManualRepeat */
/** @typedef {{ type: "delay", delay: Duration }} DelayRepeat */
/** @typedef {{ type: "schedule", base: ImmutableDate, period: Duration, offsets: Duration[] }} ScheduleRepeat */
/** @typedef {OnceRepeat | ManualRepeat | DelayRepeat | ScheduleRepeat} Repeat */

/**
 * @param {Repeat} repeat
 * @returns {string}
 */
function serializeRepeat(repeat) {
  switch (repeat.type) {
    case "once":
    case "manual":
      return repeat.type;
    case "delay":
      return `${repeat.type} ${serializeDuration(repeat.delay)}`;
    case "schedule":
      return `${repeat.type} ${serializeDate(repeat.base)} ${serializeDuration(repeat.period)} ${repeat.offsets.map((o) => serializeDuration(o)).join(" ")}`;
  }
}

assertEqual(serializeRepeat({ type: "once" }), "once");
assertEqual(serializeRepeat({ type: "manual" }), "manual");
assertEqual(
  serializeRepeat({ type: "delay", delay: { days: 7 } }),
  "delay P7D",
);
assertEqual(
  serializeRepeat({
    type: "schedule",
    base: new Date("2021-01-01"),
    period: { months: 1 },
    offsets: [{}],
  }),
  `schedule ${serializeDate(new Date("2021-01-01"))} P1M P0D`,
);

/**
 * @param {string} s
 * @returns {Repeat | null}
 */
function parseRepeat(s) {
  if (s === "once") {
    return { type: "once" };
  }
  if (s === "manual") {
    return { type: "manual" };
  }
  const split = s.split(" ");
  if (split.length === 0) {
    return null;
  }
  if (split[0] === "delay" && split.length === 2) {
    const delay = parseDuration(split[1]);
    if (delay === null) {
      return null;
    }
    return { type: "delay", delay };
  }
  if (split[0] === "schedule" && split.length >= 4) {
    const base = parseDate(split[1]);
    const period = parseDuration(split[2]);
    if (base === null || period === null) {
      return null;
    }
    const offsets = [];
    for (const rawOffset of split.slice(3)) {
      const offset = parseDuration(rawOffset);
      if (offset === null) {
        return null;
      }
      offsets.push(offset);
    }
    return { type: "schedule", base, period, offsets };
  }
  return null;
}

assertJSONEqual(parseRepeat("once"), { type: "once" });
assertJSONEqual(parseRepeat("manual"), { type: "manual" });
assertJSONEqual(parseRepeat("delay P7D"), {
  type: "delay",
  delay: { days: 7 },
});
assertJSONEqual(parseRepeat("schedule 2021-01-01 P1M P0D"), {
  type: "schedule",
  base: new Date("2021-01-01"),
  period: { months: 1 },
  offsets: [{}],
});

/**
 * @param {Repeat} repeat
 * @param {ImmutableDate} from
 * @param {boolean} forward
 * @returns {ImmutableDate | null}
 */
function repeatSeek(repeat, from, forward) {
  switch (repeat.type) {
    case "once":
    case "manual":
      return null;
    case "delay":
      return datePlusDuration(
        from,
        forward ? repeat.delay : negateDuration(repeat.delay),
      );
    case "schedule": {
      const floor = floorDate(from, repeat.base, repeat.period);
      const bases = [
        datePlusDuration(floor, negateDuration(repeat.period)),
        floor,
        datePlusDuration(floor, repeat.period),
      ];
      const dates = [];
      for (const base of bases) {
        for (const offset of repeat.offsets) {
          dates.push(datePlusDuration(base, offset));
        }
      }
      let closest = null;
      let sign = forward ? 1 : -1;
      for (const date of dates) {
        if (
          sign * from.valueOf() < sign * date.valueOf() &&
          (closest === null || sign * date.valueOf() < sign * closest.valueOf())
        ) {
          closest = date;
        }
      }
      return closest;
    }
    default:
      assertExhaustive(repeat);
  }
}

assertJSONEqual(
  repeatSeek({ type: "once" }, new Date("2021-12-25T12:20:00"), true),
  null,
);
assertJSONEqual(
  repeatSeek({ type: "manual" }, new Date("2021-12-25T12:20:00"), true),
  null,
);
assertDatesEqual(
  assertNonNull(
    repeatSeek(
      { type: "delay", delay: { days: 3 } },
      new Date("2021-12-25T12:20:00"),
      true,
    ),
  ),
  new Date("2021-12-28T12:20:00"),
);
assertDatesEqual(
  assertNonNull(
    repeatSeek(
      { type: "delay", delay: { days: 3 } },
      new Date("2021-12-25T12:20:00"),
      false,
    ),
  ),
  new Date("2021-12-22T12:20:00"),
);
assertDatesEqual(
  assertNonNull(
    repeatSeek(
      {
        type: "schedule",
        base: new Date("2023-01-01"),
        period: { days: 7 },
        offsets: [{}, { days: 6 }],
      },
      new Date("2023-01-01"),
      true,
    ),
  ),
  new Date("2023-01-07"),
);
assertDatesEqual(
  assertNonNull(
    repeatSeek(
      {
        type: "schedule",
        base: new Date("2023-01-01"),
        period: { days: 7 },
        offsets: [{}, { days: 6 }],
      },
      new Date("2023-01-01"),
      false,
    ),
  ),
  new Date("2022-12-31"),
);
assertDatesEqual(
  assertNonNull(
    repeatSeek(
      {
        type: "schedule",
        base: new Date("2023-01-01"),
        period: { days: 7 },
        offsets: [{}, { days: 6 }],
      },
      new Date("2023-01-18"),
      true,
    ),
  ),
  new Date("2023-01-21"),
);
assertDatesEqual(
  assertNonNull(
    repeatSeek(
      {
        type: "schedule",
        base: new Date("2023-01-01"),
        period: { days: 7 },
        offsets: [{}, { days: 6 }],
      },
      new Date("2023-01-18"),
      false,
    ),
  ),
  new Date("2023-01-15"),
);

/**
 * @param {Repeat} repeat
 * @param {ImmutableDate | null} near
 * @returns {Repeat}
 */
function repeatRebase(repeat, near) {
  if (near === null) {
    return repeat;
  }

  switch (repeat.type) {
    case "once":
    case "manual":
    case "delay":
      return repeat;
  }

  return {
    ...repeat,
    base: floorDate(near, repeat.base, repeat.period),
  };
}

assertJSONEqual(
  repeatRebase({ type: "once" }, new Date("2021-12-25T12:20:00")),
  { type: "once" },
);
assertJSONEqual(
  repeatRebase({ type: "manual" }, new Date("2021-12-25T12:20:00")),
  { type: "manual" },
);
assertJSONEqual(
  repeatRebase(
    { type: "delay", delay: { days: 7 } },
    new Date("2021-12-25T12:20:00"),
  ),
  { type: "delay", delay: { days: 7 } },
);
assertJSONEqual(
  repeatRebase(
    {
      type: "schedule",
      base: new Date("2021-11-11T00:00:00"),
      period: { days: 1 },
      offsets: [{}],
    },
    new Date("2021-12-25T12:20:00"),
  ),
  {
    type: "schedule",
    base: new Date("2021-12-25T00:00:00"),
    period: { days: 1 },
    offsets: [{}],
  },
);

/** @typedef {{ name: string, scheduledDate: ImmutableDate | null, repeat: Repeat }} BaseTask */
/** @typedef {BaseTask & { state: "pending", startEpochMs: null, endEpochMs: null }} PendingTask */
/** @typedef {BaseTask & { state: "started", startEpochMs: number, endEpochMs: null }} StartedTask */
/** @typedef {BaseTask & { state: "completed", startEpochMs: number, endEpochMs: number }} CompletedTask */
/** @typedef {PendingTask | StartedTask | CompletedTask} Task */

/** @typedef {{ type: "delete" }} DeleteAction */
/** @typedef {{ type: "start" }} StartAction */
/** @typedef {{ type: "cancel" }} CancelAction */
/** @typedef {{ type: "complete" }} CompleteAction */
/** @typedef {{ type: "seekBack" }} SeekBackAction */
/** @typedef {{ type: "seekForward" }} SeekForwardAction */
/** @typedef {DeleteAction | StartAction | CancelAction | CompleteAction | SeekBackAction | SeekForwardAction} Action */

/** @typedef {{ type: "create", task: Task }} TaskCreateEvent */
/** @typedef {{ type: "delete" }} TaskDeleteEvent */
/** @typedef {{ type: "update", task: Task }} TaskUpdateEvent */
/** @typedef {TaskCreateEvent | TaskDeleteEvent | TaskUpdateEvent} TaskEvent */

/**
 * @param {Action} action
 * @param {Task} task
 * @param {ImmutableDate} now
 * @returns {TaskEvent[]}
 */
function applyAction(action, task, now) {
  switch (action.type) {
    case "delete":
      return [{ type: "delete" }];
    case "start":
      return [
        {
          type: "update",
          task: {
            ...task,
            state: "started",
            startEpochMs: now.valueOf(),
            endEpochMs: null,
          },
        },
      ];
    case "cancel":
      return [
        {
          type: "update",
          task: {
            ...task,
            state: "pending",
            startEpochMs: null,
            endEpochMs: null,
          },
        },
      ];
    case "complete": {
      /** @type {TaskEvent[]} */
      const events = [
        {
          type: "update",
          task: {
            ...task,
            repeat: { type: "once" },
            state: "completed",
            startEpochMs: task.startEpochMs ?? now.valueOf(),
            endEpochMs: now.valueOf(),
          },
        },
      ];

      if (task.repeat.type !== "once") {
        const repeat = repeatRebase(task.repeat, now);
        const scheduledDate = repeatSeek(repeat, now, true);
        events.push({
          type: "create",
          task: {
            ...task,
            scheduledDate,
            repeat,
            state: "pending",
            startEpochMs: null,
            endEpochMs: null,
          },
        });
      }

      return events;
    }
    case "seekBack":
    case "seekForward": {
      const forward = action.type === "seekForward";
      const repeat = repeatRebase(task.repeat, task.scheduledDate);
      const scheduledDate =
        task.scheduledDate === null
          ? null
          : (repeatSeek(repeat, task.scheduledDate, forward) ??
            task.scheduledDate);
      return [{ type: "update", task: { ...task, scheduledDate, repeat } }];
    }
  }
}

assertJSONEqual(
  applyAction(
    { type: "delete" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "once" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [{ type: "delete" }],
);
assertJSONEqual(
  applyAction(
    { type: "start" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "once" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      type: "update",
      task: {
        name: "foo",
        scheduledDate: null,
        repeat: { type: "once" },
        state: "started",
        startEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
        endEpochMs: null,
      },
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "cancel" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "once" },
      state: "started",
      startEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      type: "update",
      task: {
        name: "foo",
        scheduledDate: null,
        repeat: { type: "once" },
        state: "pending",
        startEpochMs: null,
        endEpochMs: null,
      },
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "complete" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "once" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      type: "update",
      task: {
        name: "foo",
        scheduledDate: null,
        repeat: { type: "once" },
        state: "completed",
        startEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
        endEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
      },
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "complete" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "once" },
      state: "started",
      startEpochMs: new Date("2021-01-01T00:00:00").valueOf(),
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      type: "update",
      task: {
        name: "foo",
        scheduledDate: null,
        repeat: { type: "once" },
        state: "completed",
        startEpochMs: new Date("2021-01-01T00:00:00").valueOf(),
        endEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
      },
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "complete" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "manual" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      type: "update",
      task: {
        name: "foo",
        scheduledDate: null,
        repeat: { type: "once" },
        state: "completed",
        startEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
        endEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
      },
    },
    {
      type: "create",
      task: {
        name: "foo",
        scheduledDate: null,
        repeat: { type: "manual" },
        state: "pending",
        startEpochMs: null,
        endEpochMs: null,
      },
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "complete" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: {
        type: "schedule",
        base: new Date("2021-12-01T00:00:00"),
        period: { days: 1 },
        offsets: [{}],
      },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      type: "update",
      task: {
        name: "foo",
        scheduledDate: null,
        repeat: { type: "once" },
        state: "completed",
        startEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
        endEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
      },
    },
    {
      type: "create",
      task: {
        name: "foo",
        scheduledDate: new Date("2021-12-26T00:00:00"),
        repeat: {
          type: "schedule",
          base: new Date("2021-12-25T00:00:00"),
          period: { days: 1 },
          offsets: [{}],
        },
        state: "pending",
        startEpochMs: null,
        endEpochMs: null,
      },
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "seekBack" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "delay", delay: { days: 1 } },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      type: "update",
      task: {
        name: "foo",
        scheduledDate: null,
        repeat: { type: "delay", delay: { days: 1 } },
        state: "pending",
        startEpochMs: null,
        endEpochMs: null,
      },
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "seekBack" },
    {
      name: "foo",
      scheduledDate: new Date("2021-12-15T00:00:00"),
      repeat: { type: "manual" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      type: "update",
      task: {
        name: "foo",
        scheduledDate: new Date("2021-12-15T00:00:00"),
        repeat: { type: "manual" },
        state: "pending",
        startEpochMs: null,
        endEpochMs: null,
      },
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "seekBack" },
    {
      name: "foo",
      scheduledDate: new Date("2021-12-15T00:00:00"),
      repeat: { type: "delay", delay: { days: 1 } },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      type: "update",
      task: {
        name: "foo",
        scheduledDate: new Date("2021-12-14T00:00:00"),
        repeat: { type: "delay", delay: { days: 1 } },
        state: "pending",
        startEpochMs: null,
        endEpochMs: null,
      },
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "seekForward" },
    {
      name: "foo",
      scheduledDate: new Date("2021-12-15T00:00:00"),
      repeat: {
        type: "schedule",
        base: new Date("2021-11-01T00:00:00"),
        period: { months: 1 },
        offsets: [{ days: 10 }],
      },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      type: "update",
      task: {
        name: "foo",
        scheduledDate: new Date("2022-01-11T00:00:00"),
        repeat: {
          type: "schedule",
          base: new Date("2021-12-01T00:00:00"),
          period: { months: 1 },
          offsets: [{ days: 10 }],
        },
        state: "pending",
        startEpochMs: null,
        endEpochMs: null,
      },
    },
  ],
);

/**
 * @template T
 */
class Component {
  static idCounter = 0;

  /**
   * @returns {string}
   */
  static nextId() {
    return String(Component.idCounter++);
  }

  /** @type {string} */
  id;

  /** @type {T} */
  state;

  /** @type {HTMLElement[]} */
  rootElements;

  /**
   * @param {T} state
   */
  constructor(state) {
    this.id = Component.nextId();
    this.state = state;
    this.rootElements = [];
  }

  /**
   * @template {HTMLElement} T
   * @param {T} element
   */
  addRootElement(element) {
    this.rootElements.push(element);
    return element;
  }

  /**
   * @param {HTMLElement} parent
   * @returns {this}
   */
  appendTo(parent) {
    return this.moveBefore(parent, null);
  }

  /**
   * @param {HTMLElement} parent
   * @param {Node | null} reference
   * @returns {this}
   */
  moveBefore(parent, reference) {
    for (const element of this.rootElements) {
      parent.insertBefore(element, reference);
    }
    return this;
  }
}

/** @typedef {Component<any> & { getIdForLabel(): string }} LabelableComponent */

/**
 * @template {LabelableComponent} T
 * @typedef {{ labelText: string, child: T }} LabeledComponentState
 */

/**
 * @template {LabelableComponent} T
 * @extends {Component<LabeledComponentState<T>>}
 */
class LabeledComponent extends Component {
  /**
   * @param {LabeledComponentState<T>} state
   */
  constructor(state) {
    super(state);
    this.child = state.child;

    const label = this.addRootElement(document.createElement("label"));
    label.htmlFor = this.child.getIdForLabel();
    label.innerText = state.labelText;

    this.rootElements.push(...this.child.rootElements);
  }
}

/**
 * @extends {Component<undefined>}
 * @implements {LabelableComponent}
 */
class DateInputComponent extends Component {
  constructor() {
    super(undefined);

    this.input = this.addRootElement(document.createElement("input"));
    this.input.id = this.id;
    this.input.type = "date";
  }

  getIdForLabel() {
    return this.input.id;
  }
}

/**
 * @extends {Component<undefined>}
 * @implements {LabelableComponent}
 */
class TextInputComponent extends Component {
  constructor() {
    super(undefined);

    this.input = this.addRootElement(document.createElement("input"));
    this.input.id = this.id;
    this.input.type = "text";
  }

  getIdForLabel() {
    return this.input.id;
  }
}

/**
 * @param {string} text
 * @param {() => void} [onClick]
 * @returns {HTMLButtonElement}
 */
function makeButton(text, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.innerText = text;
  if (onClick !== undefined) {
    button.addEventListener("click", onClick);
  }
  return button;
}

/**
 * @returns {HTMLDivElement}
 * @param {string[]} classes
 */
function makeDiv(...classes) {
  const div = document.createElement("div");
  div.classList.add(...classes);
  return div;
}

/** @typedef {{ task: Task, editor: { task: Task, error: string | null } | null, callback: (event: TaskEvent) => void }} TaskViewState */
/** @extends {Component<TaskViewState>} */
class TaskView extends Component {
  /**
   * @param {TaskViewState} state
   */
  constructor(state) {
    super(state);

    this.date = this.addRootElement(makeDiv("task-date"));
    this.name = this.addRootElement(makeDiv("task-name"));
    this.controls = this.addRootElement(makeDiv("task-controls"));

    this.completeButton = this.controls.appendChild(
      makeButton("✅", () => {
        this.onComplete();
      }),
    );

    this.editButton = this.controls.appendChild(
      makeButton("✏️", () => {
        this.onEdit();
      }),
    );

    this.editor = this.addRootElement(makeDiv("task-editor"));

    this.labelInputGrid = this.editor.appendChild(
      makeDiv("task-editor-label-input-grid"),
    );

    this.labeledNameInput = new LabeledComponent({
      labelText: "Name",
      child: new TextInputComponent(),
    }).appendTo(this.labelInputGrid);
    this.nameInput = this.labeledNameInput.child.input;

    this.labeledScheduledDateInput = new LabeledComponent({
      labelText: "Date",
      child: new DateInputComponent(),
    }).appendTo(this.labelInputGrid);
    this.scheduledDateInput = this.labeledScheduledDateInput.child.input;

    this.labeledRepeatInput = new LabeledComponent({
      labelText: "Repeat",
      child: new TextInputComponent(),
    }).appendTo(this.labelInputGrid);
    this.repeatInput = this.labeledRepeatInput.child.input;

    this.editorBottomButtons = this.editor.appendChild(
      makeDiv("task-editor-buttons"),
    );

    this.editorError = this.editor.appendChild(makeDiv("task-editor-error"));

    this.saveButton = this.editorBottomButtons.appendChild(
      makeButton("💾", () => {
        this.onSave();
      }),
    );

    this.editorCancelButton = this.editorBottomButtons.appendChild(
      makeButton("❌️", () => {
        this.onEditorCancel();
      }),
    );

    this.deleteButton = this.editorBottomButtons.appendChild(
      makeButton("🗑️", () => {
        this.onDelete();
      }),
    );

    this.render(true);
  }

  /**
   * @param {boolean} updateEditorInputs
   */
  render(updateEditorInputs) {
    const editing = this.state.editor !== null;
    this.name.hidden = editing;
    this.date.hidden = editing;
    this.controls.hidden = editing;
    this.editor.hidden = !editing;

    this.name.innerText = this.state.task.name;
    this.date.innerText =
      this.state.task.scheduledDate
        ?.toISOString()
        .substring(0, "YYYY-MM-DD".length) ?? "no date";

    if (updateEditorInputs) {
      const editorTask = this.state.editor?.task ?? this.state.task;
      this.nameInput.value = editorTask.name;
      this.scheduledDateInput.value =
        editorTask.scheduledDate
          ?.toISOString()
          .substring(0, "YYYY-MM-DD".length) ?? "";
      this.repeatInput.value = serializeRepeat(editorTask.repeat);
    }

    this.editorError.hidden = this.state.editor?.error === null;
    this.editorError.innerText = this.state.editor?.error ?? "";
  }

  /**
   * @returns {Result<Task, string>}
   */
  getTaskFromEditor() {
    const name = this.nameInput.value;
    if (name === "") {
      return err("Name is required");
    }

    const rawScheduledDate = this.scheduledDateInput.value;
    const scheduledDate =
      rawScheduledDate === "" ? null : new Date(rawScheduledDate);

    const repeat = parseRepeat(this.repeatInput.value);
    if (repeat === null) {
      return err("Invalid repeat");
    }

    return ok({ ...this.state.task, name, scheduledDate, repeat });
  }

  /**
   * @param {TaskEvent[]} events
   */
  processEvents(events) {
    for (const event of events) {
      if (event.type === "update") {
        this.state.task = event.task;
        this.render(true);
      }
      this.state.callback(event);
    }
  }

  submitEditor() {
    if (this.state.editor === null) {
      return;
    }
    const result = this.getTaskFromEditor();
    if (result.ok) {
      this.state = {
        ...this.state,
        editor: { task: result.value, error: null },
      };
    } else {
      this.state = {
        ...this.state,
        editor: { ...this.state.editor, error: result.error },
      };
    }
  }

  onComplete() {
    this.processEvents(
      applyAction({ type: "complete" }, this.state.task, new Date()),
    );
  }

  onEdit() {
    this.state = {
      ...this.state,
      editor: { task: { ...this.state.task }, error: null },
    };
    this.render(true);
  }

  onSave() {
    this.submitEditor();
    if (this.state.editor?.error === null) {
      const task = this.state.editor.task;
      this.state = {
        ...this.state,
        editor: null,
      };
      this.processEvents([{ type: "update", task }]);
    } else {
      this.render(false);
    }
  }

  onEditorCancel() {
    this.state = { ...this.state, editor: null };
    this.render(true);
  }

  onDelete() {
    if (confirm("Delete this event?")) {
      this.processEvents([{ type: "delete" }]);
    }
  }
}

function browserMain() {
  const tasks = document.body.appendChild(makeDiv("tasks"));
  new TaskView({
    task: {
      name: "foo",
      scheduledDate: new Date("2024-09-03"),
      repeat: { type: "once" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    editor: null,
    callback: console.log,
  }).appendTo(tasks);
}

if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", browserMain);
  } else {
    browserMain();
  }
}
