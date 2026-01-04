package com.ernoxin.atency.dto;

import com.ernoxin.atency.entity.AttendanceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Builder
public class AttendanceRecordDto {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private LocalDate date;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String workedHours;
    private AttendanceStatus status;
}
