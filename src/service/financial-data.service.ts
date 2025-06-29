import axios from "axios";
import { ENV } from "../constants/env.constants";

export const axiosClient = axios.create({
    baseURL: ENV.BASE_STOCK_API,
    headers: { "Content-Type": "application/json" },
    params: { apikey: ENV.STOCK_API_KEY },
});
export const fetchCompanyProfile = async (ticker: string) => {
    try {
        const response = await axiosClient.get(`/stable/profile?symbol=${ticker}`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching company profile:', error);
        throw new Error('Failed to fetch company profile');
    }
}
export const fetchCompanyIncomeStatement = async (ticker: string) => {
    try {
        const response = await axiosClient.get(`/stable/income-statement?symbol=${ticker}&limit=3`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching income statement:', error);
        throw new Error('Failed to fetch income statement');
    }
};

export const fetchCompanyBalanceSheetStatement = async (ticker: string) => {
    try {
        const response = await axiosClient.get(`/stable/balance-sheet-statement?symbol=${ticker}&limit=3`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching balance sheet:', error);
        throw new Error('Failed to fetch balance sheet');
    }
};

export const fetchCashFlowStatement = async (ticker: string) => {
    try {
        const response = await axiosClient.get(`/stable/cash-flow-statement?symbol=${ticker}&limit=3`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching cash flow statement:', error);
        throw new Error('Failed to fetch cash flow statement');
    }
};

export const fetchCompanyKeyMetrics = async (ticker: string) => {
    try {
        const response = await axiosClient.get(`/stable/key-metrics?symbol=${ticker}&limit=3`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching key metrics:', error);
        throw new Error('Failed to fetch key metrics');
    }
};


export const fetchAllFinancialData = async (ticker: string) => {
    const [companyProfile, incomeStatement, balanceSheet, cashFlow, keyMetrics] = await Promise.all([
        fetchCompanyProfile(ticker),
        fetchCompanyIncomeStatement(ticker),
        fetchCompanyBalanceSheetStatement(ticker),
        fetchCashFlowStatement(ticker),
        fetchCompanyKeyMetrics(ticker)
    ]);

    return [companyProfile, incomeStatement, balanceSheet, cashFlow, keyMetrics];
};