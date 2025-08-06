// Static driver data with salary percentages
export const drivers = [
  {
    id: 1,
    name: "Vivek Bali",
    phone: "+91-9876543210",
    licenseNumber: "DL-12345",
    active: true,
    salaryPercentage: 30, // Special rate for Vivek
    whatsappGroup: "https://chat.whatsapp.com/Fxf7jJn5h5G5t8rCMnoLGZ"
  },
  {
    id: 2,
    name: "Preetam",
    phone: "+91-9876543211",
    licenseNumber: "DL-12346",
    active: true,
    salaryPercentage: 35,
    whatsappGroup: "https://chat.whatsapp.com/Gr8UBvRIu3C7kME9WinUwD"
  },
  {
    id: 3,
    name: "Chhotelal",
    phone: "+91-9876543212",
    licenseNumber: "DL-12347",
    active: true,
    salaryPercentage: 35,
    whatsappGroup: "https://chat.whatsapp.com/KE2IWoZfLkD6Z5vZPgGTob"
  },
  {
    id: 4,
    name: "Vikas",
    phone: "+91-9876543213",
    licenseNumber: "DL-12348",
    active: true,
    salaryPercentage: 35,
    whatsappGroup: "https://chat.whatsapp.com/EsmG21Eshow2tP575jp1Pp"
  }
];

// Platforms for earnings tracking
export const platforms = [
  { id: 'uber', name: 'Uber', color: 'bg-black' },
  { id: 'indrive', name: 'InDrive', color: 'bg-green-600' },
  { id: 'yatri', name: 'Yatri', color: 'bg-blue-600' },
  { id: 'rapido', name: 'Rapido', color: 'bg-yellow-500' },
  { id: 'offline', name: 'Offline', color: 'bg-gray-600' }
];

// Commission structures
export const commissionTypes = [
  { id: 'uber_commission', name: 'Uber Commission', platform: 'uber' },
  { id: 'yatri_commission', name: 'Yatri Commission', platform: 'yatri' }
];
