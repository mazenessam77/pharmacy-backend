import api from '@/lib/api';

export const userService = {
  getProfile: () =>
    api.get('/users/profile'),

  updateProfile: (data: FormData | { name?: string; phone?: string; address?: string }) => {
    const isFormData = data instanceof FormData;
    return api.put('/users/profile', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },

  updateLocation: (lat: number, lng: number) =>
    api.put('/users/location', { lat, lng }),

  updateSearchRadius: (radius: number) =>
    api.put('/users/search-radius', { searchRadius: radius }),
};
