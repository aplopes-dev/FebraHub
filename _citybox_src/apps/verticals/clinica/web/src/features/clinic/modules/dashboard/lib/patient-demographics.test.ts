import { describe, expect, it } from 'vitest';
import { MOCK_DASHBOARD_DEMOGRAPHIC_PATIENTS } from '../data/mock-dashboard-patient-demographics';
import {
  AGE_BUCKET_ORDER,
  aggregateGenderShares,
  buildAgePercentSeries,
  buildAgePercentSeriesSparse,
  calcAgeYears,
  filterPatientsByGender,
  mapGenderSharesWithColors,
  resolveAgeBucket,
  resolveAgePercentChartAxis,
} from './patient-demographics';

const TODAY = new Date(2026, 6, 20);

describe('patient-demographics', () => {
  it('calculates age and decade buckets', () => {
    expect(calcAgeYears('1995-03-12', TODAY)).toBe(31);
    expect(resolveAgeBucket(null, TODAY)).toBe('unknown');
    expect(resolveAgeBucket('1920-01-01', TODAY)).toBe('100+');
    expect(resolveAgeBucket('1995-03-12', TODAY)).toBe('30-39');
    expect(resolveAgeBucket('2018-01-01', TODAY)).toBe('0-9');
    expect(resolveAgeBucket('2010-01-01', TODAY)).toBe('10-19');
  });

  it('filters by gender', () => {
    const females = filterPatientsByGender(
      MOCK_DASHBOARD_DEMOGRAPHIC_PATIENTS,
      'female',
    );
    expect(females.every((p) => p.gender === 'female')).toBe(true);
  });

  it('builds full age series with 12 decade buckets', () => {
    const series = buildAgePercentSeries(
      MOCK_DASHBOARD_DEMOGRAPHIC_PATIENTS,
      'all',
      TODAY,
    );
    expect(series).toHaveLength(AGE_BUCKET_ORDER.length);
    expect(series[0]?.label).toBe('Idade não informado');
    expect(series[series.length - 1]?.label).toBe('100 anos ou mais');
    expect(series.map((p) => p.label)).toEqual([
      'Idade não informado',
      '0 a 9 anos',
      '10 a 19 anos',
      '20 a 29 anos',
      '30 a 39 anos',
      '40 a 49 anos',
      '50 a 59 anos',
      '60 a 69 anos',
      '70 a 79 anos',
      '80 a 89 anos',
      '90 a 99 anos',
      '100 anos ou mais',
    ]);
    const sparse = buildAgePercentSeriesSparse(
      MOCK_DASHBOARD_DEMOGRAPHIC_PATIENTS,
      'all',
      TODAY,
    );
    expect(sparse.every((p) => p.count > 0)).toBe(true);
    expect(sparse.length).toBeLessThan(series.length);
  });

  it('aggregates gender shares for pie', () => {
    const shares = aggregateGenderShares(MOCK_DASHBOARD_DEMOGRAPHIC_PATIENTS);
    const total = shares.reduce((sum, row) => sum + row.count, 0);
    expect(total).toBe(MOCK_DASHBOARD_DEMOGRAPHIC_PATIENTS.length);
    expect(shares.some((s) => s.gender === 'uninformed')).toBe(true);
  });

  it('maps API gender shares with FE colors', () => {
    const mapped = mapGenderSharesWithColors([
      { gender: 'female', label: 'Feminino', count: 2, percent: 40 },
      { gender: 'male', label: 'Masculino', count: 3, percent: 60 },
    ]);
    expect(mapped[0]?.color).toBeTruthy();
    expect(mapped[1]?.color).toBeTruthy();
    expect(mapped[0]?.gender).toBe('female');
  });

  it('scales age percent chart axis to the relevant max', () => {
    expect(resolveAgePercentChartAxis(0)).toEqual({
      max: 20,
      ticks: [0, 5, 10, 15, 20],
    });
    expect(resolveAgePercentChartAxis(15)).toEqual({
      max: 20,
      ticks: [0, 5, 10, 15, 20],
    });
    expect(resolveAgePercentChartAxis(20)).toEqual({
      max: 20,
      ticks: [0, 5, 10, 15, 20],
    });
    expect(resolveAgePercentChartAxis(21)).toEqual({
      max: 40,
      ticks: [0, 10, 20, 30, 40],
    });
    expect(resolveAgePercentChartAxis(75)).toEqual({
      max: 80,
      ticks: [0, 20, 40, 60, 80],
    });
    expect(resolveAgePercentChartAxis(95)).toEqual({
      max: 100,
      ticks: [0, 25, 50, 75, 100],
    });
  });
});
