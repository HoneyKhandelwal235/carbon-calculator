// ============================================
// CARBON CALCULATOR - ENHANCED JAVASCRIPT
// ============================================

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
  currentTab: 'calculator',
  theme: localStorage.getItem('theme') || 'light',
  calculations: JSON.parse(localStorage.getItem('calculations')) || [],
  currentResult: null
};

// ============================================
// EMISSION FACTORS (kg CO2)
// ============================================
const EMISSION_FACTORS = {
  travel_per_km: 0.21,        // Small petrol car
  electricity_per_kwh: 0.82,  // India average
  ac_per_hour: 1.5,           // Air conditioning
  meat_per_meal: 5 / 7,       // Daily equivalent from weekly
  fuel_per_litre: 2.3 / 7     // Daily equivalent from weekly
};

// Average daily emissions for comparison (kg CO2/day)
const AVERAGES = {
  india: 6.5,
  global: 11.5,
  sustainable: 3.0
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  initializeTabs();
  initializeCalculator();
  initializeHistory();
  renderTips();

  // Add event listeners
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('calculateBtn').addEventListener('click', calculate);
  document.getElementById('clearBtn')?.addEventListener('click', clearForm);

  // Real-time calculation DISABLED to prevent tab jumping while typing
  // Users must click the "Calculate Footprint" button to see results
  // Uncomment below to re-enable real-time calculation:
  /*
  const inputs = document.querySelectorAll('input[type="number"]');
  inputs.forEach(input => {
    input.addEventListener('input', debounce(calculateRealtime, 2000));
  });
  */
});

// ============================================
// THEME MANAGEMENT
// ============================================
function initializeTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('theme', state.theme);
  updateThemeIcon();

  // Add rotation animation
  const toggle = document.getElementById('themeToggle');
  toggle.style.transform = 'rotate(360deg)';
  setTimeout(() => {
    toggle.style.transform = '';
  }, 300);
}

function updateThemeIcon() {
  const icon = document.getElementById('themeIcon');
  icon.textContent = state.theme === 'light' ? '🌙' : '☀️';
}

// ============================================
// TAB MANAGEMENT
// ============================================
function initializeTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });
  switchTab('calculator');
}

function switchTab(tabName) {
  state.currentTab = tabName;

  // Update buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}Tab`);
  });

  // Refresh history if switching to history tab
  if (tabName === 'history') {
    renderHistory();
  }
}

// ============================================
// CALCULATOR INITIALIZATION
// ============================================
function initializeCalculator() {
  // Set default values
  const inputs = {
    travel: 10,
    electricity: 5,
    ac: 2,
    meat: 4,
    fuel: 3
  };

  // Optionally pre-fill for demo
  // Object.keys(inputs).forEach(key => {
  //   document.getElementById(key).value = inputs[key];
  // });
}

// ============================================
// CALCULATION LOGIC
// ============================================
function calculate(autoSwitch = true) {
  // Get input values
  const inputs = {
    travel: parseFloat(document.getElementById('travel').value) || 0,
    electricity: parseFloat(document.getElementById('electricity').value) || 0,
    ac: parseFloat(document.getElementById('ac').value) || 0,
    meat: parseFloat(document.getElementById('meat').value) || 0,
    fuel: parseFloat(document.getElementById('fuel').value) || 0
  };

  // Calculate emissions
  const emissions = {
    travel: inputs.travel * EMISSION_FACTORS.travel_per_km,
    electricity: inputs.electricity * EMISSION_FACTORS.electricity_per_kwh,
    ac: inputs.ac * EMISSION_FACTORS.ac_per_hour,
    meat: (inputs.meat / 7) * 5,
    fuel: (inputs.fuel / 7) * 2.3
  };

  const total = Object.values(emissions).reduce((sum, val) => sum + val, 0);

  // Determine category
  let category = 'LOW';
  let categoryClass = 'success';
  if (total >= 15) {
    category = 'HIGH';
    categoryClass = 'danger';
  } else if (total >= 5) {
    category = 'MODERATE';
    categoryClass = 'warning';
  }

  // Generate suggestions
  const suggestions = generateSuggestions(inputs, emissions);

  // Create result object
  const result = {
    timestamp: new Date().toISOString(),
    inputs,
    emissions,
    total,
    category,
    categoryClass,
    suggestions
  };

  // Save to state and storage
  state.currentResult = result;
  saveCalculation(result);

  // Display results
  displayResults(result);

  // Only switch tabs and scroll if explicitly requested (manual button click)
  if (autoSwitch) {
    switchTab('results');
    // Scroll to results
    document.getElementById('resultsTab').scrollIntoView({ behavior: 'smooth' });
  }
}

function calculateRealtime() {
  // Only calculate if at least one input has a value
  const inputs = document.querySelectorAll('input[type="number"]');
  const hasValue = Array.from(inputs).some(input => input.value);

  if (hasValue) {
    // Calculate but don't auto-switch tabs (false parameter)
    calculate(false);
  }
}

// ============================================
// SUGGESTIONS GENERATOR
// ============================================
function generateSuggestions(inputs, emissions) {
  const suggestions = [];

  if (inputs.travel > 10) {
    suggestions.push({
      icon: '🚌',
      title: 'Reduce Travel Emissions',
      description: 'Consider using public transport, carpooling, or switching to electric vehicles for daily commute.',
      impact: 'high'
    });
  }

  if (inputs.electricity > 5) {
    suggestions.push({
      icon: '💡',
      title: 'Save Electricity',
      description: 'Switch to LED bulbs, unplug idle devices, and use energy-efficient appliances.',
      impact: 'medium'
    });
  }

  if (inputs.ac > 3) {
    suggestions.push({
      icon: '❄️',
      title: 'Optimize AC Usage',
      description: 'Set AC to 24-26°C, use fans, improve insulation, and service AC regularly.',
      impact: 'high'
    });
  }

  if (inputs.meat >= 5) {
    suggestions.push({
      icon: '🥗',
      title: 'Reduce Meat Consumption',
      description: 'Try 2-3 vegetarian days per week. Plant-based meals have much lower carbon footprint.',
      impact: 'high'
    });
  }

  if (inputs.fuel > 3) {
    suggestions.push({
      icon: '⛽',
      title: 'Reduce Fuel Usage',
      description: 'Plan trips efficiently, maintain proper tire pressure, and consider electric alternatives.',
      impact: 'medium'
    });
  }

  // Add positive reinforcement
  if (suggestions.length === 0) {
    suggestions.push({
      icon: '🌟',
      title: 'Great Job!',
      description: 'Your carbon footprint is relatively low. Keep up the good work and inspire others!',
      impact: 'positive'
    });
  }

  // Add general tips
  suggestions.push({
    icon: '🌱',
    title: 'Plant Trees',
    description: 'One tree absorbs ~22kg CO₂/year. Consider planting trees to offset your emissions.',
    impact: 'positive'
  });

  return suggestions;
}

// ============================================
// RESULTS DISPLAY
// ============================================
function displayResults(result) {
  const container = document.getElementById('resultsContent');

  const html = `
    <div class="result-card">
      <!-- Total Emission -->
      <div class="text-center mb-xl">
        <h2 class="mb-sm">Your Carbon Footprint</h2>
        <div class="stat-value" style="font-size: 3.5rem; margin-bottom: 0.5rem;">
          ${result.total.toFixed(2)} <span style="font-size: 1.5rem;">kg CO₂/day</span>
        </div>
        <span class="badge badge-${result.categoryClass}">
          ${result.category} IMPACT
        </span>
      </div>
      
      <!-- Comparison Stats -->
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${(result.total * 365).toFixed(0)}</div>
          <div class="stat-label">kg CO₂/year</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(result.total * 30).toFixed(0)}</div>
          <div class="stat-label">kg CO₂/month</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.ceil(result.total * 365 / 22)}</div>
          <div class="stat-label">Trees needed/year</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${((result.total / AVERAGES.india) * 100).toFixed(0)}%</div>
          <div class="stat-label">vs India Average</div>
        </div>
      </div>
      
      <!-- Breakdown Chart -->
      <div class="mt-xl">
        <h3 class="text-center mb-lg">Emission Breakdown</h3>
        <div id="breakdownChart"></div>
      </div>
      
      <!-- Comparison Bars -->
      <div class="mt-xl">
        <h3 class="mb-lg">How You Compare</h3>
        ${renderComparisonBars(result.total)}
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Render chart
  renderBreakdownChart(result.emissions);
}

function renderBreakdownChart(emissions) {
  const chartContainer = document.getElementById('breakdownChart');

  const categories = [
    { name: 'Travel', value: emissions.travel, color: '#3b82f6', icon: '🚗' },
    { name: 'Electricity', value: emissions.electricity, color: '#f59e0b', icon: '⚡' },
    { name: 'AC Usage', value: emissions.ac, color: '#06b6d4', icon: '❄️' },
    { name: 'Meat', value: emissions.meat, color: '#ef4444', icon: '🥩' },
    { name: 'Fuel', value: emissions.fuel, color: '#8b5cf6', icon: '⛽' }
  ];

  const total = categories.reduce((sum, cat) => sum + cat.value, 0);

  // Create horizontal bar chart
  const html = `
    <div style="max-width: 600px; margin: 0 auto;">
      ${categories.map(cat => {
    const percentage = total > 0 ? (cat.value / total * 100) : 0;
    return `
          <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.25rem;">${cat.icon}</span>
                ${cat.name}
              </span>
              <span style="font-weight: 700; color: ${cat.color};">
                ${cat.value.toFixed(2)} kg
              </span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percentage}%; background: ${cat.color};">
              </div>
            </div>
            <div style="text-align: right; font-size: 0.875rem; color: var(--color-text-tertiary); margin-top: 0.25rem;">
              ${percentage.toFixed(1)}%
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;

  chartContainer.innerHTML = html;

  // Animate bars
  setTimeout(() => {
    document.querySelectorAll('.progress-fill').forEach((bar, index) => {
      bar.style.width = '0%';
      setTimeout(() => {
        const percentage = total > 0 ? (categories[index].value / total * 100) : 0;
        bar.style.width = percentage + '%';
      }, index * 100);
    });
  }, 100);
}

function renderComparisonBars(userTotal) {
  const comparisons = [
    { label: 'Your Footprint', value: userTotal, color: '#10b981' },
    { label: 'India Average', value: AVERAGES.india, color: '#f59e0b' },
    { label: 'Global Average', value: AVERAGES.global, color: '#ef4444' },
    { label: 'Sustainable Target', value: AVERAGES.sustainable, color: '#3b82f6' }
  ];

  const maxValue = Math.max(...comparisons.map(c => c.value));

  return `
    <div style="max-width: 600px; margin: 0 auto;">
      ${comparisons.map(comp => {
    const percentage = (comp.value / maxValue * 100);
    return `
          <div style="margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="font-weight: 600;">${comp.label}</span>
              <span style="font-weight: 700; color: ${comp.color};">
                ${comp.value.toFixed(1)} kg/day
              </span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${percentage}%; background: ${comp.color};"></div>
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

// ============================================
// HISTORY MANAGEMENT
// ============================================
function initializeHistory() {
  renderHistory();
}

function saveCalculation(result) {
  state.calculations.unshift({
    ...result,
    id: Date.now()
  });

  // Keep only last 10 calculations
  if (state.calculations.length > 10) {
    state.calculations = state.calculations.slice(0, 10);
  }

  localStorage.setItem('calculations', JSON.stringify(state.calculations));
}

function renderHistory() {
  const container = document.getElementById('historyContent');

  if (state.calculations.length === 0) {
    container.innerHTML = `
      <div class="text-center" style="padding: 3rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📊</div>
        <h3>No History Yet</h3>
        <p class="text-secondary">Start calculating your carbon footprint to see your history here.</p>
      </div>
    `;
    return;
  }

  const html = `
    <div class="mb-lg" style="display: flex; justify-content: space-between; align-items: center;">
      <h3>Calculation History</h3>
      <button class="btn-secondary" onclick="clearHistory()" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
        Clear History
      </button>
    </div>
    
    ${state.calculations.map((calc, index) => `
      <div class="card mb-lg" style="animation-delay: ${index * 0.1}s;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
          <div>
            <div style="font-size: 0.875rem; color: var(--color-text-tertiary); margin-bottom: 0.25rem;">
              ${formatDate(calc.timestamp)}
            </div>
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">
              ${calc.total.toFixed(2)} kg CO₂/day
            </div>
          </div>
          <span class="badge badge-${calc.categoryClass}">
            ${calc.category}
          </span>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.75rem; font-size: 0.875rem;">
          <div>
            <div style="color: var(--color-text-tertiary);">Travel</div>
            <div style="font-weight: 600;">${calc.emissions.travel.toFixed(1)} kg</div>
          </div>
          <div>
            <div style="color: var(--color-text-tertiary);">Electricity</div>
            <div style="font-weight: 600;">${calc.emissions.electricity.toFixed(1)} kg</div>
          </div>
          <div>
            <div style="color: var(--color-text-tertiary);">AC</div>
            <div style="font-weight: 600;">${calc.emissions.ac.toFixed(1)} kg</div>
          </div>
          <div>
            <div style="color: var(--color-text-tertiary);">Meat</div>
            <div style="font-weight: 600;">${calc.emissions.meat.toFixed(1)} kg</div>
          </div>
          <div>
            <div style="color: var(--color-text-tertiary);">Fuel</div>
            <div style="font-weight: 600;">${calc.emissions.fuel.toFixed(1)} kg</div>
          </div>
        </div>
      </div>
    `).join('')}
  `;

  container.innerHTML = html;
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all history?')) {
    state.calculations = [];
    localStorage.removeItem('calculations');
    renderHistory();
  }
}

// ============================================
// TIPS RENDERING
// ============================================
function renderTips() {
  const container = document.getElementById('tipsContent');

  const tips = [
    {
      icon: '🚴',
      title: 'Choose Active Transport',
      description: 'Walk or cycle for short distances. It\'s good for your health and the planet!',
      impact: 'High Impact'
    },
    {
      icon: '🌞',
      title: 'Use Solar Energy',
      description: 'Install solar panels or use solar water heaters to reduce electricity emissions.',
      impact: 'High Impact'
    },
    {
      icon: '♻️',
      title: 'Reduce, Reuse, Recycle',
      description: 'Minimize waste by following the 3Rs. Every item recycled saves energy and emissions.',
      impact: 'Medium Impact'
    },
    {
      icon: '🥬',
      title: 'Eat Local & Seasonal',
      description: 'Choose locally grown, seasonal produce to reduce transportation emissions.',
      impact: 'Medium Impact'
    },
    {
      icon: '💧',
      title: 'Save Water',
      description: 'Water treatment and heating consume energy. Fix leaks and use water efficiently.',
      impact: 'Medium Impact'
    },
    {
      icon: '🏠',
      title: 'Improve Home Insulation',
      description: 'Better insulation reduces heating/cooling needs, saving energy and money.',
      impact: 'High Impact'
    },
    {
      icon: '📱',
      title: 'Digital Carbon Footprint',
      description: 'Stream in lower quality, delete old emails, and unsubscribe from unused services.',
      impact: 'Low Impact'
    },
    {
      icon: '🌳',
      title: 'Support Reforestation',
      description: 'Plant trees or support reforestation projects. Trees absorb CO₂ naturally.',
      impact: 'High Impact'
    }
  ];

  const html = `
    <div class="mb-xl text-center">
      <h2>Eco-Friendly Tips</h2>
      <p style="color: var(--color-text-secondary); max-width: 600px; margin: 0 auto;">
        Small changes in daily habits can make a big difference. Here are some practical tips to reduce your carbon footprint.
      </p>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
      ${tips.map((tip, index) => `
        <div class="tip-card" style="animation: fadeInUp 0.5s ease-out ${index * 0.05}s both;">
          <div class="tip-icon">${tip.icon}</div>
          <div class="tip-title">${tip.title}</div>
          <div class="tip-description">${tip.description}</div>
          <div style="margin-top: 0.75rem;">
            <span class="badge badge-${tip.impact.includes('High') ? 'success' : tip.impact.includes('Medium') ? 'warning' : 'info'}" style="font-size: 0.75rem;">
              ${tip.impact}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = html;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function clearForm() {
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.value = '';
  });
  document.getElementById('resultsContent').innerHTML = `
    <div class="text-center" style="padding: 3rem;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">🌍</div>
      <h3>Ready to Calculate</h3>
      <p style="color: var(--color-text-secondary);">Enter your daily values in the calculator tab and click Calculate.</p>
    </div>
  `;
}

// ============================================
// EXPORT FUNCTIONALITY (Future Enhancement)
// ============================================
function exportResults() {
  // TODO: Implement PDF/Image export
  alert('Export functionality coming soon!');
}
