import fs from 'fs';
import csv from 'csv-parser';
import { Contact } from '../types';

export const parseCSV = (filePath: string): Promise<Contact[]> => {
  return new Promise((resolve, reject) => {
    const contacts: Contact[] = [];
    fs.createReadStream(filePath)
      .pipe(csv(['number', 'name']))
      .on('data', (data) => {
        if (data.number && data.name) {
          contacts.push({
            number: data.number.trim().replace(/\D/g, ''),
            name: data.name.trim(),
            status: 'pending',
          });
        }
      })
      .on('end', () => {
        resolve(contacts);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};
