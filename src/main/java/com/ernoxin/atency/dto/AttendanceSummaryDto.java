package com.ernoxin.atency.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AttendanceSummaryDto {
    private String totalWorkedHours;
    private long presentDays;
    private long absentDays;
}
