import { RevenueDivision } from './types';

// ─── Revenue Divisions & Mandals (SSOT) ───────────────────────

export const revenueDivisions: Record<string, RevenueDivision> = {
  gurazala: {
    name: 'Gurazala Revenue Division',
    district: 'Palnadu District',
    mandals: ['Gurazala', 'Dachepalle', 'Durgi', 'Karempudi', 'Machavaram', 'Macherla', 'Piduguralla', 'Rentachintala', 'Veldurthi'],
  },
  narasaraopet: {
    name: 'Narasaraopet Revenue Division',
    district: 'Palnadu District',
    mandals: ['Narasaraopet', 'Bollapalle', 'Chilakaluripet', 'Edlapadu', 'Ipur', 'Nadendla', 'Nuzendla', 'Rompicherla', 'Savalyapuram', 'Vinukonda'],
  },
  sattenapalli: {
    name: 'Sattenapalli Revenue Division',
    district: 'Palnadu District',
    mandals: ['Sattenapalli', 'Amaravathi', 'Atchampet', 'Bellamkonda', 'Krosuru', 'Muppalla', 'Nekarikallu', 'Pedakurapadu', 'Rajupalem'],
  },
  guntur: {
    name: 'Guntur Revenue Division',
    district: 'Guntur District',
    mandals: ['Guntur East', 'Guntur West', 'Medikonduru', 'Pedakakani', 'Pedanandipadu', 'Phirangipuram', 'Prathipadu', 'Tadikonda', 'Thullur', 'Vatticherukuru'],
  },
  tenali: {
    name: 'Tenali Revenue Division',
    district: 'Guntur District',
    mandals: ['Tenali', 'Chebrolu', 'Duggirala', 'Kakumanu', 'Kollipara', 'Mangalagiri', 'Ponnur', 'Tadepalle'],
  },
};
