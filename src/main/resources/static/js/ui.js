/* global window, document */
(() => {
  const api = window.AtencyAPI;
  const auth = window.AtencyAuth;

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const setButtonLoading = (button, isLoading) => {
    if (!button) return;
    button.classList.toggle("is-loading", isLoading);
    button.disabled = isLoading;
    button.setAttribute("aria-busy", String(isLoading));
  };

  const setMessage = (element, message, tone = "error") => {
    if (!element) return;
    if (!message) {
      element.textContent = "";
      element.classList.add("hidden");
      return;
    }
    element.textContent = message;
    element.classList.remove("hidden");
    element.dataset.tone = tone;
  };

  const formatDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (value) => {
    if (!value) return "--";
    if (typeof value === "string") {
      return value.length >= 5 ? value.slice(0, 5) : value;
    }
    if (value instanceof Date) {
      return value.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return String(value);
  };

  const updateUserUI = () => {
    const user = auth.getUser();
    if (!user) return;

    qsa("[data-username]").forEach((el) => {
      el.textContent = user.username;
    });

    qsa(".admin-only").forEach((el) => {
      el.classList.toggle("hidden", user.role !== "ADMIN");
    });
  };

  const setActiveNav = (page) => {
    if (!page) return;
    qsa("[data-nav]").forEach((link) => {
      link.classList.toggle("is-active", link.dataset.nav === page);
    });
  };

  const handleApiError = (error, messageEl, fallback) => {
    if (error?.status === 401) {
      auth.logout();
      return;
    }
    setMessage(messageEl, error?.message || fallback || "Something went wrong", "error");
  };

  const initLoginPage = () => {
    if (auth.redirectIfAuthenticated()) return;

    const form = qs("#loginForm");
    const submitBtn = qs("#loginButton");
    const messageEl = qs("#loginMessage");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(messageEl, "");

      const username = qs("#loginUsername")?.value.trim();
      const password = qs("#loginPassword")?.value.trim();

      if (!username || !password) {
        setMessage(messageEl, "Username and password are required.", "error");
        return;
      }

      setButtonLoading(submitBtn, true);
      try {
        await auth.login({ username, password });
        window.location.href = "dashboard.html";
      } catch (error) {
        setMessage(messageEl, error?.message || "Login failed.", "error");
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  };

  const initRegisterPage = () => {
    if (auth.redirectIfAuthenticated()) return;

    const form = qs("#registerForm");
    const submitBtn = qs("#registerButton");
    const messageEl = qs("#registerMessage");

    const setFieldError = (fieldId, message) => {
      const field = qs(fieldId);
      if (!field) return;
      field.textContent = message;
    };

    const validate = () => {
      const fullName = qs("#registerFullName")?.value.trim();
      const username = qs("#registerUsername")?.value.trim();
      const password = qs("#registerPassword")?.value.trim();

      const errors = {
        fullName: fullName?.length < 3 ? "Full name must be at least 3 characters." : "",
        username: username?.length < 3 ? "Username must be at least 3 characters." : "",
        password: password?.length < 6 ? "Password must be at least 6 characters." : "",
      };

      setFieldError("#errorFullName", errors.fullName);
      setFieldError("#errorUsername", errors.username);
      setFieldError("#errorPassword", errors.password);

      return { fullName, username, password, errors };
    };

    qsa("#registerFullName, #registerUsername, #registerPassword").forEach((input) => {
      input.addEventListener("input", () => validate());
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      setMessage(messageEl, "");

      const { fullName, username, password, errors } = validate();

      if (errors.fullName || errors.username || errors.password) {
        return;
      }

      setButtonLoading(submitBtn, true);
      try {
        await auth.register({ fullName, username, password });
        setMessage(messageEl, "Registration successful. Redirecting to login...", "success");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 800);
      } catch (error) {
        if (error?.validationErrors) {
          setFieldError("#errorFullName", error.validationErrors.fullName || "");
          setFieldError("#errorUsername", error.validationErrors.username || "");
          setFieldError("#errorPassword", error.validationErrors.password || "");
        }
        setMessage(messageEl, error?.message || "Registration failed.", "error");
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  };

  const initDashboardPage = async () => {
    const hoursEl = qs("#summaryHours");
    const presentEl = qs("#summaryPresent");
    const absentEl = qs("#summaryAbsent");
    const messageEl = qs("#dashboardMessage");

    try {
      const summary = await api.getSummary();
      if (hoursEl) hoursEl.textContent = summary.totalWorkedHours || "00:00";
      if (presentEl) presentEl.textContent = summary.presentDays ?? 0;
      if (absentEl) absentEl.textContent = summary.absentDays ?? 0;
    } catch (error) {
      handleApiError(error, messageEl, "Unable to load dashboard data.");
    }
  };

  const initAttendancePage = async () => {
    const clockEl = qs("#liveClock");
    const dateEl = qs("#todayDate");
    const statusBadge = qs("#todayStatusBadge");
    const statusText = qs("#todayStatusText");
    const messageEl = qs("#attendanceMessage");
    const checkInBtn = qs("#checkInButton");
    const checkOutBtn = qs("#checkOutButton");

    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }

    const updateClock = () => {
      if (!clockEl) return;
      clockEl.textContent = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    updateClock();
    setInterval(updateClock, 1000);

    const setStatus = (status, text) => {
      if (!statusBadge || !statusText) return;
      statusBadge.textContent = status;
      statusBadge.dataset.status = status.toLowerCase();
      statusText.textContent = text;
    };

    const findTodayRecord = (records) => {
      const today = new Date().toISOString().split("T")[0];
      return records.find((record) => record.date === today);
    };

    const refreshStatus = async () => {
      setMessage(messageEl, "");
      if (checkInBtn) checkInBtn.disabled = true;
      if (checkOutBtn) checkOutBtn.disabled = true;

      try {
        const records = await api.getMyRecords();
        const record = findTodayRecord(records || []);

        if (!record) {
          setStatus("Absent", "No check-in yet.");
          if (checkInBtn) checkInBtn.disabled = false;
          if (checkOutBtn) checkOutBtn.disabled = true;
          return;
        }

        if (record.status === "ABSENT") {
          setStatus("Absent", "Marked absent for today.");
          if (checkInBtn) checkInBtn.disabled = true;
          if (checkOutBtn) checkOutBtn.disabled = true;
          return;
        }

        setStatus("Present", "Attendance recorded.");

        if (record.checkInTime && !record.checkOutTime) {
          setStatus("Present", `Checked in at ${formatTime(record.checkInTime)}.`);
          if (checkInBtn) checkInBtn.disabled = true;
          if (checkOutBtn) checkOutBtn.disabled = false;
          return;
        }

        if (record.checkOutTime) {
          setStatus("Present", `Checked out at ${formatTime(record.checkOutTime)}.`);
          if (checkInBtn) checkInBtn.disabled = true;
          if (checkOutBtn) checkOutBtn.disabled = true;
          return;
        }

        if (checkInBtn) checkInBtn.disabled = false;
        if (checkOutBtn) checkOutBtn.disabled = true;
      } catch (error) {
        handleApiError(error, messageEl, "Unable to load attendance status.");
      }
    };

    await refreshStatus();

    checkInBtn?.addEventListener("click", async () => {
      setMessage(messageEl, "");
      setButtonLoading(checkInBtn, true);
      try {
        await api.checkIn();
        setMessage(messageEl, "Check-in recorded.", "success");
        await refreshStatus();
      } catch (error) {
        handleApiError(error, messageEl, "Check-in failed.");
      } finally {
        setButtonLoading(checkInBtn, false);
      }
    });

    checkOutBtn?.addEventListener("click", async () => {
      setMessage(messageEl, "");
      setButtonLoading(checkOutBtn, true);
      try {
        await api.checkOut();
        setMessage(messageEl, "Check-out recorded.", "success");
        await refreshStatus();
      } catch (error) {
        handleApiError(error, messageEl, "Check-out failed.");
      } finally {
        setButtonLoading(checkOutBtn, false);
      }
    });
  };

  const renderHistoryTable = (records) => {
    const tableBody = qs("#historyTableBody");
    const emptyEl = qs("#historyEmpty");

    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (!records || !records.length) {
      emptyEl?.classList.remove("hidden");
      return;
    }

    emptyEl?.classList.add("hidden");

    records.forEach((record) => {
      const row = document.createElement("tr");
      const status = record.status || "PRESENT";
      row.innerHTML = `
        <td>${formatDate(record.date)}</td>
        <td>${formatTime(record.checkInTime)}</td>
        <td>${formatTime(record.checkOutTime)}</td>
        <td>${record.workedHours || "--"}</td>
        <td><span class="status-badge" data-status="${status.toLowerCase()}">${status}</span></td>
      `;
      tableBody.appendChild(row);
    });
  };

  const initHistoryPage = async () => {
    const messageEl = qs("#historyMessage");

    try {
      const records = await api.getMyRecords();
      renderHistoryTable(records || []);
    } catch (error) {
      handleApiError(error, messageEl, "Unable to load attendance history.");
    }
  };

  const renderAdminSummary = (records) => {
    const employeesEl = qs("#adminTotalEmployees");
    const presentEl = qs("#adminTodayPresent");
    const totalEl = qs("#adminTotalRecords");

    const uniqueUsers = new Set(records.map((record) => record.userId)).size;
    const today = new Date().toISOString().split("T")[0];
    const todayPresent = records.filter(
      (record) => record.date === today && record.status === "PRESENT"
    ).length;

    if (employeesEl) employeesEl.textContent = uniqueUsers;
    if (presentEl) presentEl.textContent = todayPresent;
    if (totalEl) totalEl.textContent = records.length;
  };

  const renderAdminTable = (records) => {
    const tableBody = qs("#adminTableBody");
    const emptyEl = qs("#adminEmpty");

    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (!records.length) {
      emptyEl?.classList.remove("hidden");
      return;
    }

    emptyEl?.classList.add("hidden");

    records.forEach((record) => {
      const status = record.status || "PRESENT";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${record.fullName || record.username || "--"}</td>
        <td>${formatDate(record.date)}</td>
        <td>${formatTime(record.checkInTime)}</td>
        <td>${formatTime(record.checkOutTime)}</td>
        <td>${record.workedHours || "--"}</td>
        <td><span class="status-badge" data-status="${status.toLowerCase()}">${status}</span></td>
      `;
      tableBody.appendChild(row);
    });
  };

  const initAdminPage = async () => {
    const messageEl = qs("#adminMessage");

    try {
      const records = await api.getAllAttendance();
      renderAdminSummary(records || []);
      renderAdminTable(records || []);
    } catch (error) {
      handleApiError(error, messageEl, "Unable to load admin data.");
    }
  };

  const init = () => {
    const page = document.body.dataset.page;
    const requiresAuth = document.body.dataset.auth === "required";
    const requiredRole = document.body.dataset.role;

    if (requiresAuth && !auth.requireAuth(requiredRole)) {
      return;
    }

    updateUserUI();
    setActiveNav(page);

    const logoutButton = qs("#logoutButton");
    logoutButton?.addEventListener("click", () => auth.logout());

    if (page === "login") initLoginPage();
    if (page === "register") initRegisterPage();
    if (page === "dashboard") initDashboardPage();
    if (page === "attendance") initAttendancePage();
    if (page === "history") initHistoryPage();
    if (page === "admin") initAdminPage();
  };

  document.addEventListener("DOMContentLoaded", init);
})();
