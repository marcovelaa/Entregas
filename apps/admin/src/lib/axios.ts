import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3001/api', // El backend de NestJS corre en 3001 por defecto
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
