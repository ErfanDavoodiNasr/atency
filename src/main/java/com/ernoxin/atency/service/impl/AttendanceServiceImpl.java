package com.ernoxin.atency.service.impl;

import com.ernoxin.atency.dto.AttendanceRecordDto;
import com.ernoxin.atency.dto.AttendanceSummaryDto;
import com.ernoxin.atency.entity.Attendance;
import com.ernoxin.atency.entity.AttendanceStatus;
import com.ernoxin.atency.entity.User;
import com.ernoxin.atency.exception.BadRequestException;
import com.ernoxin.atency.exception.ResourceNotFoundException;
import com.ernoxin.atency.repository.AttendanceRepository;
import com.ernoxin.atency.repository.UserRepository;
import com.ernoxin.atency.service.AttendanceService;
import com.ernoxin.atency.util.WorkingDayUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public AttendanceRecordDto checkIn(String username) {
        User user = getUserByUsername(username);
        LocalDate today = LocalDate.now();
        if (!WorkingDayUtil.isWorkingDay(today)) {
            throw new BadRequestException("Check-in is allowed only on working days");
        }

        Attendance attendance = attendanceRepository.findByUserAndDate(user, today)
                .orElseGet(() -> Attendance.builder()
                        .user(user)
                        .date(today)
                        .status(AttendanceStatus.PRESENT)
                        .workedHours(Duration.ZERO)
                        .build());

        if (attendance.getCheckInTime() != null) {
            throw new BadRequestException("You have already checked in today");
        }

        attendance.setCheckInTime(LocalTime.now());
        attendance.setStatus(AttendanceStatus.PRESENT);
        if (attendance.getWorkedHours() == null) {
            attendance.setWorkedHours(Duration.ZERO);
        }

        Attendance saved = attendanceRepository.save(attendance);
        return toDto(saved, false);
    }

    @Override
    @Transactional
    public AttendanceRecordDto checkOut(String username) {
        User user = getUserByUsername(username);
        LocalDate today = LocalDate.now();
        if (!WorkingDayUtil.isWorkingDay(today)) {
            throw new BadRequestException("Check-out is allowed only on working days");
        }

        Attendance attendance = attendanceRepository.findByUserAndDate(user, today)
                .orElseThrow(() -> new BadRequestException("Check-in is required before check-out"));

        if (attendance.getCheckInTime() == null) {
            throw new BadRequestException("Check-in is required before check-out");
        }

        if (attendance.getCheckOutTime() != null) {
            throw new BadRequestException("You have already checked out today");
        }

        LocalTime now = LocalTime.now();
        if (now.isBefore(attendance.getCheckInTime())) {
            throw new BadRequestException("Check-out time must be after check-in time");
        }

        Duration worked = Duration.between(attendance.getCheckInTime(), now);
        attendance.setCheckOutTime(now);
        attendance.setWorkedHours(worked);
        attendance.setStatus(AttendanceStatus.PRESENT);

        Attendance saved = attendanceRepository.save(attendance);
        return toDto(saved, false);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceRecordDto> getMyRecords(String username) {
        User user = getUserByUsername(username);
        return attendanceRepository.findAllByUserOrderByDateDesc(user)
                .stream()
                .map(attendance -> toDto(attendance, false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceSummaryDto getMySummary(String username) {
        User user = getUserByUsername(username);
        List<Attendance> records = attendanceRepository.findAllByUserOrderByDateDesc(user);

        long presentDays = records.stream()
                .filter(attendance -> attendance.getStatus() == AttendanceStatus.PRESENT)
                .count();
        long absentDays = records.stream()
                .filter(attendance -> attendance.getStatus() == AttendanceStatus.ABSENT)
                .count();

        Duration totalWorked = records.stream()
                .filter(attendance -> attendance.getStatus() == AttendanceStatus.PRESENT)
                .map(Attendance::getWorkedHours)
                .filter(duration -> duration != null)
                .reduce(Duration.ZERO, Duration::plus);

        return AttendanceSummaryDto.builder()
                .totalWorkedHours(formatDuration(totalWorked))
                .presentDays(presentDays)
                .absentDays(absentDays)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceRecordDto> getAllRecords() {
        return attendanceRepository.findAllByOrderByDateDesc()
                .stream()
                .map(attendance -> toDto(attendance, true))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceRecordDto> getRecordsByUserId(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return attendanceRepository.findAllByUserIdOrderByDateDesc(userId)
                .stream()
                .map(attendance -> toDto(attendance, true))
                .toList();
    }

    @Override
    @Transactional
    public void markAbsentForDate(LocalDate date) {
        if (!WorkingDayUtil.isWorkingDay(date)) {
            return;
        }

        List<User> users = userRepository.findAll();
        for (User user : users) {
            if (!attendanceRepository.existsByUserAndDate(user, date)) {
                Attendance attendance = Attendance.builder()
                        .user(user)
                        .date(date)
                        .status(AttendanceStatus.ABSENT)
                        .workedHours(Duration.ZERO)
                        .build();
                attendanceRepository.save(attendance);
            }
        }
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private AttendanceRecordDto toDto(Attendance attendance, boolean includeUser) {
        AttendanceRecordDto.AttendanceRecordDtoBuilder builder = AttendanceRecordDto.builder()
                .id(attendance.getId())
                .date(attendance.getDate())
                .checkInTime(attendance.getCheckInTime())
                .checkOutTime(attendance.getCheckOutTime())
                .workedHours(formatDuration(attendance.getWorkedHours()))
                .status(attendance.getStatus());

        if (includeUser && attendance.getUser() != null) {
            builder
                    .userId(attendance.getUser().getId())
                    .username(attendance.getUser().getUsername())
                    .fullName(attendance.getUser().getFullName());
        }

        return builder.build();
    }

    private String formatDuration(Duration duration) {
        if (duration == null) {
            return "00:00";
        }
        long totalMinutes = duration.toMinutes();
        long hours = totalMinutes / 60;
        long minutes = totalMinutes % 60;
        return String.format("%02d:%02d", hours, minutes);
    }
}
