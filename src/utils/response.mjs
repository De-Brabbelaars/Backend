export const mapBookingData = (booking) => {
    return {
        bookingId: booking.BookingID,
        numberOfGuests: booking.NumberOfGuests,
        momentStart: booking.MomentStart,
        momentEnd: booking.MomentEnd,
        placeNumber: booking.PlaceNumber,
        checkedIn: booking.CheckedIn === 1, // Convert checkedIn to boolean for better readability
    };
};
