document.addEventListener('DOMContentLoaded', () => {
  // Transaction Management
  const transactionList = document.getElementById('transaction-list');
  const totalIncomeElement = document.getElementById('total-income');
  const totalExpensesElement = document.getElementById('total-expenses');
  const totalSavingsElement = document.getElementById('total-savings');
  const viewPieChartButton = document.getElementById('view-pie-chart');
  const pieChartContainer = document.getElementById('pie-chart-container');
  const pieChartCanvas = document.getElementById('pie-chart');
  const pieChartLegend = document.getElementById('pie-chart-legend');

  let myPieChart;

  // Export to CSV
  function exportToCSV() {
    const rows = [];
    const headers = ['Description', 'Amount', 'Category'];
    
    // Add headers
    rows.push(headers.join(','));

    // Add transaction data
    document.querySelectorAll('#transaction-list tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      const rowData = Array.from(cells).map(cell => cell.textContent.replace('$', ''));
      rows.push(rowData.join(','));
    });

    // Create CSV file and download
    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link); // Clean up
  }
  document.getElementById('export-csv').addEventListener('click', exportToCSV);

  // Export to PDF
  async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Transaction Report', 10, 10);
    
    doc.setFontSize(14);
    const headers = ['Description', 'Amount', 'Category'];
    const rows = [];
    
    document.querySelectorAll('#transaction-list tr').forEach(row => {
      const cells = row.querySelectorAll('td');
      const rowData = Array.from(cells).map(cell => cell.textContent.replace('$', ''));
      rows.push(rowData);
    });

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 30
    });

    doc.save('transactions.pdf');
  }
  document.getElementById('export-pdf').addEventListener('click', exportToPDF);

  // Initialize transactions
  const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

  if (transactions.length === 0) {
    const sampleTransaction = { id: Date.now(), description: "Sample Description", amount: 100, category: "income" };
    transactions.push(sampleTransaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }

  // Add existing transactions to DOM and initialize chart
  transactions.forEach(transaction => addTransactionToDOM(transaction));
  updateSummary();
  createPieChart();

  // Handle form submission
  document.getElementById('transaction-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;

    if (!description || isNaN(amount) || !category) {
      alert('Please fill out all fields correctly.');
      return;
    }

    const income = transactions.filter(t => t.category === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.category === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const savings = income - expenses;

    if (category === 'expense' && amount > savings) {
      alert('Insufficient savings! You cannot add an expense that exceeds your current savings.');
      return;
    }

    const transaction = {
      id: Date.now(),
      description,
      amount,
      category
    };

    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    addTransactionToDOM(transaction);
    updateSummary();
    createPieChart();

    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('category').value = '';
  });

  // Add transaction to DOM
  function addTransactionToDOM(transaction) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', transaction.id);

    row.innerHTML = `
      <td>${transaction.description}</td>
      <td>$${transaction.amount.toFixed(2)}</td>
      <td>${transaction.category}</td>
      <td><button class="delete-btn">Delete</button></td>
    `;

    transactionList.appendChild(row);

    row.querySelector('.delete-btn').addEventListener('click', function() {
      const transactionId = parseInt(row.getAttribute('data-id'));
      const index = transactions.findIndex(t => t.id === transactionId);
      if (index !== -1) {
        transactions.splice(index, 1);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        row.remove();
        updateSummary();
        createPieChart();
      }
    });
  }

  // Update summary
  function updateSummary() {
    const income = transactions.filter(t => t.category === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.category === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const savings = income - expenses;

    totalIncomeElement.textContent = `$${income.toFixed(2)}`;
    totalExpensesElement.textContent = `$${expenses.toFixed(2)}`;
    totalSavingsElement.textContent = `$${savings.toFixed(2)}`;
  }

  // Create pie chart
  function createPieChart() {
    const income = transactions.filter(t => t.category === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions.filter(t => t.category === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const savings = income - expenses;

    const ctx = pieChartCanvas.getContext('2d');
    const data = {
      labels: ['Income', 'Expenses', 'Savings'],
      datasets: [{
        data: [income, expenses, savings],
        backgroundColor: ['#36A2EB', '#FF6384', '#4BC0C0'],
        borderColor: '#fff',
        borderWidth: 1
      }]
    };

    const options = {
      animation: {
        animateRotate: true,
        animateScale: true
      },
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };

    if (myPieChart) {
      myPieChart.destroy(); // Destroy previous chart instance
    }

    myPieChart = new Chart(ctx, {
      type: 'pie',
      data: data,
      options: options
    });

    pieChartLegend.innerHTML = `
      <ul>
        <li><span style="background-color: #36A2EB;"></span> Income</li>
        <li><span style="background-color: #FF6384;"></span> Expenses</li>
        <li><span style="background-color: #4BC0C0;"></span> Savings</li>
      </ul>
    `;
  }

  // Handle pie chart view button click
  viewPieChartButton.addEventListener('click', () => {
    pieChartContainer.style.display = 'block';
    viewPieChartButton.classList.add('animate-button'); // Add animation class
  });

  // Theme Management
  const themeSelector = document.getElementById('theme-selector');
  
  // Apply saved theme if exists
  const savedTheme = localStorage.getItem('theme') || 'default';
  document.body.classList.add(`${savedTheme}-theme`);
  themeSelector.value = savedTheme;
  
  // Change theme on selection
  themeSelector.addEventListener('change', function() {
    const selectedTheme = this.value;
    
    // Remove all theme classes
    document.body.classList.remove('default-theme', 'dark-theme', 'light-theme');
    
    // Add selected theme class
    document.body.classList.add(`${selectedTheme}-theme`);
    
    // Save theme to localStorage
    localStorage.setItem('theme', selectedTheme);
  });

  // Challenge Management
  const challengeForm = document.getElementById('challenge-form');
  const challengesList = document.getElementById('challenges-list');
  let challenges = JSON.parse(localStorage.getItem('challenges')) || [];

  // Display existing challenges
  function displayChallenges() {
      challengesList.innerHTML = '';
      challenges.forEach(challenge => {
          const challengeDiv = document.createElement('div');
          challengeDiv.className = 'challenge';
          challengeDiv.innerHTML = `
              <h3>${challenge.name}</h3>
              <p>Goal: $${challenge.goal}</p>
              <p>Progress: $${challenge.progress}</p>
              <button onclick="updateChallenge('${challenge.id}')">Update Progress</button>
              <button onclick="deleteChallenge('${challenge.id}')">Delete Progress</button>
          `;
          challengesList.appendChild(challengeDiv);
      });
  }

  // Create a new challenge
  challengeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('challenge-name').value;
      const goal = parseFloat(document.getElementById('challenge-goal').value);
      const id = Date.now().toString();
      const challenge = { id, name, goal, progress: 0 };
      challenges.push(challenge);
      localStorage.setItem('challenges', JSON.stringify(challenges));
      displayChallenges();
      challengeForm.reset();
  });

  // Update challenge progress
  window.updateChallenge = function(id) {
      const challenge = challenges.find(ch => ch.id === id);
      const amount = parseFloat(prompt('Enter amount to add to progress:'));
      if (!isNaN(amount)) {
          challenge.progress += amount;
          localStorage.setItem('challenges', JSON.stringify(challenges));
          displayChallenges();
      }
  }

  // Delete challenge progress
  window.deleteChallenge = function(id) {
      const challenge = challenges.find(ch => ch.id === id);
      if (confirm('Are you sure you want to delete this challenge progress?')) {
          challenge.progress = 0;
          localStorage.setItem('challenges', JSON.stringify(challenges));
          displayChallenges();
      }
  }

  displayChallenges();
});
