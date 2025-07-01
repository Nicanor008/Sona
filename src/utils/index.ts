export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const formatDateTime = (dateInput: Date | number | string) => {
  // First ensure we have a proper Date object
  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }

  // Day name (Wed)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[date.getDay()];
  
  // Date with ordinal (11th)
  const dateNum = date.getDate();
  let ordinal = 'th';
  if (dateNum % 10 === 1 && dateNum !== 11) ordinal = 'st';
  if (dateNum % 10 === 2 && dateNum !== 12) ordinal = 'nd';
  if (dateNum % 10 === 3 && dateNum !== 13) ordinal = 'rd';
  
  // Month name (Jun)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[date.getMonth()];
  
  // Year (2025)
  const year = date.getFullYear();
  
  // Time in hh:mm am/pm format
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return {
    dateStr: `${dayName} ${dateNum}${ordinal} ${monthName} ${year}`,
    timeStr: `${hours}:${minutes} ${ampm}`,
    fullDateTime: `${dayName} ${dateNum}${ordinal} ${monthName} ${year}, ${hours}:${minutes} ${ampm}`
  };
};
