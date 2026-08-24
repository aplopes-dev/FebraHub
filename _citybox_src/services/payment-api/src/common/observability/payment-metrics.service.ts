import { Injectable } from '@nestjs/common';

export type MetricLabels = Record<string, string | undefined>;

@Injectable()
export class PaymentMetricsService {
  private readonly startedAt = new Date().toISOString();
  private readonly counters = new Map<string, number>();

  increment(name: string, labels: MetricLabels = {}, amount = 1): void {
    const key = this.counterKey(name, labels);
    this.counters.set(key, (this.counters.get(key) ?? 0) + amount);
  }

  snapshot(): Record<string, number | string> {
    const totals: Record<string, number | string> = {
      _startedAt: this.startedAt,
      _note: 'in-process counters, reset on restart',
      charges_created_total: 0,
      payments_received_total: 0,
      payments_failed_total: 0,
      refunds_total: 0,
      provider_errors_total: 0,
      webhook_failures_total: 0,
      reconciliation_divergences_total: 0,
    };

    for (const [key, value] of this.counters.entries()) {
      const metricName = key.split('|')[0] ?? key;
      if (metricName.startsWith('_')) continue;
      if (metricName in totals && typeof totals[metricName] === 'number') {
        totals[metricName] = totals[metricName] + value;
      } else if (!(metricName in totals)) {
        totals[metricName] = value;
      }
    }

    return totals;
  }

  snapshotDetailed(): Array<{ name: string; labels: MetricLabels; value: number }> {
    return [...this.counters.entries()].map(([key, value]) => {
      const [name, labelPart] = key.split('|');
      const labels: MetricLabels = {};
      if (labelPart) {
        for (const segment of labelPart.split(',')) {
          const [labelKey, labelValue] = segment.split('=');
          if (labelKey && labelValue) labels[labelKey] = labelValue;
        }
      }
      return { name: name ?? key, labels, value };
    });
  }

  private counterKey(name: string, labels: MetricLabels): string {
    const normalized = Object.entries(labels)
      .filter(([, value]) => value !== undefined && value !== '')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    return normalized ? `${name}|${normalized}` : name;
  }
}
