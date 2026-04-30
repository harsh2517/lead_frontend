export interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  industry: string;
  phone: string;
  companyName: string;
  verifiedStatus: string;
  verifiedOn: string;
  campaignId: string;
  campaignOfInstantly: string;
  title: string;
  website: string;
  leadstatus: string;
  userId: number;
}

export interface User {
  id: number;
  email: string;
  accessToken: string;
  refreshToken: string;
  expires_in: string;
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  number: number;
  size: number;
  numberOfElements: number;
  empty: boolean;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string | null;
  timestamp: number;
}
