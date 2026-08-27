import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getCacheProfile } from "../lib/cacheProfiles";
import type { RemittancePayoutRecord } from "@/types/remittancePayout";

function getMockData(): RemittancePayoutRecord[] {
  return [
    {
      id: "rem-3001",
      date: "2026-08-19T11:05:47Z",
      transactionHash:
        "c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345ab",
      anchorName: "Cowrie Anchor Nigeria",
      anchorReference: "COW-NG-88213",
      senderName: "Fuhad Adesanya",
      recipientName: "Bola Adesanya",
      recipientAddress: "GDQP2PVAFZSSLZ2IKXQREGAQTTXMIMHJZV6GQQH5CS2VD4MT56GD7A5B",
      amountSent: 250,
      sentCurrency: "USD",
      amountReceived: 371875,
      receivedCurrency: "NGN",
      exchangeRate: "1 USD = 1487.50 NGN",
      fee: 2.5,
      feeCurrency: "USD",
      status: "completed",
    },
    {
      id: "rem-3002",
      date: "2026-07-30T20:11:53Z",
      transactionHash:
        "e5f6789012345678901234567890abcdef1234567890abcdef12345abc3d4",
      anchorName: "Kotani Pay Kenya",
      anchorReference: "KTN-KE-40217",
      senderName: "Fuhad Adesanya",
      recipientName: "Wanjiru Mwangi",
      recipientAddress: "GBSDFP4ZSSQLEGAQTT2PVAFZSSXHJZV6GQQH5CS2VD4MT56GD7A5B",
      amountSent: 100,
      sentCurrency: "EUR",
      amountReceived: 13284,
      receivedCurrency: "KES",
      exchangeRate: "1 EUR = 132.84 KES",
      fee: 1.1,
      feeCurrency: "EUR",
      status: "completed",
    },
    {
      id: "rem-3003",
      date: "2026-07-12T08:42:10Z",
      transactionHash:
        "b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345a",
      anchorName: "Yellow Card Ghana",
      anchorReference: "YC-GH-11940",
      senderName: "Fuhad Adesanya",
      recipientName: "Kwame Boateng",
      recipientAddress: "GBAA11223344556677889900AABBCCDDEEFFGGHHIIJJKKLLMMNNOOPP",
      amountSent: 75,
      sentCurrency: "USD",
      amountReceived: 1042.5,
      receivedCurrency: "GHS",
      exchangeRate: "1 USD = 13.90 GHS",
      fee: 0.9,
      feeCurrency: "USD",
      status: "failed",
    },
  ];
}

const QUERY_KEY = ["remittance-payouts"] as const;

export function useRemittancePayouts(): UseQueryResult<
  RemittancePayoutRecord[],
  Error
> {
  const profile = getCacheProfile("transactionHistory");

  return useQuery<RemittancePayoutRecord[], Error>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/remittance-payouts", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch remittance payouts: ${res.status}`);
      }

      return res.json();
    },
    placeholderData: (prev) => prev,
    staleTime: profile.staleTime,
    gcTime: profile.gcTime,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useRemittancePayoutsWithFallback(): {
  data: RemittancePayoutRecord[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
} {
  const query = useRemittancePayouts();

  if (query.data) {
    return {
      data: query.data,
      isLoading: false,
      isFetching: query.isFetching,
      error: query.error,
    };
  }

  return {
    data: getMockData(),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}
