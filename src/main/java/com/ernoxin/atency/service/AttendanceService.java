package com.ernoxin.atency.service;

import com.ernoxin.atency.dto.AttendanceRecordDto;
import com.ernoxin.atency.dto.AttendanceSummaryDto;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {
    AttendanceRecordDto checkIn(String username);

    AttendanceRecordDto checkOut(String username);

    List<AttendanceRecordDto> getMyRecords(String username);

    AttendanceSummaryDto getMySummary(String username);

    List<AttendanceRecordDto> getAllRecords();

    List<AttendanceRecordDto> getRecordsByUserId(Long userId);

    void markAbsentForDate(LocalDate date);
}
