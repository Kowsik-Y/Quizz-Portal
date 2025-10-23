-- Migration to change booked_slot from TIMESTAMP to VARCHAR for time slot strings
ALTER TABLE test_bookings ALTER COLUMN booked_slot TYPE VARCHAR(50);