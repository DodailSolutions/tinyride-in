/**
 * Global Centralized Demo Data for TinyRide
 * Strictly fictional demo identity to be used consistently across marketing,
 * UI demonstrations, mockups, and fallback demo states.
 */

export const DEMO_DATA = {
  // Flat convenience aliases for fast interpolation
  childName: 'Aarav Sharma',
  childFirstName: 'Aarav',
  schoolName: 'Olive Mount',
  schoolFullName: 'Olive Mount School',
  driverName: 'Ravi Kumar',
  driverFirstName: 'Ravi',
  driverInitials: 'RK',
  vehicleModel: 'Force Traveller 3350',
  vehiclePlate: 'TS 09 TR 102',
  vehicleShortId: 'TR-102',
  routeNumber: 'Route 04',
  pickupLocation: 'Rainbow Vistas Gate 2',
  safeKeyToken: '482-910',

  child: {
    name: 'Aarav Sharma',
    firstName: 'Aarav',
    grade: '3A',
    fullGrade: 'Grade 3A',
    age: 8,
  },
  school: {
    name: 'Olive Mount',
    fullName: 'Olive Mount School',
    branch: 'Gachibowli, Hyderabad',
    arrivalBay: 'Olive Mount Campus Bay',
    gate: 'Gate 2',
  },
  transport: {
    route: 'Route 04',
    routeName: 'Route 04 (Olive Mount)',
    vehicle: 'Force Traveller 18-Seater',
    vehicleNumber: 'TS09-TR-102',
    shortVehicleNumber: 'TR-102',
    driver: 'Ravi Kumar',
    driverPhone: '+91 98765 43210',
    escort: 'Sunita Devi (Certified Female Escort)',
  },
  schedule: {
    depotTime: '7:15 AM',
    pickupLocation: 'Rainbow Vistas',
    fullPickupLocation: 'Gate 2, Rainbow Vistas, Hitec City',
    pickupTime: '8:35 AM',
    departureTime: '8:40 AM',
    schoolArrival: '8:50 AM',
    returnPickupTime: '3:30 PM',
  },
  security: {
    safeKey: '482-910',
  },
} as const;

export const demoParentData = DEMO_DATA;
