package com.ernoxin.atency.controller;

import com.ernoxin.atency.dto.AttendanceRecordDto;
import com.ernoxin.atency.dto.AttendanceSummaryDto;
import com.ernoxin.atency.dto.BaseResponse;
import com.ernoxin.atency.security.UserPrincipal;
import com.ernoxin.atency.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/check-in")
    public ResponseEntity<BaseResponse<AttendanceRecordDto>> checkIn(
            @AuthenticationPrincipal UserPrincipal principal) {
        AttendanceRecordDto record = attendanceService.checkIn(principal.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponse.of(HttpStatus.CREATED, record));
    }

    @PostMapping("/check-out")
    public ResponseEntity<BaseResponse<AttendanceRecordDto>> checkOut(
            @AuthenticationPrincipal UserPrincipal principal) {
        AttendanceRecordDto record = attendanceService.checkOut(principal.getUsername());
        return ResponseEntity.ok(BaseResponse.of(HttpStatus.OK, record));
    }

    @GetMapping("/my-records")
    public ResponseEntity<BaseResponse<List<AttendanceRecordDto>>> myRecords(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<AttendanceRecordDto> records = attendanceService.getMyRecords(principal.getUsername());
        return ResponseEntity.ok(BaseResponse.of(HttpStatus.OK, records));
    }

    @GetMapping("/my-summary")
    public ResponseEntity<BaseResponse<AttendanceSummaryDto>> mySummary(
            @AuthenticationPrincipal UserPrincipal principal) {
        AttendanceSummaryDto summary = attendanceService.getMySummary(principal.getUsername());
        return ResponseEntity.ok(BaseResponse.of(HttpStatus.OK, summary));
    }
}
