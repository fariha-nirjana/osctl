/**
 * api.js
 * Centralized API service for fetching OS data from Django backend.
 * Base URL points to Django dev server at port 8000.
 */
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

export const fetchCpu = () => API.get('/cpu/');
export const fetchMemory = () => API.get('/memory/');
export const fetchDisk = () => API.get('/disk/');
export const fetchNetwork = () => API.get('/network/');
export const fetchProcesses = () => API.get('/processes/');