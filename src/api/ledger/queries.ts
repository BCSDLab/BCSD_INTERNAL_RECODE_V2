import { queryOptions } from '@tanstack/react-query';
import { getLedgerEntries } from './api';
import { toLedgerEntry } from './mappers';

export const ledgerKeys = {
  all: () => ['ledger'] as const,
  entries: () => ['ledger', 'entries'] as const,
};

export const ledgerQueries = {
  entries: () =>
    queryOptions({
      queryKey: ledgerKeys.entries(),
      queryFn: async () => (await getLedgerEntries()).entries.map(toLedgerEntry),
    }),
};
