import axios from 'axios';

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getCatalogs = async (type: string, params: any) => {
  const { data } = await api.get<PaginatedResult<any>>(`/catalogs/${type}`, { params });
  return data;
};

export const createCatalog = async (type: string, payload: any) => {
  const { data } = await api.post(`/catalogs/${type}`, payload);
  return data;
};

export const updateCatalog = async (type: string, id: string, payload: any) => {
  const { data } = await api.put(`/catalogs/${type}/${id}`, payload);
  return data;
};

export const deleteCatalog = async (type: string, id: string) => {
  const { data } = await api.delete(`/catalogs/${type}/${id}`);
  return data;
};
