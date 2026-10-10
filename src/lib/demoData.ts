import { buildDataset } from './csv';
import type { Dataset } from './types';

function makeRows(headers: string[], data: (string | number)[][]): Record<string, string>[] {
  return data.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = String(row[i] ?? '');
    });
    return obj;
  });
}

function seedRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ── Student Performance Dataset ──────────────────────────
function studentPerformance(): Dataset {
  const rand = seedRandom(42);
  const headers = ['Student ID', 'Study Hours', 'Attendance', 'Assignment Score', 'Exam Score', 'Sleep Hours', 'Extracurricular Hours'];
  const data: (string | number)[][] = [];
  for (let i = 1; i <= 80; i++) {
    const study = +(2 + rand() * 8).toFixed(1);
    const attendance = +(75 + rand() * 25).toFixed(0);
    const assignment = +Math.min(100, 45 + study * 5 + rand() * 10).toFixed(1);
    const sleep = +(4 + rand() * 6).toFixed(1);
    const extracurricular = +(rand() * 15).toFixed(1);
    // Scores are out of 100
    const exam = +Math.min(100, 15 + study * 4.5 + attendance * 0.15 + assignment * 0.12 + sleep + rand() * 6).toFixed(1);
    data.push([`S${String(i).padStart(3, '0')}`, study, attendance, assignment, exam, sleep, extracurricular]);
  }
  // Inject some missing values
  data[3][5] = '';
  data[10][2] = '';
  data[22][4] = '';
  return buildDataset('Student Performance', headers, makeRows(headers, data), true);
}

// ── Retail Sales Dataset ─────────────────────────────────
function retailSales(): Dataset {
  const rand = seedRandom(99);
  const headers = ['Date', 'Product', 'Category', 'Region', 'Units Sold', 'Revenue', 'Discount', 'Customer Rating'];
  const products = [
    ['Aurora Headphones', 'Electronics'],
    ['Nimbus Tablet', 'Electronics'],
    ['Verde Water Bottle', 'Lifestyle'],
    ['Pulse Fitness Band', 'Electronics'],
    ['Cresta Backpack', 'Lifestyle'],
    ['Lumen Desk Lamp', 'Home'],
    ['Terra Notebook', 'Lifestyle'],
    ['Echo Speaker', 'Electronics'],
  ];
  const regions = ['North', 'South', 'East', 'West'];
  const data: (string | number)[][] = [];
  const start = new Date('2024-01-01');
  for (let i = 0; i < 120; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + Math.floor(i / 1));
    const [product, category] = products[Math.floor(rand() * products.length)];
    const region = regions[Math.floor(rand() * regions.length)];
    const units = Math.floor(5 + rand() * 95);
    const price = 20 + rand() * 180;
    const discount = Math.floor(rand() * 25);
    const revenue = +(units * price * (1 - discount / 100)).toFixed(2);
    const rating = +(1 + rand() * 4).toFixed(1);
    data.push([
      date.toISOString().slice(0, 10),
      product,
      category,
      region,
      units,
      revenue,
      discount,
      rating,
    ]);
  }
  data[5][7] = '';
  data[12][5] = '';
  return buildDataset('Retail Sales', headers, makeRows(headers, data), true);
}

// ── Climate Trends Dataset ───────────────────────────────
function climateTrends(): Dataset {
  const rand = seedRandom(17);
  const headers = ['Date', 'City', 'Temperature (°F)', 'Rainfall (in)', 'Humidity (%)', 'Wind Speed (mph)'];
  const cities = ['Seattle', 'Phoenix', 'Chicago', 'Miami', 'Denver'];
  const data: (string | number)[][] = [];
  for (let c = 0; c < cities.length; c++) {
    for (let m = 0; m < 12; m++) {
      const date = new Date(2024, m, 15);
      const baseTemp = 10 + 15 * Math.sin(((m - 3) / 12) * 2 * Math.PI);
      const tempC = baseTemp + (c * 2 - 4) + rand() * 4 - 2;
      const temp = +(tempC * 9 / 5 + 32).toFixed(1);
      const rainfall = +((rand() * 80 + (m >= 5 && m <= 8 ? 20 : 0)) / 25.4).toFixed(2);
      const humidity = +(40 + rand() * 40).toFixed(0);
      const wind = +(5 + rand() * 25).toFixed(1);
      data.push([
        date.toISOString().slice(0, 10),
        cities[c],
        temp,
        rainfall,
        humidity,
        wind,
      ]);
    }
  }
  data[8][4] = '';
  data[25][3] = '';
  return buildDataset('Climate Trends', headers, makeRows(headers, data), true);
}

// ── City Transport Dataset ───────────────────────────────
function cityTransport(): Dataset {
  const rand = seedRandom(55);
  const headers = ['Date', 'Route', 'Passengers', 'Average Delay', 'Distance', 'Fuel Consumption'];
  const routes = ['Route A', 'Route B', 'Route C', 'Route D', 'Route E'];
  const data: (string | number)[][] = [];
  const start = new Date('2024-01-01');
  for (let i = 0; i < 150; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + Math.floor(i / 5));
    const route = routes[i % 5];
    const passengers = Math.floor(50 + rand() * 450);
    const delay = +(rand() * 25 - 2).toFixed(1);
    const distance = +(5 + rand() * 35).toFixed(1);
    const fuel = +(distance * (1.5 + rand() * 1.5)).toFixed(2);
    data.push([
      date.toISOString().slice(0, 10),
      route,
      passengers,
      delay,
      distance,
      fuel,
    ]);
  }
  data[3][2] = '';
  data[20][3] = '';
  data[40][5] = '';
  return buildDataset('City Transport', headers, makeRows(headers, data), true);
}

export function createDemoDatasets(): Dataset[] {
  return [studentPerformance(), retailSales(), climateTrends(), cityTransport()];
}

export const DEMO_DATASET_NAMES = ['Student Performance', 'Retail Sales', 'Climate Trends', 'City Transport'];
