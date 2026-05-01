function pad(num) {
  return `${num}`.padStart(2, '0');
}

function formatDateTime(dateValue) {
  if (!dateValue) {
    return '';
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function nowPlusDays(days) {
  const base = new Date();
  base.setDate(base.getDate() + days);
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())} ${pad(base.getHours())}:${pad(base.getMinutes())}`;
}

function buildDateRange() {
  const now = new Date();
  const years = [];
  const months = [];
  const days = [];
  const hours = [];
  const minutes = [];

  for (let i = 0; i < 3; i += 1) {
    years.push({ label: `${now.getFullYear() + i}年`, value: now.getFullYear() + i });
  }
  for (let i = 1; i <= 12; i += 1) {
    months.push({ label: `${i}月`, value: i });
  }
  for (let i = 1; i <= 31; i += 1) {
    days.push({ label: `${i}日`, value: i });
  }
  for (let i = 0; i < 24; i += 1) {
    hours.push({ label: `${pad(i)}时`, value: i });
  }
  for (let i = 0; i < 60; i += 15) {
    minutes.push({ label: `${pad(i)}分`, value: i });
  }

  return [years, months, days, hours, minutes];
}

function selectorToDateTime(range, selectorValue) {
  const year = range[0][selectorValue[0]].value;
  const month = range[1][selectorValue[1]].value;
  const day = range[2][selectorValue[2]].value;
  const hour = range[3][selectorValue[3]].value;
  const minute = range[4][selectorValue[4]].value;
  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}`;
}

function dateTimeToSelector(range, dateValue, fallback = [0, 0, 0, 0, 0]) {
  if (!dateValue) {
    return fallback;
  }

  const date = new Date(`${dateValue}`.replace(/-/g, '/'));
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  const indexes = [
    range[0].findIndex((item) => item.value === date.getFullYear()),
    range[1].findIndex((item) => item.value === date.getMonth() + 1),
    range[2].findIndex((item) => item.value === date.getDate()),
    range[3].findIndex((item) => item.value === date.getHours()),
    range[4].findIndex((item) => item.value === date.getMinutes()),
  ];

  if (indexes.some((index) => index < 0)) {
    return fallback;
  }

  return indexes;
}

function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

module.exports = {
  formatDateTime,
  nowPlusDays,
  buildDateRange,
  selectorToDateTime,
  dateTimeToSelector,
  toSafeNumber,
};
