// Initial data structure
let activityLogs = [];

// Check if there are logs in localStorage
if (localStorage.getItem("activityLogs")) {
  activityLogs = JSON.parse(localStorage.getItem("activityLogs"));
}

// DOM elements ensure we got everthing we need
const activityInput = document.getElementById("activity-input");
const submitBtn = document.getElementById("submit-btn");
const recentLogsContainer = document.getElementById("recent-logs");
const heatmapContainer = document.getElementById("heatmap-container");
const totalLogsElement = document.getElementById("total-logs");
const weekLogsElement = document.getElementById("week-logs");
const activeDayElement = document.getElementById("active-day");
const topCategoryElement = document.getElementById("top-category");
const categoryPills = document.querySelectorAll(".category-pill");

// Active filter
let activeFilter = "all";

// Function to add a new log
function addLog(activity) {
  if (!activity) return; // takes an activity and checks if it is empty / if it already exists

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const timeStamp = `${hours}:${minutes}:${seconds}`;

  const newLog = {
    activity: activity.toLowerCase(),
    timestamp: timeStamp,
    date: now.toISOString().split("T")[0],
    fullDate: now,
  };

  activityLogs.unshift(newLog);

  // Save to localStorage
  localStorage.setItem("activityLogs", JSON.stringify(activityLogs));

  // Update UI
  updateUI();
}

// Function to render recent logs
function renderRecentLogs() {
  recentLogsContainer.innerHTML = "";

  // Filter logs based on active category
  const filteredLogs =
    activeFilter === "all"
      ? activityLogs
      : activityLogs.filter((log) => log.activity.includes(activeFilter));

  const logsToShow = filteredLogs.slice(0, 5); // show five activities at a time 

  logsToShow.forEach((log) => {
    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";
    logEntry.textContent = `[${log.timestamp}] User logged '${log.activity}'`;
    recentLogsContainer.appendChild(logEntry);
  });
}

// Function to generate heatmap
function generateHeatmap() {
  heatmapContainer.innerHTML = ""; // create element for the heatmap

  // Get current date
  const today = new Date();

  // Generate data for the last 4 weeks (28 days)
  const days = 28;
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days + 1);

  // Create activity count map
  const activityCountMap = {};

  for (let i = 0; i < days; i++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(currentDay.getDate() + i);
    const dateStr = currentDay.toISOString().split("T")[0];

    // Count activities for this day that match the filter
    const filteredLogs =
      activeFilter === "all"
        ? activityLogs
        : activityLogs.filter((log) => log.activity.includes(activeFilter));

    // still not smart enough to write this code right here
    activityCountMap[dateStr] = filteredLogs.filter(
      (log) => log.date === dateStr
    ).length;
  }

  // Find the maximum activity count to normalize the heatmap
  const maxCount = Math.max(1, ...Object.values(activityCountMap));

  // Generate the heatmap grid (4 rows x 7 columns)
  for (let row = 0; row < 4; row++) {
    const heatmapRow = document.createElement("div");
    heatmapRow.className = "heatmap-row";

    for (let col = 0; col < 7; col++) {
      const dayOffset = row * 7 + col;
      const currentDay = new Date(startDate);
      currentDay.setDate(currentDay.getDate() + dayOffset);
      const dateStr = currentDay.toISOString().split("T")[0];

      const activityCount = activityCountMap[dateStr] || 0;

      // Calculate the intensity level (0-4)
      let intensityLevel = 0;
      if (activityCount > 0) {
        intensityLevel = Math.ceil((activityCount / maxCount) * 4);
      }

      const cell = document.createElement("div");
      cell.className = `heatmap-cell${
        intensityLevel > 0 ? " level-" + intensityLevel : ""
      }`;
      cell.title = `${currentDay.toDateString()}: ${activityCount} activities`;

      heatmapRow.appendChild(cell);
    }

    heatmapContainer.appendChild(heatmapRow);
  }
}

// Function to update statistics
function updateStatistics() {
  // Filter logs based on active category
  const filteredLogs =
    activeFilter === "all"
      ? activityLogs
      : activityLogs.filter((log) => log.activity.includes(activeFilter));

  // Total logs
  totalLogsElement.textContent = filteredLogs.length;

  // This week logs
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const thisWeekLogs = filteredLogs.filter(
    (log) => new Date(log.date) >= oneWeekAgo
  );
  weekLogsElement.textContent = thisWeekLogs.length;

  // Most active day
  const dayCount = {};
  filteredLogs.forEach((log) => {
    const dayOfWeek = new Date(log.date).toLocaleDateString("en-US", {
      weekday: "short",
    });
    dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1;
  });

  if (Object.keys(dayCount).length > 0) {
    const mostActiveDay = Object.keys(dayCount).reduce((a, b) =>
      dayCount[a] > dayCount[b] ? a : b
    );
    activeDayElement.textContent = mostActiveDay;
  } else {
    activeDayElement.textContent = "-";
  }

  // Top category
  const categoryCount = {};
  activityLogs.forEach((log) => {
    const activity = log.activity.toLowerCase();
    if (activity.includes("sql")) {
      categoryCount.sql = (categoryCount.sql || 0) + 1;
    } else if (activity.includes("python")) {
      categoryCount.python = (categoryCount.python || 0) + 1;
    } else if (activity.includes("javascript")) {
      categoryCount.javascript = (categoryCount.javascript || 0) + 1;
    } else if (activity.includes("dom")) {
      categoryCount.dom = (categoryCount.dom || 0) + 1;
    }
  });

  if (Object.keys(categoryCount).length > 0) {
    const topCategory = Object.keys(categoryCount).reduce((a, b) =>
      categoryCount[a] > categoryCount[b] ? a : b
    );
    topCategoryElement.textContent =
      topCategory.charAt(0).toUpperCase() + topCategory.slice(1);
  } else {
    topCategoryElement.textContent = "-";
  }
}

// Function to update the UI
function updateUI() {
  renderRecentLogs();
  generateHeatmap();
  updateStatistics();
}

// Event listeners
submitBtn.addEventListener("click", () => {
  const activity = activityInput.value.trim();
  if (activity) {
    addLog(activity);
    activityInput.value = "";
  }
});

activityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const activity = activityInput.value.trim();
    if (activity) {
      addLog(activity);
      activityInput.value = "";
    }
  }
});

// Category filter event listeners
categoryPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    // Remove active class from all pills
    categoryPills.forEach((p) => p.classList.remove("active"));

    // Add active class to clicked pill
    pill.classList.add("active");

    // Update active filter
    activeFilter = pill.getAttribute("data-category");

    // Update UI
    updateUI();
  });
});

// Initialize the UI
updateUI();

// Add some sample data if no logs exist
if (activityLogs.length === 0) {
  // Current date and time
  const now = new Date();

  // Sample logs from the last few hours
  const sampleLogs = [
    {
      activity: "javascript",
      timestamp: "14:15:30",
      date: now.toISOString().split("T")[0],
      fullDate: now,
    },
    {
      activity: "python",
      timestamp: "13:02:10",
      date: now.toISOString().split("T")[0],
      fullDate: now,
    },
    {
      activity: "sql",
      timestamp: "12:34:56",
      date: now.toISOString().split("T")[0],
      fullDate: now,
    },
  ];

  // Add more sample logs for the past week
  for (let i = 1; i < 7; i++) {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - i);
    const dateStr = pastDate.toISOString().split("T")[0];

    // Add 1-3 logs for each day
    const logsCount = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < logsCount; j++) {
      const activities = ["sql", "python", "javascript", "dom"];
      const randomActivity =
        activities[Math.floor(Math.random() * activities.length)];

      const hours = String(Math.floor(Math.random() * 24)).padStart(2, "0");
      const minutes = String(Math.floor(Math.random() * 60)).padStart(2, "0");
      const seconds = String(Math.floor(Math.random() * 60)).padStart(2, "0");

      sampleLogs.push({
        activity: randomActivity,
        timestamp: `${hours}:${minutes}:${seconds}`,
        date: dateStr,
        fullDate: pastDate,
      });
    }
  }

  // Sort sample logs by date (newest first)
  sampleLogs.sort((a, b) => new Date(b.fullDate) - new Date(a.fullDate));

  // Add sample logs to activity logs
  activityLogs = sampleLogs;

  // Save to localStorage
  localStorage.setItem("activityLogs", JSON.stringify(activityLogs));

  // Update UI
  updateUI();
}
