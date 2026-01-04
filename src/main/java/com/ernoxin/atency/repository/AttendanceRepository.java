package com.ernoxin.atency.repository;

import com.ernoxin.atency.entity.Attendance;
import com.ernoxin.atency.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByUserAndDate(User user, LocalDate date);

    boolean existsByUserAndDate(User user, LocalDate date);

    List<Attendance> findAllByUserOrderByDateDesc(User user);

    List<Attendance> findAllByUserIdOrderByDateDesc(Long userId);

    List<Attendance> findAllByOrderByDateDesc();
}
