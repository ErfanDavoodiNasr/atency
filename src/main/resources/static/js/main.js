/* global window, document */
(() => {
  const api = window.AtencyAPI;
  const themeKey = "atency_theme";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));

  const formatTime = (value) => (value ? value : "--:--");

  const formatDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(themeKey, theme);
  };

  const initTheme = () => {
    const saved = localStorage.getItem(themeKey);
    if (saved) {
      setTheme(saved);
      return;
    }
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "light" : "dark");
  };

  const setButtonLoading = (button, isLoading) => {
    if (!button) return;
    button.classList.toggle("is-loading", isLoading);
    button.disabled = isLoading;
  };

  const showToast = (message, type = "info") => {
    const stack = qs("#toastStack");
    if (!stack) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  const openModal = (options) => {
    const modal = qs("#confirmModal");
    if (!modal) return;
    const title = qs("[data-modal-title]", modal);
    const body = qs("[data-modal-body]", modal);
    const confirmBtn = qs("[data-modal-confirm]", modal);
    const cancelBtn = qs("[data-modal-cancel]", modal);

    title.textContent = options.title || "Confirm";
    body.textContent = options.body || "Are you sure?";

    const cleanup = () => {
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    confirmBtn.onclick = () => {
      cleanup();
      modal.classList.remove("open");
      options.onConfirm?.();
    };

    cancelBtn.onclick = () => {
      cleanup();
      modal.classList.remove("open");
    };

    modal.classList.add("open");
  };

  const closeModalOnBackdrop = () => {
    const modal = qs("#confirmModal");
    if (!modal) return;
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.classList.remove("open");
      }
    });
  };

  const ensureAuth = () => {
    const requiresAuth = document.body.dataset.auth === "required";
    if (!requiresAuth) return true;

    const token = api.getToken();
    if (!token) {
      window.location.href = "login.html";
      return false;
    }

    const requiredRole = document.body.dataset.role;
    const user = api.getUser();
    if (requiredRole && user?.role !== requiredRole) {
      window.location.href = "dashboard.html";
      return false;
    }

    return true;
  };

  const updateUserUI = () => {
    const user = api.getUser();
    if (!user) return;

    qsa("[data-username]").forEach((el) => {
      el.textContent = user.username;
    });

    qsa("[data-user-initials]").forEach((el) => {
      el.textContent = getInitials(user.username);
    });

    qsa(".admin-only").forEach((el) => {
      el.classList.toggle("hidden", user.role !== "ADMIN");
    });
  };

  const bindSidebar = () => {
    const toggleBtn = qs("#sidebarToggle");
    const overlay = qs("#sidebarOverlay");
    if (!toggleBtn || !overlay) return;

    toggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("sidebar-open");
    });

    overlay.addEventListener("click", () => {
      document.body.classList.remove("sidebar-open");
    });
  };

  const bindProfile = () => {
    const button = qs("#profileButton");
    const dropdown = qs("#profileDropdown");
    const logoutBtn = qs("#logoutButton");
    if (!button || !dropdown) return;

    button.addEventListener("click", () => {
      dropdown.classList.toggle("open");
    });

    document.addEventListener("click", (event) => {
      if (!dropdown.contains(event.target) && !button.contains(event.target)) {
        dropdown.classList.remove("open");
      }
    });

    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        api.clearSession();
        window.location.href = "login.html";
      });
    }
  };

  const handleApiError = (error, fallbackMessage) => {
    if (error?.status === 401) {
      api.clearSession();
      window.location.href = "login.html";
      return;
    }
    showToast(error?.message || fallbackMessage || "Something went wrong", "error");
  };

  const initLoginPage = () => {
    const form = qs("#loginForm");
    const message = qs("#formMessage");
    const submitBtn = qs("#loginButton");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.textContent = "";
      message.className = "inline-message hidden";

      const username = qs("#loginUsername").value.trim();
      const password = qs("#loginPassword").value.trim();

      if (!username || !password) {
        message.textContent = "Please enter your username and password.";
        message.className = "inline-message error";
        return;
      }

      setButtonLoading(submitBtn, true);
      try {
        const response = await api.login({ username, password });
        api.setSession(response);
        showToast("Welcome back to Atency", "success");
        window.location.href =
          response.role === "ADMIN" ? "admin.html" : "dashboard.html";
      } catch (error) {
        message.textContent = error.message || "Login failed.";
        message.className = "inline-message error";
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  };

  const initRegisterPage = () => {
    const form = qs("#registerForm");
    const message = qs("#formMessage");
    const submitBtn = qs("#registerButton");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.textContent = "";
      message.className = "inline-message hidden";

      const fullName = qs("#fullName").value.trim();
      const username = qs("#registerUsername").value.trim();
      const password = qs("#registerPassword").value.trim();

      const errors = {
        fullName: fullName.length < 3 ? "Enter your full name." : "",
        username: username.length < 3 ? "Username must be 3+ characters." : "",
        password: password.length < 6 ? "Password must be 6+ characters." : "",
      };

      qs("#errorFullName").textContent = errors.fullName;
      qs("#errorUsername").textContent = errors.username;
      qs("#errorPassword").textContent = errors.password;

      if (errors.fullName || errors.username || errors.password) {
        return;
      }

      setButtonLoading(submitBtn, true);
      try {
        const response = await api.register({ fullName, username, password });
        api.setSession(response);
        message.textContent = "Account created successfully.";
        message.className = "inline-message success";
        showToast("Welcome to Atency", "success");
        setTimeout(() => {
          window.location.href =
            response.role === "ADMIN" ? "admin.html" : "dashboard.html";
        }, 600);
      } catch (error) {
        if (error.validationErrors) {
          qs("#errorFullName").textContent =
            error.validationErrors.fullName || "";
          qs("#errorUsername").textContent =
            error.validationErrors.username || "";
          qs("#errorPassword").textContent =
            error.validationErrors.password || "";
        }
        message.textContent = error.message || "Registration failed.";
        message.className = "inline-message error";
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  };

  const renderWeekly = (records = []) => {
    const weeklyList = qs("#weeklyList");
    if (!weeklyList) return;

    const sorted = [...records].sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
    const lastSeven = sorted.slice(-7);

    weeklyList.innerHTML = "";

    if (!lastSeven.length) {
      weeklyList.innerHTML = `<div class="empty-state"><h4>No weekly data</h4><p>Your week will appear after your first check-in.</p></div>`;
      return;
    }

    lastSeven.forEach((record) => {
      const status = record.status || "PRESENT";
      const item = document.createElement("div");
      item.className = "weekly-item";
      item.innerHTML = `
        <div class="day">${formatDate(record.date)}</div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${
            status === "PRESENT" ? "100" : "12"
          }%"></div>
        </div>
        <span class="badge ${status === "ABSENT" ? "absent" : "present"}">${status}</span>
      `;
      weeklyList.appendChild(item);
    });
  };

  const initDashboardPage = async () => {
    const summaryHours = qs("#summaryHours");
    const summaryPresent = qs("#summaryPresent");
    const summaryAbsent = qs("#summaryAbsent");
    const statCards = qsa(".stat-card");
    statCards.forEach((card) => card.classList.add("is-loading"));

    try {
      const [summary, records] = await Promise.all([
        api.getSummary(),
        api.getMyRecords(),
      ]);

      summaryHours.textContent = summary.totalWorkedHours || "0h";
      summaryPresent.textContent = summary.presentDays ?? 0;
      summaryAbsent.textContent = summary.absentDays ?? 0;
      renderWeekly(records);
    } catch (error) {
      handleApiError(error, "Unable to load dashboard data.");
    } finally {
      statCards.forEach((card) => card.classList.remove("is-loading"));
    }
  };

  const findTodayRecord = (records) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    return records.find((record) => record.date === todayStr);
  };

  const updateAttendanceStatus = (record) => {
    const statusText = qs("#todayStatusText");
    const statusBadge = qs("#todayStatusBadge");

    if (!statusText || !statusBadge) return;

    if (!record) {
      statusText.textContent = "Not checked in yet";
      statusBadge.className = "attendance-status";
      return;
    }

    if (record.status === "ABSENT") {
      statusText.textContent = "Marked absent today";
      statusBadge.className = "attendance-status absent";
      return;
    }

    if (record.checkInTime && !record.checkOutTime) {
      statusText.textContent = `Checked in at ${record.checkInTime}`;
      statusBadge.className = "attendance-status present";
      return;
    }

    if (record.checkOutTime) {
      statusText.textContent = `Checked out at ${record.checkOutTime}`;
      statusBadge.className = "attendance-status present";
      return;
    }

    statusText.textContent = "Attendance pending";
    statusBadge.className = "attendance-status pending";
  };

  const initAttendancePage = async () => {
    const clock = qs("#liveClock");
    const checkInBtn = qs("#checkInButton");
    const checkOutBtn = qs("#checkOutButton");

    const updateClock = () => {
      if (!clock) return;
      const now = new Date();
      clock.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    };

    updateClock();
    setInterval(updateClock, 1000);

    let todayRecord = null;

    const refreshStatus = async () => {
      try {
        if (checkInBtn) checkInBtn.disabled = true;
        if (checkOutBtn) checkOutBtn.disabled = true;
        const records = await api.getMyRecords();
        todayRecord = findTodayRecord(records);
        updateAttendanceStatus(todayRecord);
        if (checkInBtn) {
          checkInBtn.disabled = Boolean(todayRecord?.checkInTime);
        }
        if (checkOutBtn) {
          checkOutBtn.disabled = !todayRecord?.checkInTime || Boolean(
            todayRecord?.checkOutTime
          );
        }
      } catch (error) {
        handleApiError(error, "Unable to load attendance state.");
      }
    };

    await refreshStatus();

    checkInBtn?.addEventListener("click", () => {
      openModal({
        title: "Confirm Check-in",
        body: "Ready to log your check-in for today?",
        onConfirm: async () => {
          setButtonLoading(checkInBtn, true);
          try {
            await api.checkIn();
            showToast("Check-in recorded", "success");
            await refreshStatus();
          } catch (error) {
            handleApiError(error, "Check-in failed.");
          } finally {
            setButtonLoading(checkInBtn, false);
          }
        },
      });
    });

    checkOutBtn?.addEventListener("click", () => {
      openModal({
        title: "Confirm Check-out",
        body: "Ready to log your check-out for today?",
        onConfirm: async () => {
          setButtonLoading(checkOutBtn, true);
          try {
            await api.checkOut();
            showToast("Check-out recorded", "success");
            await refreshStatus();
          } catch (error) {
            handleApiError(error, "Check-out failed.");
          } finally {
            setButtonLoading(checkOutBtn, false);
          }
        },
      });
    });
  };

  const renderHistoryTable = (records) => {
    const tableBody = qs("#historyTableBody");
    const emptyState = qs("#historyEmptyState");

    tableBody.innerHTML = "";

    if (!records.length) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    records.forEach((record) => {
      const status = record.status || "PRESENT";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatDate(record.date)}</td>
        <td>${formatTime(record.checkInTime)}</td>
        <td>${formatTime(record.checkOutTime)}</td>
        <td>${record.workedHours || "--"}</td>
        <td><span class="badge ${
          status === "ABSENT" ? "absent" : "present"
        }">${status}</span></td>
      `;
      tableBody.appendChild(row);
    });
  };

  const initHistoryPage = async () => {
    const searchInput = qs("#searchInput");
    const statusFilter = qs("#statusFilter");
    const tableBody = qs("#historyTableBody");
    let records = [];

    if (!searchInput || !statusFilter) return;

    try {
      if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan=\"5\">Loading records...</td></tr>`;
      }
      records = await api.getMyRecords();
      records.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      renderHistoryTable(records);
    } catch (error) {
      handleApiError(error, "Unable to load attendance history.");
    }

    const filter = () => {
      const query = searchInput.value.trim().toLowerCase();
      const status = statusFilter.value;
      const filtered = records.filter((record) => {
        const matchesQuery = record.date?.includes(query) ||
          (record.workedHours || "").toLowerCase().includes(query);
        const matchesStatus = status === "ALL" || record.status === status;
        return matchesQuery && matchesStatus;
      });
      renderHistoryTable(filtered);
    };

    searchInput?.addEventListener("input", filter);
    statusFilter?.addEventListener("change", filter);
  };

  const buildAdminSummary = (records) => {
    const uniqueUsers = new Set(records.map((record) => record.userId)).size;
    const totalRecords = records.length;
    const today = new Date().toISOString().split("T")[0];
    const todayPresent = records.filter(
      (record) => record.date === today && record.status === "PRESENT"
    ).length;

    qs("#adminTotalEmployees").textContent = uniqueUsers;
    qs("#adminTodayPresent").textContent = todayPresent;
    qs("#adminTotalRecords").textContent = totalRecords;
  };

  const renderEmployeeList = (records) => {
    const list = qs("#employeeList");
    if (!list) return;
    list.innerHTML = "";

    if (!records.length) {
      list.innerHTML = `<div class="empty-state"><h4>No employees yet</h4><p>Employees will appear after attendance is logged.</p></div>`;
      return;
    }

    const grouped = records.reduce((acc, record) => {
      if (!acc[record.userId]) {
        acc[record.userId] = {
          userId: record.userId,
          username: record.username,
          fullName: record.fullName,
          records: [],
        };
      }
      acc[record.userId].records.push(record);
      return acc;
    }, {});

    Object.values(grouped).forEach((user) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-header">
          <div>
            <div class="card-title">${user.fullName || user.username}</div>
            <div class="page-subtitle">@${user.username}</div>
          </div>
          <button class="btn btn-secondary" data-user-id="${user.userId}">View attendance</button>
        </div>
        <div class="page-subtitle">${user.records.length} record(s)</div>
      `;
      list.appendChild(card);
    });
  };

  const renderAdminTable = (records) => {
    const tableBody = qs("#adminTableBody");
    const emptyState = qs("#adminEmptyState");

    tableBody.innerHTML = "";

    if (!records.length) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    records.forEach((record) => {
      const status = record.status || "PRESENT";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${record.fullName || "--"}</td>
        <td>${formatDate(record.date)}</td>
        <td>${formatTime(record.checkInTime)}</td>
        <td>${formatTime(record.checkOutTime)}</td>
        <td>${record.workedHours || "--"}</td>
        <td><span class="badge ${
          status === "ABSENT" ? "absent" : "present"
        }">${status}</span></td>
      `;
      tableBody.appendChild(row);
    });
  };

  const initAdminPage = async () => {
    let records = [];
    try {
      const list = qs("#employeeList");
      if (list) {
        list.innerHTML = \"<div class=\\\"page-subtitle\\\">Loading employees...</div>\";
      }
      records = await api.getAllAttendance();
      buildAdminSummary(records);
      renderEmployeeList(records);
      renderAdminTable(records);
    } catch (error) {
      handleApiError(error, "Unable to load admin data.");
      return;
    }

    const list = qs("#employeeList");
    list.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-user-id]");
      if (!button) return;
      const userId = button.dataset.userId;
      setButtonLoading(button, true);
      try {
        const userRecords = await api.getAttendanceByUser(userId);
        renderAdminTable(userRecords);
        showToast("Attendance details updated", "success");
      } catch (error) {
        handleApiError(error, "Unable to load employee attendance.");
      } finally {
        setButtonLoading(button, false);
      }
    });
  };

  const initPage = () => {
    initTheme();

    const themeToggle = qs("#themeToggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }

    closeModalOnBackdrop();

    if (!ensureAuth()) return;

    updateUserUI();
    bindSidebar();
    bindProfile();

    const page = document.body.dataset.page;

    if (page === "login") initLoginPage();
    if (page === "register") initRegisterPage();
    if (page === "dashboard") initDashboardPage();
    if (page === "attendance") initAttendancePage();
    if (page === "history") initHistoryPage();
    if (page === "admin") initAdminPage();
  };

  document.addEventListener("DOMContentLoaded", initPage);
})();
