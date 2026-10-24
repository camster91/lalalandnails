export const bookingPolicy={timezone:'America/Toronto',openHour:10,closeHour:15,durationMinutes:120,maxPerDay:1,horizonDays:90} as const;
export const bookingTimes=Array.from({length:bookingPolicy.closeHour-bookingPolicy.openHour-bookingPolicy.durationMinutes/60+1},(_,i)=>`${bookingPolicy.openHour+i}:00`);
