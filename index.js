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
 * @param {unknown} a
 * @param {unknown} b
 */
function assertJSONEqual(a, b) {
  let strA = JSON.stringify(a);
  let strB = JSON.stringify(b);
  if (strA !== strB) {
    throw new Error(`Assertion failed: ${strA} !== ${strB}`);
  }
}

/** @typedef {{ [K in keyof Date as Exclude<K, `set${string}`>]: Date[K] }} ImmutableDate */

/**
 * @param {ImmutableDate} date
 * @returns {string}
 */
function serializeDate(date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.valueOf() - tzOffsetMs).toISOString().slice(0, -1);
}

/**
 * @param {ImmutableDate} a
 * @param {ImmutableDate} b
 */
function assertDatesEqual(a, b) {
  if (a.valueOf() !== b.valueOf()) {
    throw new Error(`Assertion failed: ${String(a)} !== ${String(b)}`);
  }
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
    /^P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?(?:T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9.]+)S)?)?$/;

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
  const seconds = Math.floor(secondsAndMs / 1000);
  const milliseconds = secondsAndMs % 1000;

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

/** @typedef {{ repeat: "never" }} NeverRepeat */
/** @typedef {{ repeat: "manual" }} ManualRepeat */
/** @typedef {{ repeat: "delay", delay: Duration }} DelayRepeat */
/** @typedef {{ repeat: "schedule", base: ImmutableDate, period: Duration, offsets: Duration[] }} ScheduleRepeat */
/** @typedef {NeverRepeat | ManualRepeat | DelayRepeat | ScheduleRepeat} Repeat */

/**
 * @param {string} s
 * @returns {Repeat | null}
 */
function parseRepeat(s) {
  if (s === "never") {
    return { repeat: "never" };
  }
  if (s === "manual") {
    return { repeat: "manual" };
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
    return { repeat: "delay", delay };
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
    return { repeat: "schedule", base, period, offsets };
  }
  return null;
}

assertJSONEqual(parseRepeat("never"), { repeat: "never" });
assertJSONEqual(parseRepeat("manual"), { repeat: "manual" });
assertJSONEqual(parseRepeat("delay P7D"), {
  repeat: "delay",
  delay: { days: 7 },
});

/** @typedef {{ name: string, description: string, notes: string, scheduledDate: Date | null, pointsBase: number, pointsPerMinute: number, tags: string[] }} BaseTask */
/** @typedef {BaseTask & { startDate: null, durationMs: null }} PendingTask */
/** @typedef {BaseTask & { startDate: Date, durationMs: null }} StartedTask */
/** @typedef {BaseTask & { startDate: Date, durationMs: number }} CompletedTask */
