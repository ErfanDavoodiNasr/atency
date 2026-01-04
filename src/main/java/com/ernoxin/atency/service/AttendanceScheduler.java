package com.ernoxin.atency.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class AttendanceScheduler {

    private final AttendanceService attendanceService;

    @Scheduled(cron = "0 5 0 * * *")
    public void markAbsentForPreviousDay() {
        attendanceService.markAbsentForDate(LocalDate.now().minusDays(1));
    }
}
