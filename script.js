document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    let state = {
        expenses: [],
        budgets: {},
        groups: [],
        goals: [],
        categories: [
            { name: 'Food', icon: '🍔' },
            { name: 'Transport', icon: '🚗' },
            { name: 'Entertainment', icon: '🎬' },
            { name: 'Utilities', icon: '💡' },
            { name: 'Shopping', icon: '🛍️' },
            { name: 'Other', icon: '❓' }
        ],
        user: {
            name: 'You',
            streak: 0,
            points: 0,
            lastActiveDate: null,
            activeDates: [],
            achievements: {
                firstExpense: false,
                tenTransactions: false,
                firstBudget: false,
                longStreak: false,
                goalSetter: false
            }
        },
        currentView: 'dashboard',
        selectedGroupId: null,
        calendarDate: new Date(),
        currentTheme: 0,
        themes: ['', 'theme-dark', 'theme-sunset', 'theme-ocean', 'theme-forest'],
        quotes: [
            "A budget is telling your money where to go instead of wondering where it went.",
            "Don't save what is left after spending, but spend what is left after saving.",
            "The secret of getting ahead is getting started.",
            "Beware of little expenses. A small leak will sink a great ship.",
            "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make."
        ]
    };

    // --- DOM ELEMENTS ---
    const views = document.querySelectorAll('.view');
    const navItems = document.querySelectorAll('.nav-item');
    const headerTitle = document.getElementById('header-title');
    const headerGreeting = document.getElementById('header-greeting');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseModal = document.getElementById('expense-modal');
    const cancelExpenseBtn = document.getElementById('cancel-expense-btn');
    const expenseForm = document.getElementById('expense-form');
    const budgetForm = document.getElementById('budget-form');
    const budgetsList = document.getElementById('budgets-list');
    const editBudgetModal = document.getElementById('edit-budget-modal');
    const editBudgetForm = document.getElementById('edit-budget-form');
    const cancelEditBudgetBtn = document.getElementById('cancel-edit-budget-btn');
    const createGroupBtn = document.getElementById('create-group-btn');
    const createGroupModal = document.getElementById('create-group-modal');
    const createGroupForm = document.getElementById('create-group-form');
    const cancelCreateGroupBtn = document.getElementById('cancel-create-group-btn');
    const groupSelector = document.getElementById('group-selector');
    const streakNavItem = document.getElementById('streak-nav-item');
    const streakModal = document.getElementById('streak-modal');
    const cancelStreakBtn = document.getElementById('cancel-streak-btn');
    const streakCalendarContainerModal = document.getElementById('streak-calendar-container-modal');
    const calendarMonthYear = document.getElementById('calendar-month-year');
    const themeSwitcher = document.getElementById('theme-switcher');
    const quoteEl = document.getElementById('quote');
    const goalForm = document.getElementById('goal-form');
    const goalsList = document.getElementById('goals-list');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const customCategoryForm = document.getElementById('custom-category-form');
    const achievementsList = document.getElementById('achievements-list');
    const recentTransactions = document.getElementById('recent-transactions');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const contactForm = document.getElementById('contact-form');
    let spendingTrendChart;

    // --- NAVIGATION ---
    const navigateTo = (hash) => {
        const viewId = hash.substring(1) + '-view';
        const targetView = document.getElementById(viewId);
        
        if (!targetView) return;

        views.forEach(view => view.classList.remove('active'));
        targetView.classList.add('active');

        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href && href.startsWith('#')) {
                item.classList.toggle('active', href === hash);
            }
        });
        
        const title = hash.charAt(1).toUpperCase() + hash.slice(2);
        headerTitle.textContent = title;
        state.currentView = hash.substring(1);
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const hash = e.currentTarget.getAttribute('href');
            if (hash && hash.startsWith('#')) {
                navigateTo(hash);
            }
        });
    });
    
    // --- MODAL HANDLING ---
    const openModal = (modal) => {
        modal.classList.remove('hidden');
        setTimeout(() => modal.querySelector('.modal-content').classList.replace('scale-95', 'scale-100'), 10);
    };

    const closeModal = (modal) => {
        modal.querySelector('.modal-content').classList.replace('scale-100', 'scale-95');
        setTimeout(() => modal.classList.add('hidden'), 200);
    };
    
    // --- TOAST NOTIFICATION ---
    const showToast = (message, type = 'success') => {
        toastMessage.textContent = message;
        toast.className = `toast fixed bottom-5 right-5 text-white py-3 px-6 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // --- EVENT LISTENERS ---
    addExpenseBtn.addEventListener('click', () => {
        expenseForm.reset();
        document.getElementById('expense-id').value = '';
        openModal(expenseModal);
    });
    cancelExpenseBtn.addEventListener('click', () => closeModal(expenseModal));
    expenseModal.addEventListener('click', (e) => { if (e.target === expenseModal) closeModal(expenseModal); });

    cancelEditBudgetBtn.addEventListener('click', () => closeModal(editBudgetModal));
    editBudgetModal.addEventListener('click', (e) => { if (e.target === editBudgetModal) closeModal(editBudgetModal); });
    
    createGroupBtn.addEventListener('click', () => openModal(createGroupModal));
    cancelCreateGroupBtn.addEventListener('click', () => closeModal(createGroupModal));
    createGroupModal.addEventListener('click', (e) => { if (e.target === createGroupModal) closeModal(createGroupModal); });

    streakNavItem.addEventListener('click', (e) => { 
        e.preventDefault(); 
        state.calendarDate = new Date();
        renderStreakCalendar();
        openModal(streakModal); 
    });
    cancelStreakBtn.addEventListener('click', () => closeModal(streakModal));
    streakModal.addEventListener('click', (e) => { if (e.target === streakModal) closeModal(streakModal); });
    
    exportCsvBtn.addEventListener('click', () => {
        const headers = ['ID', 'Description', 'Amount', 'Category', 'Date', 'Recurring', 'GroupID'];
        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + state.expenses.map(e => [e.id, e.description, e.amount, e.category, e.date, e.recurring, e.groupId].join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "budgetpal_expenses.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Data exported!');
    });
    
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Message sent! We will get back to you soon.');
        contactForm.reset();
    });

    // --- DATA HANDLING & FORMS ---
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('expense-id').value;
        const expenseData = {
            description: document.getElementById('expense-description').value,
            amount: parseFloat(document.getElementById('expense-amount').value),
            category: document.getElementById('expense-category').value,
            recurring: document.getElementById('expense-recurring').checked,
            groupId: document.getElementById('expense-group-select').value || null,
            paidBy: 'You'
        };

        if (id) { // Editing existing expense
            const index = state.expenses.findIndex(ex => ex.id == id);
            state.expenses[index] = { ...state.expenses[index], ...expenseData };
            showToast('Expense updated successfully!');
        } else { // Adding new expense
            const newExpense = {
                id: Date.now(),
                date: new Date().toISOString(),
                ...expenseData
            };
            state.expenses.unshift(newExpense);
            updateStreak();
            showToast('Expense added successfully!');
        }
        
        expenseForm.reset();
        closeModal(expenseModal);
        renderAll();
    });

    budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('budget-category').value;
        const amount = parseFloat(document.getElementById('budget-amount').value);
        state.budgets[category] = amount;
        budgetForm.reset();
        showToast('Budget set!');
        renderAll();
    });

    editBudgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('edit-budget-category-hidden').value;
        const newAmount = parseFloat(document.getElementById('edit-budget-amount').value);
        if (category && !isNaN(newAmount)) {
            state.budgets[category] = newAmount;
            closeModal(editBudgetModal);
            showToast('Budget updated!');
            renderAll();
        }
    });

    createGroupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('group-name').value;
        const membersStr = document.getElementById('group-members').value;
        const members = ['You', ...membersStr.split(',').map(m => m.trim()).filter(m => m)];
        const newGroup = {
            id: 'group' + Date.now(),
            name: name,
            members: members
        };
        state.groups.push(newGroup);
        state.selectedGroupId = newGroup.id;
        createGroupForm.reset();
        closeModal(createGroupModal);
        showToast('Group created!');
        renderAll();
    });
    
    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newGoal = {
            id: 'goal' + Date.now(),
            name: document.getElementById('goal-name').value,
            targetAmount: parseFloat(document.getElementById('goal-amount').value),
            currentAmount: 0
        };
        state.goals.push(newGoal);
        goalForm.reset();
        showToast('New goal created!');
        renderAll();
    });
    
    customCategoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('custom-category-name').value;
        const icon = document.getElementById('custom-category-icon').value;
        if (name && icon) {
            state.categories.push({ name, icon });
            customCategoryForm.reset();
            showToast('Custom category added!');
            renderAll();
        }
    });

    budgetsList.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-budget-btn');
        const deleteButton = e.target.closest('.delete-budget-btn');

        if (editButton) {
            const category = editButton.dataset.category;
            document.getElementById('edit-budget-category-title').textContent = `For category: ${category}`;
            document.getElementById('edit-budget-amount').value = state.budgets[category];
            document.getElementById('edit-budget-category-hidden').value = category;
            openModal(editBudgetModal);
        }

        if (deleteButton) {
            const category = deleteButton.dataset.category;
            if (confirm(`Are you sure you want to delete the "${category}" budget?`)) {
                delete state.budgets[category];
                showToast('Budget deleted!', 'error');
                renderAll();
            }
        }
    });
    
    goalsList.addEventListener('click', (e) => {
        const addSavingsBtn = e.target.closest('.add-savings-btn');
        if (addSavingsBtn) {
            const goalId = addSavingsBtn.dataset.goalId;
            const amount = parseFloat(prompt("How much would you like to add to this goal?", "1000"));
            if (!isNaN(amount) && amount > 0) {
                const goal = state.goals.find(g => g.id === goalId);
                goal.currentAmount += amount;
                showToast(`₹${amount} added to ${goal.name}!`);
                renderAll();
            }
        }
    });

    groupSelector.addEventListener('change', (e) => {
        state.selectedGroupId = e.target.value;
        renderGroups();
    });
    
    recentTransactions.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-expense-btn');
        const deleteBtn = e.target.closest('.delete-expense-btn');

        if (editBtn) {
            const expenseId = editBtn.dataset.id;
            const expense = state.expenses.find(ex => ex.id == expenseId);
            document.getElementById('expense-id').value = expense.id;
            document.getElementById('expense-description').value = expense.description;
            document.getElementById('expense-amount').value = expense.amount;
            document.getElementById('expense-category').value = expense.category;
            document.getElementById('expense-recurring').checked = expense.recurring;
            document.getElementById('expense-group-select').value = expense.groupId || '';
            openModal(expenseModal);
        }

        if (deleteBtn) {
            const expenseId = deleteBtn.dataset.id;
            if (confirm('Are you sure you want to delete this expense?')) {
                state.expenses = state.expenses.filter(ex => ex.id != expenseId);
                showToast('Expense deleted!', 'error');
                renderAll();
            }
        }
    });
    
    // --- DATE & GREETING ---
    const setGreeting = () => {
        const date = new Date();
        const hours = date.getHours();
        let greeting = hours < 12 ? 'Good Morning!' : hours < 18 ? 'Good Afternoon!' : 'Good Evening!';
        const dateString = date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        headerGreeting.textContent = `${greeting} Today is ${dateString}.`;
    };

    // --- STREAK & ACHIEVEMENTS LOGIC ---
    const getKolkataDateString = (date) => new Date(date.toLocaleString("en-US", {timeZone: "Asia/Kolkata"})).toISOString().slice(0, 10);

    const updateStreak = () => {
        const todayKolkataStr = getKolkataDateString(new Date());

        if (state.user.lastActiveDate !== todayKolkataStr) {
            if (state.user.lastActiveDate) {
                const lastDate = new Date(state.user.lastActiveDate);
                const todayDate = new Date(todayKolkataStr);
                const diffDays = Math.ceil(Math.abs(todayDate - lastDate) / (1000 * 60 * 60 * 24));
                state.user.streak = (diffDays === 1) ? state.user.streak + 1 : 1;
            } else {
                state.user.streak = 1;
            }
            state.user.lastActiveDate = todayKolkataStr;
            if (!state.user.activeDates.includes(todayKolkataStr)) state.user.activeDates.push(todayKolkataStr);
            if (state.user.streak > 10) state.user.points += 10;
        }
    };
    
    const checkAchievements = () => {
        if (!state.user.achievements.firstExpense && state.expenses.length > 0) {
            state.user.achievements.firstExpense = true;
            showToast('Achievement Unlocked: First Expense!');
        }
        if (!state.user.achievements.tenTransactions && state.expenses.length >= 10) {
            state.user.achievements.tenTransactions = true;
            showToast('Achievement Unlocked: Transaction Pro!');
        }
        if (!state.user.achievements.firstBudget && Object.keys(state.budgets).length > 0) {
            state.user.achievements.firstBudget = true;
            showToast('Achievement Unlocked: Budget Setter!');
        }
        if (!state.user.achievements.longStreak && state.user.streak >= 7) {
            state.user.achievements.longStreak = true;
            showToast('Achievement Unlocked: Weekly Warrior!');
        }
        if (!state.user.achievements.goalSetter && state.goals.length > 0) {
            state.user.achievements.goalSetter = true;
            showToast('Achievement Unlocked: Dream Big!');
        }
    };

    // --- RENDERING FUNCTIONS ---
    const renderAll = () => {
        renderDashboard();
        renderBudgets();
        renderGoals();
        renderGroups();
        populateDropdowns();
        renderStreakCalendar();
        renderQuote();
        checkAchievements();
        renderAchievements();
    };

    const populateDropdowns = () => {
        const expenseGroupSelect = document.getElementById('expense-group-select');
        expenseGroupSelect.innerHTML = '<option value="">Personal Expense</option>';
        state.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            expenseGroupSelect.appendChild(option);
        });

        groupSelector.innerHTML = '';
        state.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            groupSelector.appendChild(option);
        });
        groupSelector.value = state.selectedGroupId;
        
        const budgetCategorySelect = document.getElementById('budget-category');
        const expenseCategorySelect = document.getElementById('expense-category');
        budgetCategorySelect.innerHTML = '';
        expenseCategorySelect.innerHTML = '';
        state.categories.forEach(cat => {
            const option1 = document.createElement('option');
            option1.textContent = `${cat.icon} ${cat.name}`;
            option1.value = cat.name;
            budgetCategorySelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.textContent = `${cat.icon} ${cat.name}`;
            option2.value = cat.name;
            expenseCategorySelect.appendChild(option2);
        });
        const overallOption = document.createElement('option');
        overallOption.textContent = '🎯 Overall';
        overallOption.value = 'Overall';
        budgetCategorySelect.prepend(overallOption);
    };

    const renderDashboard = () => {
        const personalExpenses = state.expenses.filter(ex => !ex.groupId);
        const totalSpent = personalExpenses.reduce((sum, ex) => sum + ex.amount, 0);
        document.getElementById('total-spent').textContent = `₹${totalSpent.toFixed(2)}`;
        
        const overallBudget = state.budgets['Overall'] || 0;
        document.getElementById('main-budget-status').textContent = `₹${totalSpent.toFixed(2)} / ₹${overallBudget.toFixed(2)}`;
        
        document.getElementById('daily-streak').textContent = `${state.user.streak}`;
        document.getElementById('savings-points').textContent = `${state.user.points}`;

        if (state.expenses.length === 0) {
            recentTransactions.innerHTML = '<p class="text-gray-500 text-center">No transactions yet. Add one to get started!</p>';
        } else {
            recentTransactions.innerHTML = '';
            state.expenses.slice(0, 10).forEach(ex => {
                const el = document.createElement('div');
                el.className = 'flex justify-between items-center';
                const recurringIcon = ex.recurring ? `<svg class="w-4 h-4 text-blue-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16"></path></svg>` : '';
                el.innerHTML = `
                    <div class="flex-1">
                        <p class="font-medium flex items-center">${ex.description} ${recurringIcon}</p>
                        <p class="text-sm text-gray-500">${ex.groupId ? state.groups.find(g=>g.id===ex.groupId)?.name : ex.category}</p>
                    </div>
                    <p class="font-bold text-red-500 mr-4">-₹${ex.amount.toFixed(2)}</p>
                    <div class="flex gap-2">
                        <button class="btn-icon edit-expense-btn" data-id="${ex.id}"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z"></path></svg></button>
                        <button class="btn-icon delete-expense-btn" data-id="${ex.id}"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                `;
                recentTransactions.appendChild(el);
            });
        }
        updateSpendingTrendChart();
    };

    const renderBudgets = () => {
        budgetsList.innerHTML = '';
        if (Object.keys(state.budgets).length === 0) {
            budgetsList.innerHTML = '<p class="text-gray-500 text-center col-span-full">You haven\'t set any budgets. Add one using the form above.</p>';
        } else {
            for (const category in state.budgets) {
                const budgetAmount = state.budgets[category];
                const spentAmount = state.expenses
                    .filter(ex => (category === 'Overall' ? true : ex.category === category) && !ex.groupId)
                    .reduce((sum, ex) => sum + ex.amount, 0);
                
                const percentage = budgetAmount > 0 ? Math.min((spentAmount / budgetAmount) * 100, 100) : 0;
                const color = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-indigo-500';

                const el = document.createElement('div');
                el.className = 'bg-white p-4 rounded-lg shadow card-interactive';
                el.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-semibold">${category}</h4>
                            <span class="text-sm font-medium text-gray-600">₹${spentAmount.toFixed(2)} / ₹${budgetAmount.toFixed(2)}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button class="btn-icon edit-budget-btn" data-category="${category}" title="Edit Budget"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z"></path></svg></button>
                            <button class="btn-icon delete-budget-btn" data-category="${category}" title="Delete Budget"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-4"><div class="${color} h-4 rounded-full" style="width: ${percentage}%"></div></div>
                    ${percentage >= 100 ? `<p class="text-red-600 text-sm mt-2 font-semibold">Budget exceeded!</p>` : ''}
                `;
                budgetsList.appendChild(el);
            }
        }
    };
    
    const renderGoals = () => {
        goalsList.innerHTML = '';
        if (state.goals.length === 0) {
            goalsList.innerHTML = '<p class="text-gray-500 text-center col-span-full">No savings goals yet. Create one to start saving!</p>';
        } else {
            state.goals.forEach(goal => {
                const percentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
                const el = document.createElement('div');
                el.className = 'bg-white p-4 rounded-lg shadow card-interactive';
                el.innerHTML = `
                    <h4 class="font-semibold">${goal.name}</h4>
                    <span class="text-sm font-medium text-gray-600">₹${goal.currentAmount.toFixed(2)} / ₹${goal.targetAmount.toFixed(2)}</span>
                    <div class="w-full bg-gray-200 rounded-full h-4 my-2"><div class="bg-green-500 h-4 rounded-full" style="width: ${percentage}%"></div></div>
                    <button class="add-savings-btn w-full mt-2 text-sm button-primary text-white font-bold py-2 px-3 rounded-lg" data-goal-id="${goal.id}">Add to Savings</button>
                `;
                goalsList.appendChild(el);
            });
        }
    };

    const renderGroups = () => {
        const groupContentArea = document.getElementById('group-content-area');
        const selectedGroup = state.groups.find(g => g.id === state.selectedGroupId);

        if (!selectedGroup) {
            groupContentArea.innerHTML = `<div class="text-center py-12"><h3 class="text-xl font-semibold text-gray-700">No group selected</h3><p class="text-gray-500 mt-2">Create a new group or select one from the dropdown to get started.</p></div>`;
            return;
        }

        const groupExpenses = state.expenses.filter(ex => ex.groupId === selectedGroup.id);
        const totalGroupSpent = groupExpenses.reduce((sum, ex) => sum + ex.amount, 0);
        const members = selectedGroup.members;
        const sharePerPerson = members.length > 0 ? totalGroupSpent / members.length : 0;

        const paidByMember = {};
        members.forEach(member => paidByMember[member] = 0);
        groupExpenses.forEach(ex => {
            if(paidByMember.hasOwnProperty(ex.paidBy)) paidByMember[ex.paidBy] += ex.amount;
        });

        const balances = {};
        members.forEach(member => { balances[member] = paidByMember[member] - sharePerPerson; });

        const settlements = [];
        const debtors = members.filter(m => balances[m] < 0);
        const creditors = members.filter(m => balances[m] > 0);
        
        debtors.forEach(debtor => {
            let amountOwed = -balances[debtor];
            creditors.forEach(creditor => {
                if (amountOwed <= 0) return;
                let amountCanReceive = balances[creditor];
                if (amountCanReceive > 0) {
                    const payment = Math.min(amountOwed, amountCanReceive);
                    settlements.push({ from: debtor, to: creditor, amount: payment });
                    balances[debtor] += payment;
                    balances[creditor] -= payment;
                    amountOwed -= payment;
                }
            });
        });
        
        let balancesHtml = '';
        if (settlements.length > 0) {
            settlements.forEach(s => {
                if (s.amount > 0.01) {
                    balancesHtml += `<div class="bg-gray-100 p-3 rounded-md flex justify-between items-center"><span><span class="font-bold">${s.from}</span> owes <span class="font-bold">${s.to}</span></span> <span class="font-bold text-green-600">₹${s.amount.toFixed(2)}</span></div>`;
                }
            });
        }
        if (balancesHtml === '') balancesHtml = `<p class="text-gray-500">Everyone is settled up!</p>`;

        let transactionsHtml = '';
        if(groupExpenses.length > 0) {
            groupExpenses.forEach(ex => {
                transactionsHtml += `<div class="flex justify-between items-center"><div><p class="font-medium">${ex.description}</p><p class="text-sm text-gray-500">Paid by ${ex.paidBy}</p></div><p class="font-bold">-₹${ex.amount.toFixed(2)}</p></div>`;
            });
        } else {
            transactionsHtml = `<p class="text-gray-500">No transactions for this group yet.</p>`;
        }

        groupContentArea.innerHTML = `
            <h2 class="text-2xl font-bold mb-6 text-center" id="group-view-title">Group: ${selectedGroup.name}</h2>
            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 class="text-lg font-semibold mb-4">Balances (Who Owes Whom)</h3>
                    <div class="space-y-3">${balancesHtml}</div>
                </div>
                <div>
                    <h3 class="text-lg font-semibold mb-4">Group Transactions</h3>
                    <div class="space-y-4 overflow-y-auto max-h-64">${transactionsHtml}</div>
                </div>
            </div>
        `;
    };

    const renderStreakCalendar = () => {
        const date = new Date();
        const todayKolkataStr = getKolkataDateString(date);
        const currentMonth = date.getMonth();
        const currentYear = date.getFullYear();

        calendarMonthYear.textContent = `${date.toLocaleString('default', { month: 'long' })} ${currentYear}`;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        let calendarHtml = `<div class="grid grid-cols-7 gap-2 text-center text-xs text-gray-500 font-bold">`;
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => calendarHtml += `<div>${day}</div>`);
        calendarHtml += `</div>`;
        calendarHtml += `<div class="grid grid-cols-7 gap-2 mt-2">`;

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarHtml += `<div></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            let classes = 'calendar-day';
            if (state.user.activeDates.includes(dateStr)) {
                classes += ' bg-green-200 text-green-800';
            }
            if (dateStr === todayKolkataStr) {
                classes += ' bg-indigo-500 text-white font-bold';
            }
            calendarHtml += `<div class="${classes}">${day}</div>`;
        }

        calendarHtml += `</div>`;
        streakCalendarContainerModal.innerHTML = calendarHtml;
    };
    
    const renderAchievements = () => {
        const achievementsMap = {
            firstExpense: { title: 'First Expense', icon: '🎉', desc: 'Log your first transaction' },
            tenTransactions: { title: 'Transaction Pro', icon: '💼', desc: 'Log 10 transactions' },
            firstBudget: { title: 'Budget Setter', icon: '🎯', desc: 'Create your first budget' },
            longStreak: { title: 'Weekly Warrior', icon: '🔥', desc: 'Maintain a 7-day streak' },
            goalSetter: { title: 'Dream Big', icon: '🚀', desc: 'Create a savings goal' }
        };
        
        achievementsList.innerHTML = '';
        for (const key in state.user.achievements) {
            const unlocked = state.user.achievements[key];
            const details = achievementsMap[key];
            const el = document.createElement('div');
            el.className = `bg-white p-4 rounded-lg shadow text-center card-interactive ${!unlocked ? 'achievement-locked' : ''}`;
            el.innerHTML = `
                <div class="text-4xl">${details.icon}</div>
                <h4 class="font-bold mt-2">${details.title}</h4>
                <p class="text-sm text-gray-500">${details.desc}</p>
            `;
            achievementsList.appendChild(el);
        }
    };

    // --- CHART.JS ---
    const initCharts = () => {
        const trendCtx = document.getElementById('spending-trend-chart').getContext('2d');
        spendingTrendChart = new Chart(trendCtx, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Total Spent', data: [], backgroundColor: 'rgba(79, 70, 229, 0.7)' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    const updateSpendingTrendChart = () => {
        const monthlySpending = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = `${d.getFullYear()}-${monthNames[d.getMonth()]}`;
            monthlySpending[monthKey] = 0;
        }

        state.expenses.filter(ex => !ex.groupId).forEach(ex => {
            const d = new Date(ex.date);
            const monthKey = `${d.getFullYear()}-${monthNames[d.getMonth()]}`;
            if (monthlySpending.hasOwnProperty(monthKey)) {
                monthlySpending[monthKey] += ex.amount;
            }
        });

        spendingTrendChart.data.labels = Object.keys(monthlySpending);
        spendingTrendChart.data.datasets[0].data = Object.values(monthlySpending);
        spendingTrendChart.update();
    };

    // --- THEME & QUOTE ---
    themeSwitcher.addEventListener('click', () => {
        state.currentTheme = (state.currentTheme + 1) % state.themes.length;
        document.body.className = state.themes[state.currentTheme];
    });

    const renderQuote = () => {
        const randomIndex = Math.floor(Math.random() * state.quotes.length);
        quoteEl.textContent = state.quotes[randomIndex];
    };
    
    // --- INITIALIZATION ---
    const init = () => {
        setGreeting();
        initCharts();
        navigateTo('#dashboard');
        renderAll();
    };

    init();
});