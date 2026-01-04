package com.ernoxin.atency.util;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.EnumSet;

public final class WorkingDayUtil {
    private static final EnumSet<DayOfWeek> WORKING_DAYS = EnumSet.of(
            DayOfWeek.SATURDAY,
            DayOfWeek.SUNDAY,
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY
    );

    private WorkingDayUtil() {
    }

    public static boolean isWorkingDay(LocalDate date) {
        return WORKING_DAYS.contains(date.getDayOfWeek());
    }

    public static LocalDate previousWorkingDay(LocalDate date) {
        LocalDate cursor = date.minusDays(1);
        while (!isWorkingDay(cursor)) {
            cursor = cursor.minusDays(1);
        }
        return cursor;
    }
}
