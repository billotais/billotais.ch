export const initials = (name: string) =>
  name
    .split(/[\s-]/)
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** YYYY-MM-DD -> DD/MM/YYYY (anything else is returned as is) */
export function formatDate(d: string) {
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : d;
}
