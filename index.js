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
  s += String(seconds ?? 0);
  if (milliseconds) {
    let ms = String(milliseconds);
    while (ms.length < 3) {
      ms = "0" + ms;
    }
    s += `.${ms}`;
  }
  s += "S";
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
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  }),
  "PT0S",
);

assertEqual(serializeDuration({}), "PT0S");

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

  const duration = {};

  const [_, years, months, days, hours, minutes, rawSeconds] = groups;

  const floatSeconds = rawSeconds === undefined ? 0 : parseFloat(rawSeconds);
  if (isNaN(floatSeconds)) {
    return null;
  }
  const secondsAndMs = Math.round(floatSeconds * 1000);
  const milliseconds = secondsAndMs % 1000;
  const seconds = (secondsAndMs - milliseconds) / 1000;

  if (years) {
    duration.years = parseInt(years);
  }
  if (months) {
    duration.months = parseInt(months);
  }
  if (days) {
    duration.days = parseInt(days);
  }
  if (hours) {
    duration.hours = parseInt(hours);
  }
  if (minutes) {
    duration.minutes = parseInt(minutes);
  }
  if (seconds) {
    duration.seconds = seconds;
  }
  if (milliseconds) {
    duration.milliseconds = milliseconds;
  }
  return duration;
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

/** @typedef {{ type: "never" }} NeverRepeat */
/** @typedef {{ type: "manual" }} ManualRepeat */
/** @typedef {{ type: "delay", delay: Duration }} DelayRepeat */
/** @typedef {{ type: "schedule", base: ImmutableDate, period: Duration, offsets: Duration[] }} ScheduleRepeat */
/** @typedef {NeverRepeat | ManualRepeat | DelayRepeat | ScheduleRepeat} Repeat */

/**
 * @param {string} s
 * @returns {Repeat | null}
 */
function parseRepeat(s) {
  if (s === "never") {
    return { type: "never" };
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

assertJSONEqual(parseRepeat("never"), { type: "never" });
assertJSONEqual(parseRepeat("manual"), { type: "manual" });
assertJSONEqual(parseRepeat("delay P7D"), {
  type: "delay",
  delay: { days: 7 },
});

/**
 * @param {Repeat} repeat
 * @param {ImmutableDate} from
 * @param {boolean} forward
 * @returns {ImmutableDate | null}
 */
function repeatSeek(repeat, from, forward) {
  switch (repeat.type) {
    case "never":
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
  repeatSeek({ type: "never" }, new Date("2021-12-25T12:20:00"), true),
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
    case "never":
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
  repeatRebase({ type: "never" }, new Date("2021-12-25T12:20:00")),
  { type: "never" },
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

/**
 * @param {Action} action
 * @param {Task} task
 * @param {ImmutableDate} now
 * @returns {Task[]}
 */
function applyAction(action, task, now) {
  switch (action.type) {
    case "delete":
      return [];
    case "start":
      return [
        {
          ...task,
          state: "started",
          startEpochMs: now.valueOf(),
          endEpochMs: null,
        },
      ];
    case "cancel":
      return [
        {
          ...task,
          state: "pending",
          startEpochMs: null,
          endEpochMs: null,
        },
      ];
    case "complete": {
      /** @type {Task[]} */
      const tasks = [
        {
          ...task,
          repeat: { type: "never" },
          state: "completed",
          startEpochMs: task.startEpochMs ?? now.valueOf(),
          endEpochMs: now.valueOf(),
        },
      ];

      if (task.repeat.type !== "never") {
        const repeat = repeatRebase(task.repeat, now);
        const scheduledDate = repeatSeek(repeat, now, true);
        tasks.push({
          ...task,
          scheduledDate,
          repeat,
          state: "pending",
          startEpochMs: null,
          endEpochMs: null,
        });
      }

      return tasks;
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
      return [{ ...task, scheduledDate, repeat }];
    }
  }
}

assertJSONEqual(
  applyAction(
    { type: "delete" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "never" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [],
);
assertJSONEqual(
  applyAction(
    { type: "start" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "never" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "never" },
      state: "started",
      startEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
      endEpochMs: null,
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "cancel" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "never" },
      state: "started",
      startEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "never" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "complete" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "never" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "never" },
      state: "completed",
      startEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
      endEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
    },
  ],
);
assertJSONEqual(
  applyAction(
    { type: "complete" },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "never" },
      state: "started",
      startEpochMs: new Date("2021-01-01T00:00:00").valueOf(),
      endEpochMs: null,
    },
    new Date("2021-12-25T12:20:00"),
  ),
  [
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "never" },
      state: "completed",
      startEpochMs: new Date("2021-01-01T00:00:00").valueOf(),
      endEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
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
      name: "foo",
      scheduledDate: null,
      repeat: { type: "never" },
      state: "completed",
      startEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
      endEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
    },
    {
      name: "foo",
      scheduledDate: null,
      repeat: { type: "manual" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
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
      name: "foo",
      scheduledDate: null,
      repeat: { type: "never" },
      state: "completed",
      startEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
      endEpochMs: new Date("2021-12-25T12:20:00").valueOf(),
    },
    {
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
      name: "foo",
      scheduledDate: null,
      repeat: { type: "delay", delay: { days: 1 } },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
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
      name: "foo",
      scheduledDate: new Date("2021-12-15T00:00:00"),
      repeat: { type: "manual" },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
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
      name: "foo",
      scheduledDate: new Date("2021-12-14T00:00:00"),
      repeat: { type: "delay", delay: { days: 1 } },
      state: "pending",
      startEpochMs: null,
      endEpochMs: null,
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
  ],
);
