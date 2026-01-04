package com.ernoxin.atency.controller;

import com.ernoxin.atency.dto.AttendanceRecordDto;
import com.ernoxin.atency.dto.BaseResponse;
import com.ernoxin.atency.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/attendance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/all")
    public ResponseEntity<BaseResponse<List<AttendanceRecordDto>>> getAll() {
        List<AttendanceRecordDto> records = attendanceService.getAllRecords();
        return ResponseEntity.ok(BaseResponse.of(HttpStatus.OK, records));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<BaseResponse<List<AttendanceRecordDto>>> getByUser(@PathVariable Long userId) {
        List<AttendanceRecordDto> records = attendanceService.getRecordsByUserId(userId);
        return ResponseEntity.ok(BaseResponse.of(HttpStatus.OK, records));
    }
}
