export class SummaryResponse {
    totalAmount: number;
    averageAmount: number;
    maxAmount: number;
    minAmount: number;
    monthlyExpenseCount: number;
    category: { category_id: number; category_name: string } | { messages: string };
}