export interface BrandLogo {
  name: string;
  category: string;
  iconBg: string;
}

export interface MetricCard {
  label: string;
  value: string;
  subValue: string;
  metricType: "CTR" | "ROAS" | "CONV" | "REV";
  sparkData: number[];
  insights: string[];
}

export interface ContactMessage {
  name: string;
  email: string;
  brandName: string;
  campaignGoal: string;
  budgetOption: string;
  details: string;
  timestamp: string;
}
