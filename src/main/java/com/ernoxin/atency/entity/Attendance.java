package com.ernoxin.atency.entity;

import com.ernoxin.atency.util.DurationAttributeConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table
@Data
@ToString(exclude = "user")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate date;

    @Column
    private LocalTime checkInTime;

    @Column
    private LocalTime checkOutTime;

    @Convert(converter = DurationAttributeConverter.class)
    @Column(name = "worked_seconds", nullable = false)
    @Builder.Default
    private Duration workedHours = Duration.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AttendanceStatus status;
}
