type Cell = string | number | null;

function cell(value: Cell): string {
  let s = value === null ? "" : String(value);
  // A leading = + - @ would run as a formula when opened in Excel. Neutralise it.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Cell[][]): string {
  return rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
