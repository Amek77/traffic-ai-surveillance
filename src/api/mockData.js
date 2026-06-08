// Mock data for frontend demo
export const mockViolations = [
  {
    _id: '1',
    vehicleNumber: 'MH01AB1234',
    violationType: 'Speeding',
    speed: 95,
    speedLimit: 60,
    location: 'Mumbai - Highway 1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    image: 'https://via.placeholder.com/300x200?text=Speeding+Violation',
    fineAmount: 2000,
    status: 'pending',
  },
  {
    _id: '2',
    vehicleNumber: 'KA02CD5678',
    violationType: 'Red Light',
    speed: 0,
    speedLimit: 0,
    location: 'Bangalore - Traffic Signal 42',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    image: 'https://via.placeholder.com/300x200?text=Red+Light+Violation',
    fineAmount: 1000,
    status: 'resolved',
  },
  {
    _id: '3',
    vehicleNumber: 'DL03EF9012',
    violationType: 'No Helmet',
    speed: 0,
    speedLimit: 0,
    location: 'Delhi - Main Road',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    image: 'https://via.placeholder.com/300x200?text=No+Helmet',
    fineAmount: 500,
    status: 'pending',
  },
];

export const mockAnalytics = {
  totalViolations: 156,
  totalFinesCollected: 312000,
  activeViolations: 42,
  resolvedViolations: 114,
  chartData: [
    { date: 'Mon', violations: 12 },
    { date: 'Tue', violations: 19 },
    { date: 'Wed', violations: 10 },
    { date: 'Thu', violations: 25 },
    { date: 'Fri', violations: 18 },
    { date: 'Sat', violations: 22 },
    { date: 'Sun', violations: 14 },
  ],
  topViolations: [
    { type: 'Speeding', count: 65 },
    { type: 'Red Light', count: 45 },
    { type: 'No Helmet', count: 28 },
    { type: 'Parking', count: 18 },
  ],
};

export const mockUser = {
  _id: '1',
  name: 'Traffic Officer',
  email: 'officer@traffic.gov.in',
  role: 'user',
};

export const mockAdminUser = {
  _id: '1',
  name: 'System Administrator',
  email: 'admin@traffic.gov.in',
  role: 'admin',
};
