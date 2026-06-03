import { Contact } from '@/types';

export function parseCSVBuffer(buffer: ArrayBuffer): Contact[] {
  const text = new TextDecoder('utf-8').decode(buffer);
  return parseCSVText(text);
}

export function parseCSVText(text: string): Contact[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/"/g, ''));

  const nameIdx = headers.findIndex((h) => ['nome', 'name', 'contato'].includes(h));
  const phoneIdx = headers.findIndex((h) =>
    ['telefone', 'phone', 'numero', 'número', 'celular', 'whatsapp'].includes(h)
  );

  const contacts: Contact[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 2) continue;

    const name = nameIdx >= 0 ? cols[nameIdx] : cols[0];
    const number = phoneIdx >= 0 ? cols[phoneIdx] : cols[1];

    const cleanNumber = number.replace(/\D/g, '');
    if (cleanNumber.length < 10) continue;

    contacts.push({
      name: name || 'Contato',
      number: cleanNumber,
      status: 'pending',
    });
  }

  return contacts;
}
