import { Pharmacy } from '../models/Pharmacy';

interface NearbyPharmacyResult {
  _id: any;
  userId: any;
  pharmacyName: string;
  location: any;
  workingHours: any;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isOpen: boolean;
  distance: number;
  distanceKm: number;
}

export const findPharmaciesByGovernorate = async (
  governorate: string
): Promise<NearbyPharmacyResult[]> => {
  const pharmacies = await Pharmacy.aggregate([
    {
      $match: {
        governorate,
        isOpen: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $addFields: {
        userBanned: { $arrayElemAt: ['$user.isBanned', 0] },
        distance: 0,
        distanceKm: 0,
      },
    },
    {
      $match: {
        userBanned: { $ne: true },
      },
    },
    {
      $project: {
        user: 0,
        userBanned: 0,
      },
    },
  ]);

  return pharmacies;
};

// Keep for backwards compatibility
export const findNearbyPharmacies = findPharmaciesByGovernorate.bind(null, 'Giza') as any;

export const calculateDistanceBetween = (
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number
): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);
