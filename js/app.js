// Main Application Logic

const App = {
    currentUser: null,
    currentRole: null,
    allUsers: [],
    allVehicles: [],
    allRequests: [],
    seatsNeeded: 1,

    // Initialize app
    async init() {
        this.bindEvents();
        await this.checkAuth();
    },

    // Check if user is already logged in
    async checkAuth() {
        const email = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_EMAIL);
        if (email) {
            this.showLoading();
            try {
                const user = await API.users.get(email);
                if (user) {
                    this.currentUser = user;
                    // Normalize role value (trim whitespace, lowercase)
                    const role = (user.role || '').toString().trim().toLowerCase();
                    console.log('User loaded:', user, 'Role:', role); // Debug log

                    // If user has a saved role, go to appropriate screen
                    if (role === 'driver' || role === 'passenger' || role === 'admin') {
                        this.currentRole = role;
                        this.currentUser.role = role; // Update with normalized value
                        await this.goToRoleScreen(role);
                    } else {
                        this.showRoleScreen();
                    }
                } else {
                    await API.users.create({ email });
                    this.currentUser = { email, role: '', isAdmin: false };
                    this.showRoleScreen();
                }
            } catch (error) {
                console.error('Auth error:', error);
                this.showToast('Error loading profile', 'error');
                this.showLoginScreen();
            }
            this.hideLoading();
        } else {
            this.showLoginScreen();
        }
    },

    // Navigate to role-specific screen based on user state
    async goToRoleScreen(role) {
        if (role === 'driver') {
            // Check if driver has vehicle registered
            const vehicle = await API.vehicles.get(this.currentUser.email);
            if (vehicle && vehicle.vehicleType) {
                // Existing driver - go to dashboard
                await this.showDashboard();
            } else {
                // New driver - go to setup
                await this.loadDriverData();
                this.showScreen('driver-panel');
            }
        } else if (role === 'passenger') {
            // Check passenger's request status
            const requests = await API.requests.getByPassenger(this.currentUser.email);
            const activeRequest = requests.find(r => r.status === 'pending' || r.status === 'approved' || r.status === 'confirmed');

            if (activeRequest) {
                // Has active request - go to dashboard to see status
                await this.showDashboard();
            } else if (this.currentUser.name) {
                // Existing passenger with no request - go to browse vehicles
                await this.showDashboard();
            } else {
                // New passenger - go to setup
                await this.loadPassengerData();
                this.showScreen('passenger-panel');
            }
        } else if (role === 'admin') {
            await this.loadAdminData();
            this.showScreen('admin-panel');
        }
    },

    // Bind all event listeners
    bindEvents() {
        // Login
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('email-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Logout - bind all logout buttons
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleLogout());
        });

        // Role selection
        document.querySelectorAll('.role-card').forEach(card => {
            card.addEventListener('click', () => this.handleRoleSelect(card.dataset.role));
        });

        // Back buttons
        document.getElementById('back-to-roles-btn').addEventListener('click', () => this.showRoleScreen());
        document.getElementById('driver-back-btn').addEventListener('click', () => this.showDashboard());
        document.getElementById('passenger-back-btn').addEventListener('click', () => this.showRoleScreen());
        document.getElementById('admin-back-btn').addEventListener('click', () => this.showRoleScreen());
        document.getElementById('profile-btn').addEventListener('click', () => this.showProfilePanel());
        document.getElementById('refresh-btn').addEventListener('click', () => this.refreshDashboard());

        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabClick(e));
        });

        // Driver panel
        document.getElementById('save-vehicle-btn').addEventListener('click', () => this.saveVehicle());
        document.getElementById('total-seats').addEventListener('input', () => this.updateAvailableSeats());
        document.getElementById('family-members').addEventListener('input', () => this.updateAvailableSeats());

        // Passenger panel
        document.getElementById('save-passenger-btn').addEventListener('click', () => this.savePassengerSeats());

        // Request modal
        document.getElementById('cancel-request-btn').addEventListener('click', () => this.hideModal('request-modal'));
        document.getElementById('submit-request-btn').addEventListener('click', () => this.submitRequest());

        // Edit user modal
        document.getElementById('cancel-edit-user-btn').addEventListener('click', () => this.hideModal('edit-user-modal'));
        document.getElementById('save-edit-user-btn').addEventListener('click', () => this.saveEditUser());
        document.getElementById('delete-user-btn').addEventListener('click', () => this.deleteEditUser());

        // Contact modal
        document.getElementById('close-contact-btn').addEventListener('click', () => this.hideModal('contact-modal'));

        // Admin exports
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportCSV());
        document.getElementById('export-pdf-btn').addEventListener('click', () => this.exportPDF());
    },

    // Handle login
    async handleLogin() {
        const email = document.getElementById('email-input').value.trim().toLowerCase();

        if (!email || !this.isValidEmail(email)) {
            this.showToast('Please enter a valid email', 'error');
            return;
        }

        this.showLoading();

        try {
            let user = await API.users.get(email);

            if (!user) {
                await API.users.create({ email });
                user = { email, role: '', isAdmin: false };
            }

            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_EMAIL, email);
            this.currentUser = user;

            // Normalize role and check if user has existing role
            const role = (user.role || '').toString().trim().toLowerCase();

            if (role === 'driver' || role === 'passenger' || role === 'admin') {
                this.currentRole = role;
                this.currentUser.role = role;
                this.showToast('Welcome back!', 'success');
                await this.goToRoleScreen(role);
            } else {
                this.showToast('Welcome!', 'success');
                this.showRoleScreen();
            }
        } catch (error) {
            this.showToast('Login failed: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Handle logout
    handleLogout() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_EMAIL);
        this.currentUser = null;
        this.currentRole = null;
        document.getElementById('email-input').value = '';
        this.showLoginScreen();
        this.showToast('Logged out', 'success');
    },

    // Handle role selection
    async handleRoleSelect(role) {
        this.showLoading();

        try {
            // Check if changing FROM driver role
            if (this.currentUser.role === 'driver' && role !== 'driver') {
                const canChange = await this.checkDriverRoleChange();
                if (!canChange) {
                    this.hideLoading();
                    return;
                }

                // Update vehicle status to not-bringing (hides it from vehicle list)
                await API.vehicles.update(this.currentUser.email, { status: 'not-bringing' });
            }

            // Check if changing FROM passenger role with active ride
            if (this.currentUser.role === 'passenger' && role !== 'passenger') {
                const canChange = await this.checkPassengerRoleChange();
                if (!canChange) {
                    this.hideLoading();
                    return;
                }
            }

            await API.users.update(this.currentUser.email, { role });
            this.currentUser.role = role;
            this.currentRole = role;

            if (role === 'driver') {
                await this.loadDriverData();
                this.showScreen('driver-panel');
            } else if (role === 'passenger') {
                await this.loadPassengerData();
                this.showScreen('passenger-panel');
            } else if (role === 'admin') {
                await this.loadAdminData();
                this.showScreen('admin-panel');
            }

            this.showToast('Role changed successfully', 'success');
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Check if driver can change role (no active passengers/requests)
    async checkDriverRoleChange() {
        const requests = await API.requests.getByDriver(this.currentUser.email);
        const approvedPassengers = requests.filter(r => r.status === 'approved' || r.status === 'confirmed');
        const pendingRequests = requests.filter(r => r.status === 'pending');

        if (approvedPassengers.length > 0 || pendingRequests.length > 0) {
            let message = '⚠️ Cannot change role. You have:\n\n';

            if (approvedPassengers.length > 0) {
                message += `• ${approvedPassengers.length} approved passenger(s)\n`;
            }
            if (pendingRequests.length > 0) {
                message += `• ${pendingRequests.length} pending request(s)\n`;
            }

            message += '\nPlease remove all passengers and reject all pending requests first.';

            alert(message);
            return false;
        }

        return true;
    },

    // Check if passenger can change role (no active ride)
    async checkPassengerRoleChange() {
        const requests = await API.requests.getByPassenger(this.currentUser.email);
        const activeRide = requests.find(r => r.status === 'approved' || r.status === 'confirmed' || r.status === 'pending');

        if (activeRide) {
            const driver = this.allUsers.find(u => u.email === activeRide.driverEmail) || {};
            const statusText = activeRide.status === 'pending' ? 'pending request' : 'confirmed ride';
            alert(`⚠️ Cannot change role. You have a ${statusText} with ${driver.name || activeRide.driverEmail}.\n\nPlease cancel/leave the ride first and inform the driver about your decision.`);
            return false;
        }

        return true;
    },

    // Show profile panel based on role
    showProfilePanel() {
        if (this.currentRole === 'driver') {
            this.showScreen('driver-panel');
            this.loadDriverData();
        } else if (this.currentRole === 'passenger') {
            this.showScreen('passenger-panel');
        } else if (this.currentRole === 'admin') {
            this.showScreen('admin-panel');
        }
    },

    // Refresh dashboard
    async refreshDashboard() {
        this.showLoading();
        try {
            await this.loadDashboardData();
            this.showToast('Refreshed!', 'success');
        } catch (error) {
            this.showToast('Error refreshing', 'error');
        }
        this.hideLoading();
    },

    // Load driver data
    async loadDriverData() {
        try {
            // Set profile info
            document.getElementById('driver-email').textContent = this.currentUser.email;
            document.getElementById('driver-name').textContent = this.currentUser.name || 'Driver';

            // Always prepopulate name and phone if available
            document.getElementById('driver-name-input').value = this.currentUser.name || '';
            document.getElementById('driver-phone').value = this.currentUser.phone || '';

            const vehicle = await API.vehicles.get(this.currentUser.email);
            const requests = await API.requests.getByDriver(this.currentUser.email);
            const approvedRequests = requests.filter(r => r.status === 'approved' || r.status === 'confirmed');
            const assignedSeats = approvedRequests.reduce((sum, r) => sum + (parseInt(r.seatsRequested) || 0), 0);

            if (vehicle) {
                document.getElementById('vehicle-type').value = vehicle.vehicleType || '';
                document.getElementById('total-seats').value = vehicle.totalSeats || 4;
                document.getElementById('family-members').value = vehicle.familyMembers || 0;
                document.getElementById('driver-status').value = vehicle.status || 'open';

                // Store assigned seats for validation
                this.assignedPassengerSeats = assignedSeats;
            } else {
                // Set defaults for new drivers
                document.getElementById('vehicle-type').value = '';
                document.getElementById('total-seats').value = 4;
                document.getElementById('family-members').value = 0;
                document.getElementById('driver-status').value = 'open';
                this.assignedPassengerSeats = 0;
            }
            this.updateAvailableSeats();
        } catch (error) {
            console.error('Error loading driver data:', error);
        }
    },

    // Load approved passengers for driver
    async loadDriverPassengers() {
        try {
            const requests = await API.requests.getByDriver(this.currentUser.email);
            const users = await API.users.getAll();
            const approvedRequests = requests.filter(r => r.status === 'approved' || r.status === 'confirmed');

            this.renderDriverPassengers(approvedRequests, users);

            // Update badge
            const badge = document.getElementById('driver-passengers-badge');
            if (approvedRequests.length > 0) {
                badge.textContent = approvedRequests.length;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error loading driver passengers:', error);
        }
    },

    // Render approved passengers list
    renderDriverPassengers(requests, users) {
        const container = document.getElementById('driver-passengers-list');

        if (!requests || requests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>No passengers yet</h3>
                    <p>Approved passengers will appear here</p>
                </div>
            `;
            return;
        }

        const totalSeats = requests.reduce((sum, r) => sum + (parseInt(r.seatsRequested) || 0), 0);

        container.innerHTML = `
            <div class="info-box" style="margin-bottom: 1rem;">
                <p style="text-align: center; margin: 0;">
                    <strong>${requests.length}</strong> passenger(s) • <strong>${totalSeats}</strong> seat(s) booked
                </p>
            </div>
        ` + requests.map(request => {
            const passenger = users.find(u => u.email === request.passengerEmail) || {};
            return `
                <div class="request-card">
                    <div class="request-card-header">
                        <h4>${passenger.name || request.passengerEmail}</h4>
                        <span class="request-status status-${request.status}">${request.status}</span>
                    </div>
                    <div class="request-card-details">
                        <p>🎫 Seats: <strong>${request.seatsRequested}</strong></p>
                        <p>✉️ ${request.passengerEmail}</p>
                        ${passenger.phone ? `<p>📞 ${passenger.phone}</p>` : ''}
                    </div>
                    <div class="request-card-actions">
                        <button class="btn btn-secondary btn-small" onclick="App.showContactModal('${request.passengerEmail}')">📞 Contact</button>
                        <button class="btn btn-danger btn-small" onclick="App.removePassenger('${request.id}', '${passenger.name || request.passengerEmail}')">Remove</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Remove a passenger from the car
    async removePassenger(requestId, passengerName) {
        if (!confirm(`⚠️ IMPORTANT: Please contact ${passengerName} first to inform them.\n\nAre you sure you want to remove ${passengerName} from your car? They will need to request again.`)) return;

        this.showLoading();

        try {
            await API.requests.delete(requestId);
            await this.loadDriverPassengers();
            await this.loadDriverRequests();
            // Reload to update assigned seats count
            await this.loadDriverData();
            this.showToast('Passenger removed. Please contact them to inform.', 'success');
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Load passenger data
    async loadPassengerData() {
        document.getElementById('passenger-email').textContent = this.currentUser.email;
        document.getElementById('passenger-name').textContent = this.currentUser.name || 'Passenger';

        // Always prepopulate all fields with saved data or defaults
        document.getElementById('passenger-name-input').value = this.currentUser.name || '';
        document.getElementById('passenger-phone').value = this.currentUser.phone || '';
        document.getElementById('seats-needed').value = this.currentUser.seatsNeeded || 1;
    },

    // Load driver requests
    async loadDriverRequests() {
        try {
            const requests = await API.requests.getByDriver(this.currentUser.email);
            const users = await API.users.getAll();
            this.renderDriverRequests(requests, users);

            // Update badge
            const pendingCount = requests.filter(r => r.status === 'pending').length;
            const badge = document.getElementById('driver-requests-badge');
            if (pendingCount > 0) {
                badge.textContent = pendingCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error loading driver requests:', error);
        }
    },

    // Render driver requests
    renderDriverRequests(requests, users) {
        const container = document.getElementById('driver-requests-list');

        if (!requests || requests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No requests yet</h3>
                    <p>Seat requests from passengers will appear here</p>
                </div>
            `;
            return;
        }

        container.innerHTML = requests.map(request => {
            const passenger = users.find(u => u.email === request.passengerEmail) || {};
            return `
                <div class="request-card">
                    <div class="request-card-header">
                        <h4>${passenger.name || request.passengerEmail}</h4>
                        <span class="request-status status-${request.status}">${request.status}</span>
                    </div>
                    <div class="request-card-details">
                        <p>🎫 Seats requested: <strong>${request.seatsRequested}</strong></p>
                        <p>✉️ ${request.passengerEmail}</p>
                        ${passenger.phone ? `<p>📞 ${passenger.phone}</p>` : ''}
                    </div>
                    ${request.status === 'pending' ? `
                        <div class="request-card-actions">
                            <button class="btn btn-danger btn-small" onclick="App.updateRequestStatus('${request.id}', 'rejected')">Decline</button>
                            <button class="btn btn-success btn-small" onclick="App.updateRequestStatus('${request.id}', 'approved')">Approve</button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    // Update request status
    async updateRequestStatus(requestId, status) {
        this.showLoading();

        try {
            await API.requests.update(requestId, { status });
            // Reload both driver requests and dashboard data
            await this.loadDriverRequests();
            await this.loadDashboardData();
            this.showToast('Request ' + status, 'success');
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Update available seats display
    updateAvailableSeats() {
        const totalSeats = parseInt(document.getElementById('total-seats').value) || 0;
        const familyMembers = parseInt(document.getElementById('family-members').value) || 0;
        const assignedSeats = this.assignedPassengerSeats || 0;
        const available = Math.max(0, totalSeats - familyMembers - assignedSeats);

        document.getElementById('available-seats').textContent = available;

        // Show warning if seats are assigned to passengers
        const familyInput = document.getElementById('family-members');
        if (assignedSeats > 0 && familyMembers + assignedSeats > totalSeats) {
            familyInput.style.borderColor = 'var(--danger)';
        } else {
            familyInput.style.borderColor = '';
        }

        // Auto-update status based on available seats
        const statusSelect = document.getElementById('driver-status');
        if (available === 0) {
            statusSelect.value = 'full';
        } else if (statusSelect.value === 'full' && available > 0) {
            statusSelect.value = 'open';
        }
    },

    // Save vehicle details
    async saveVehicle() {
        const name = document.getElementById('driver-name-input').value.trim();
        const phone = document.getElementById('driver-phone').value.trim();
        const vehicleType = document.getElementById('vehicle-type').value;
        const totalSeats = parseInt(document.getElementById('total-seats').value) || 4;
        const familyMembers = parseInt(document.getElementById('family-members').value) || 0;
        const status = document.getElementById('driver-status').value;
        const assignedSeats = this.assignedPassengerSeats || 0;

        // Validation
        if (!name) {
            this.showToast('Please enter your name', 'error');
            return;
        }
        if (!vehicleType) {
            this.showToast('Please select vehicle type', 'error');
            return;
        }
        if (familyMembers > totalSeats) {
            this.showToast('Family members cannot exceed total seats', 'error');
            return;
        }

        // Check if adding family members would displace assigned passengers
        if (assignedSeats > 0 && familyMembers + assignedSeats > totalSeats) {
            this.showToast(
                `Cannot add family members. ${assignedSeats} seat(s) already assigned to passengers. Please remove passengers first from the "My Passengers" tab.`,
                'error'
            );
            return;
        }

        this.showLoading();

        try {
            // Update user profile
            await API.users.update(this.currentUser.email, { name, phone });
            this.currentUser.name = name;
            this.currentUser.phone = phone;

            // Save vehicle
            await API.vehicles.create({
                driverEmail: this.currentUser.email,
                vehicleType,
                totalSeats,
                familyMembers,
                status
            });

            this.showToast('Saved successfully!', 'success');
            await this.showDashboard();
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Save passenger seats needed
    async savePassengerSeats() {
        const name = document.getElementById('passenger-name-input').value.trim();
        const phone = document.getElementById('passenger-phone').value.trim();
        const seatsNeeded = parseInt(document.getElementById('seats-needed').value) || 1;

        if (!name) {
            this.showToast('Please enter your name', 'error');
            return;
        }

        this.showLoading();

        try {
            await API.users.update(this.currentUser.email, { name, phone, seatsNeeded });
            this.currentUser.name = name;
            this.currentUser.phone = phone;
            this.currentUser.seatsNeeded = seatsNeeded;

            this.showToast('Profile saved!', 'success');
            await this.showDashboard();
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Show dashboard
    async showDashboard() {
        this.showLoading();

        try {
            await this.loadDashboardData();
            this.showScreen('dashboard-screen');
        } catch (error) {
            this.showToast('Error loading dashboard', 'error');
        }

        this.hideLoading();
    },

    // Load dashboard data
    async loadDashboardData() {
        const [vehicles, requests, users] = await Promise.all([
            API.vehicles.getAll(),
            API.requests.getAll(),
            API.users.getAll()
        ]);

        this.allVehicles = vehicles || [];
        this.allRequests = requests || [];
        this.allUsers = users || [];

        this.renderVehicles();
        this.renderMyRequests();

        // Show My Passengers tab for drivers
        if (this.currentRole === 'driver') {
            document.getElementById('dashboard-passengers-tab-btn').classList.remove('hidden');
            this.renderDashboardPassengers();
        } else {
            document.getElementById('dashboard-passengers-tab-btn').classList.add('hidden');
        }
    },

    // Render approved passengers in dashboard for drivers
    renderDashboardPassengers() {
        const container = document.getElementById('dashboard-passengers-list');
        const myPassengers = this.allRequests.filter(
            r => r.driverEmail === this.currentUser.email &&
            (r.status === 'approved' || r.status === 'confirmed')
        );

        // Update badge
        const badge = document.getElementById('dashboard-passengers-badge');
        if (myPassengers.length > 0) {
            badge.textContent = myPassengers.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        if (!myPassengers || myPassengers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>No passengers yet</h3>
                    <p>Approved passengers will appear here</p>
                </div>
            `;
            return;
        }

        const totalSeats = myPassengers.reduce((sum, r) => sum + (parseInt(r.seatsRequested) || 0), 0);

        container.innerHTML = `
            <div class="info-box" style="margin-bottom: 1rem;">
                <p style="text-align: center; margin: 0;">
                    <strong>${myPassengers.length}</strong> passenger(s) • <strong>${totalSeats}</strong> seat(s) booked
                </p>
            </div>
        ` + myPassengers.map(request => {
            const passenger = this.allUsers.find(u => u.email === request.passengerEmail) || {};
            return `
                <div class="request-card">
                    <div class="request-card-header">
                        <h4>${passenger.name || request.passengerEmail}</h4>
                        <span class="request-status status-${request.status}">${request.status}</span>
                    </div>
                    <div class="request-card-details">
                        <p>🎫 Seats: <strong>${request.seatsRequested}</strong></p>
                        <p>✉️ ${request.passengerEmail}</p>
                        ${passenger.phone ? `<p>📞 ${passenger.phone}</p>` : ''}
                    </div>
                    <div class="request-card-actions">
                        <button class="btn btn-secondary btn-small" onclick="App.showContactModal('${request.passengerEmail}')">📞 Contact</button>
                        <button class="btn btn-danger btn-small" onclick="App.removePassengerFromDashboard('${request.id}', '${(passenger.name || request.passengerEmail).replace(/'/g, "\\'")}')">Remove</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Remove passenger from dashboard view
    async removePassengerFromDashboard(requestId, passengerName) {
        if (!confirm(`⚠️ IMPORTANT: Please contact ${passengerName} first to inform them.\n\nAre you sure you want to remove ${passengerName} from your car? They will need to request again.`)) return;

        this.showLoading();

        try {
            await API.requests.delete(requestId);
            await this.loadDashboardData();
            this.showToast('Passenger removed. Please contact them to inform.', 'success');
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Render vehicles list
    renderVehicles() {
        const container = document.getElementById('vehicles-list');

        const activeVehicles = this.allVehicles.filter(v => v.status !== 'not-bringing');

        if (!activeVehicles || activeVehicles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚗</div>
                    <h3>No vehicles available</h3>
                    <p>Be the first to register your vehicle!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activeVehicles.map(vehicle => {
            const driver = this.allUsers.find(u => u.email === vehicle.driverEmail) || {};
            const approvedRequests = this.allRequests.filter(
                r => r.driverEmail === vehicle.driverEmail &&
                (r.status === 'approved' || r.status === 'confirmed')
            );
            const assignedSeats = approvedRequests.reduce((sum, r) => sum + (parseInt(r.seatsRequested) || 0), 0);
            const availableSeats = Math.max(0, vehicle.totalSeats - vehicle.familyMembers - assignedSeats);

            const isOwnVehicle = vehicle.driverEmail === this.currentUser.email;
            const existingRequest = this.allRequests.find(
                r => r.passengerEmail === this.currentUser.email && r.driverEmail === vehicle.driverEmail
            );

            // Calculate remaining seats needed for passenger
            const remainingSeatsNeeded = this.currentRole === 'passenger' ? this.getRemainingSeatsNeeded() : 0;
            const allSeatsBooked = remainingSeatsNeeded === 0 && this.currentRole === 'passenger';

            const initials = (driver.name || driver.email || 'D').substring(0, 2).toUpperCase();

            // Determine button state and text
            let buttonDisabled = false;
            let buttonText = '🎫 Request';

            if (existingRequest) {
                if (existingRequest.status === 'approved' || existingRequest.status === 'confirmed') {
                    buttonText = '✓ Approved';
                    buttonDisabled = true;
                } else if (existingRequest.status === 'pending') {
                    buttonText = '⏳ Pending';
                    buttonDisabled = true;
                } else if (existingRequest.status === 'rejected') {
                    buttonDisabled = false; // Can request again after rejection
                }
            } else if (allSeatsBooked) {
                buttonText = '✓ All Booked';
                buttonDisabled = true;
            } else if (availableSeats === 0 || vehicle.status === 'full') {
                buttonDisabled = true;
            }

            return `
                <div class="vehicle-card">
                    <div class="vehicle-card-header">
                        <div class="vehicle-card-driver">
                            <div class="driver-avatar">${initials}</div>
                            <div class="driver-info">
                                <h4>${driver.name || vehicle.driverEmail}</h4>
                                <p>${vehicle.vehicleType || 'Vehicle'}</p>
                            </div>
                        </div>
                        <span class="status-badge status-${vehicle.status === 'open' ? 'open' : 'full'}">
                            ${vehicle.status === 'open' ? 'Open' : 'Full'}
                        </span>
                    </div>
                    <div class="vehicle-card-stats">
                        <div class="stat-item">
                            <span class="stat-value">${vehicle.totalSeats}</span>
                            <span class="stat-label">Total</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${vehicle.familyMembers}</span>
                            <span class="stat-label">Family</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${availableSeats}</span>
                            <span class="stat-label">Available</span>
                        </div>
                    </div>
                    <div class="vehicle-card-actions">
                        <button class="btn btn-secondary btn-small" onclick="App.showContactModal('${vehicle.driverEmail}')">
                            📞 Contact
                        </button>
                        ${!isOwnVehicle && this.currentRole === 'passenger' ? `
                            <button class="btn btn-primary btn-small"
                                ${buttonDisabled ? 'disabled' : ''}
                                onclick="App.showRequestModal('${vehicle.driverEmail}', '${(driver.name || vehicle.driverEmail).replace(/'/g, "\\'")}', ${availableSeats})">
                                ${buttonText}
                            </button>
                        ` : ''}
                        ${isOwnVehicle ? '<span class="btn btn-ghost btn-small">Your vehicle</span>' : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    // Render my requests
    renderMyRequests() {
        const container = document.getElementById('requests-list');
        // Show different requests based on role
        // Drivers see incoming pending/rejected requests, passengers see all outgoing requests
        const myRequests = this.currentRole === 'driver'
            ? this.allRequests.filter(r => r.driverEmail === this.currentUser.email && (r.status === 'pending' || r.status === 'rejected'))
            : this.allRequests.filter(r => r.passengerEmail === this.currentUser.email);

        // Update badge (for drivers, show only pending count)
        const badge = document.getElementById('requests-badge');
        const badgeCount = this.currentRole === 'driver'
            ? myRequests.filter(r => r.status === 'pending').length
            : myRequests.length;

        if (badgeCount > 0) {
            badge.textContent = badgeCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        if (!myRequests || myRequests.length === 0) {
            const emptyMessage = this.currentRole === 'driver'
                ? '<p>Seat requests from passengers will appear here</p>'
                : '<p>Request a seat from any available vehicle</p>';
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>No requests yet</h3>
                    ${emptyMessage}
                </div>
            `;
            return;
        }

        // Render differently for drivers vs passengers
        if (this.currentRole === 'driver') {
            // Driver view: show incoming requests from passengers
            container.innerHTML = myRequests.map(request => {
                const passenger = this.allUsers.find(u => u.email === request.passengerEmail) || {};
                return `
                    <div class="request-card">
                        <div class="request-card-header">
                            <h4>${passenger.name || request.passengerEmail}</h4>
                            <span class="request-status status-${request.status}">${request.status}</span>
                        </div>
                        <div class="request-card-details">
                            <p>🎫 Seats requested: <strong>${request.seatsRequested}</strong></p>
                            <p>✉️ ${request.passengerEmail}</p>
                            ${passenger.phone ? `<p>📞 ${passenger.phone}</p>` : ''}
                        </div>
                        ${request.status === 'pending' ? `
                            <div class="request-card-actions">
                                <button class="btn btn-danger btn-small" onclick="App.updateRequestStatus('${request.id}', 'rejected')">Decline</button>
                                <button class="btn btn-success btn-small" onclick="App.updateRequestStatus('${request.id}', 'approved')">Approve</button>
                            </div>
                        ` : ''}
                        ${request.status === 'rejected' ? `
                            <div class="request-card-actions">
                                <button class="btn btn-secondary btn-small" onclick="App.deleteDriverRequest('${request.id}')">Remove</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        } else {
            // Passenger view: show outgoing requests to drivers
            container.innerHTML = myRequests.map(request => {
                const driver = this.allUsers.find(u => u.email === request.driverEmail) || {};
                const vehicle = this.allVehicles.find(v => v.driverEmail === request.driverEmail) || {};
                return `
                    <div class="request-card">
                        <div class="request-card-header">
                            <h4>${driver.name || request.driverEmail}</h4>
                            <span class="request-status status-${request.status}">${request.status}</span>
                        </div>
                        <div class="request-card-details">
                            <p>🎫 Seats requested: <strong>${request.seatsRequested}</strong></p>
                            ${vehicle.vehicleType ? `<p>🚗 Vehicle: <strong>${vehicle.vehicleType}</strong></p>` : ''}
                            ${request.status === 'approved' ? `<p>✅ You're confirmed for this ride!</p>` : ''}
                        </div>
                        ${request.status === 'pending' ? `
                            <div class="request-card-actions">
                                <button class="btn btn-danger btn-small" onclick="App.cancelRequest('${request.id}')">
                                    Cancel Request
                                </button>
                            </div>
                        ` : ''}
                        ${request.status === 'approved' || request.status === 'confirmed' ? `
                            <div class="request-card-actions">
                                <button class="btn btn-secondary btn-small" onclick="App.showContactModal('${request.driverEmail}')">
                                    📞 Contact Driver
                                </button>
                                <button class="btn btn-danger btn-small" onclick="App.leaveRide('${request.id}', '${(driver.name || request.driverEmail).replace(/'/g, "\\'")}')">
                                    Leave Ride
                                </button>
                            </div>
                        ` : ''}
                        ${request.status === 'rejected' ? `
                            <div class="request-card-actions">
                                <button class="btn btn-secondary btn-small" onclick="App.cancelRequest('${request.id}')">
                                    Remove
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
    },

    // Delete rejected request (driver removes from list)
    async deleteDriverRequest(requestId) {
        this.showLoading();

        try {
            await API.requests.delete(requestId);
            await this.loadDashboardData();
            this.showToast('Request removed', 'success');
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Leave a ride (passenger cancels approved request)
    async leaveRide(requestId, driverName) {
        if (!confirm(`⚠️ IMPORTANT: Please contact ${driverName} first to inform them.\n\nAre you sure you want to leave ${driverName}'s ride? You can request another ride after.`)) return;

        this.showLoading();

        try {
            await API.requests.delete(requestId);
            await this.loadDashboardData();
            this.showToast('You left the ride. Please contact the driver to inform them.', 'success');
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Show contact modal
    showContactModal(email) {
        const user = this.allUsers.find(u => u.email === email) || {};

        document.getElementById('contact-name').textContent = user.name || 'Not provided';
        document.getElementById('contact-email').textContent = email;
        document.getElementById('contact-phone').textContent = user.phone || 'Not provided';

        document.getElementById('email-driver-btn').href = `mailto:${email}`;

        if (user.phone) {
            document.getElementById('call-driver-btn').href = `tel:${user.phone}`;
            document.getElementById('call-driver-btn').classList.remove('hidden');
        } else {
            document.getElementById('call-driver-btn').classList.add('hidden');
        }

        this.showModal('contact-modal');
    },

    // Calculate remaining seats needed for passenger
    getRemainingSeatsNeeded() {
        const totalNeeded = this.currentUser.seatsNeeded || 1;
        const myRequests = this.allRequests.filter(r =>
            r.passengerEmail === this.currentUser.email &&
            (r.status === 'pending' || r.status === 'approved' || r.status === 'confirmed')
        );
        const bookedSeats = myRequests.reduce((sum, r) => sum + (parseInt(r.seatsRequested) || 0), 0);
        return Math.max(0, totalNeeded - bookedSeats);
    },

    // Show request modal
    showRequestModal(driverEmail, driverName, availableSeats) {
        const remainingSeats = this.getRemainingSeatsNeeded();

        if (remainingSeats === 0) {
            this.showToast('You have already requested all your seats', 'error');
            return;
        }

        document.getElementById('modal-driver-name').textContent = driverName;
        document.getElementById('modal-available-seats').textContent = availableSeats;

        const maxSeats = Math.min(remainingSeats, availableSeats);
        document.getElementById('request-seats').max = maxSeats;
        document.getElementById('request-seats').value = maxSeats;
        document.getElementById('request-modal').dataset.driverEmail = driverEmail;

        // Add info about remaining seats
        const modalContent = document.querySelector('#request-modal .modal-content');
        let infoText = modalContent.querySelector('.remaining-seats-info');
        if (!infoText) {
            infoText = document.createElement('p');
            infoText.className = 'remaining-seats-info form-hint';
            infoText.style.marginTop = '0.5rem';
            modalContent.insertBefore(infoText, modalContent.querySelector('.modal-actions'));
        }
        infoText.textContent = `You need ${remainingSeats} more seat(s) out of ${this.currentUser.seatsNeeded || 1} total`;

        this.showModal('request-modal');
    },

    // Submit request
    async submitRequest() {
        const driverEmail = document.getElementById('request-modal').dataset.driverEmail;
        const seatsRequested = parseInt(document.getElementById('request-seats').value) || 1;

        this.hideModal('request-modal');
        this.showLoading();

        try {
            await API.requests.create({
                passengerEmail: this.currentUser.email,
                driverEmail,
                seatsRequested
            });
            await this.loadDashboardData();
            this.showToast('Request sent!', 'success');
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Cancel request
    async cancelRequest(requestId) {
        // Get request details to show driver name
        const request = this.allRequests.find(r => r.id === requestId);
        if (!request) return;

        const driver = this.allUsers.find(u => u.email === request.driverEmail) || {};
        const driverName = driver.name || request.driverEmail;

        if (!confirm(`⚠️ IMPORTANT: Please inform ${driverName} about canceling this request.\n\nAre you sure you want to cancel this request?`)) return;

        this.showLoading();

        try {
            await API.requests.delete(requestId);
            await this.loadDashboardData();
            this.showToast('Request cancelled. Please inform the driver.', 'success');
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Load admin data
    async loadAdminData() {
        try {
            const [users, vehicles, requests, summary] = await Promise.all([
                API.users.getAll(),
                API.vehicles.getAll(),
                API.requests.getAll(),
                API.getSummary()
            ]);

            this.allUsers = users || [];
            this.allVehicles = vehicles || [];
            this.allRequests = requests || [];

            this.renderAdminSummary(summary);
            this.renderAdminUsers();
            this.renderAdminVehicles();
            this.renderAdminAssignments();
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    },

    // Render admin summary
    renderAdminSummary(summary) {
        document.getElementById('total-people').textContent = summary.totalPeople || 0;
        document.getElementById('total-cars').textContent = summary.totalCars || 0;
        document.getElementById('total-seats-summary').textContent = summary.totalSeats || 0;
        document.getElementById('unassigned-passengers').textContent = summary.unassignedPassengers || 0;
    },

    // Render admin users list
    renderAdminUsers() {
        const container = document.getElementById('admin-users-list');

        if (!this.allUsers || this.allUsers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <h3>No users yet</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = this.allUsers.map(user => `
            <div class="user-card">
                <div class="user-card-header">
                    <h4>${user.name || user.email}</h4>
                    <span class="user-role">${user.role || 'No role'}</span>
                </div>
                <div class="user-card-details">
                    <p>✉️ ${user.email}</p>
                    ${user.phone ? `<p>📞 ${user.phone}</p>` : ''}
                    ${user.isAdmin ? '<p>⭐ Admin</p>' : ''}
                </div>
                <div class="request-card-actions">
                    <button class="btn btn-secondary btn-small" onclick="App.editUser('${user.email}')">
                        ✏️ Edit
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Render admin vehicles
    renderAdminVehicles() {
        const container = document.getElementById('admin-vehicles-list');

        if (!this.allVehicles || this.allVehicles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🚗</div>
                    <h3>No vehicles registered</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = this.allVehicles.map(vehicle => {
            const driver = this.allUsers.find(u => u.email === vehicle.driverEmail) || {};
            return `
                <div class="vehicle-card">
                    <div class="vehicle-card-header">
                        <div class="driver-info">
                            <h4>${driver.name || vehicle.driverEmail}</h4>
                            <p>${vehicle.vehicleType || 'Vehicle'}</p>
                        </div>
                        <span class="status-badge status-${vehicle.status}">${vehicle.status}</span>
                    </div>
                    <div class="vehicle-card-stats">
                        <div class="stat-item">
                            <span class="stat-value">${vehicle.totalSeats}</span>
                            <span class="stat-label">Total</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${vehicle.familyMembers}</span>
                            <span class="stat-label">Family</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Render admin assignments
    renderAdminAssignments() {
        const container = document.getElementById('admin-assignments-list');
        const approvedRequests = this.allRequests.filter(r => r.status === 'approved' || r.status === 'confirmed');

        if (!approvedRequests || approvedRequests.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>No assignments yet</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = approvedRequests.map(request => {
            const passenger = this.allUsers.find(u => u.email === request.passengerEmail) || {};
            const driver = this.allUsers.find(u => u.email === request.driverEmail) || {};
            return `
                <div class="request-card">
                    <div class="request-card-header">
                        <h4>${passenger.name || request.passengerEmail}</h4>
                        <span class="request-status status-${request.status}">${request.status}</span>
                    </div>
                    <div class="request-card-details">
                        <p>🚗 Driver: ${driver.name || request.driverEmail}</p>
                        <p>🎫 Seats: ${request.seatsRequested}</p>
                    </div>
                    <div class="request-card-actions">
                        <button class="btn btn-danger btn-small" onclick="App.deleteAssignment('${request.id}')">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Edit user
    editUser(email) {
        const user = this.allUsers.find(u => u.email === email);
        if (!user) return;

        document.getElementById('edit-user-email').value = user.email;
        document.getElementById('edit-user-name').value = user.name || '';
        document.getElementById('edit-user-role').value = user.role || '';
        document.getElementById('edit-user-admin').checked = user.isAdmin || false;
        this.showModal('edit-user-modal');
    },

    // Save edit user
    async saveEditUser() {
        const email = document.getElementById('edit-user-email').value;
        const userData = {
            name: document.getElementById('edit-user-name').value,
            role: document.getElementById('edit-user-role').value,
            isAdmin: document.getElementById('edit-user-admin').checked
        };

        this.hideModal('edit-user-modal');
        this.showLoading();

        try {
            await API.users.update(email, userData);
            await this.loadAdminData();
            this.showToast('User updated', 'success');
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Delete user
    async deleteEditUser() {
        const email = document.getElementById('edit-user-email').value;
        if (!confirm(`Delete user ${email}?\nThis will also delete their vehicle and requests.`)) return;

        this.hideModal('edit-user-modal');
        this.showLoading();

        try {
            await API.users.delete(email);
            await this.loadAdminData();
            this.showToast('User deleted', 'success');
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Delete assignment
    async deleteAssignment(requestId) {
        if (!confirm('Remove this assignment?')) return;

        this.showLoading();

        try {
            await API.requests.delete(requestId);
            await this.loadAdminData();
            this.showToast('Assignment removed', 'success');
        } catch (error) {
            this.showToast('Error: ' + error.message, 'error');
        }

        this.hideLoading();
    },

    // Export to CSV
    exportCSV() {
        let csv = 'Email,Name,Phone,Role,Vehicle Type,Total Seats,Family Members,Status\n';

        this.allUsers.forEach(user => {
            const vehicle = this.allVehicles.find(v => v.driverEmail === user.email);
            csv += `"${user.email}","${user.name || ''}","${user.phone || ''}","${user.role || ''}",`;
            csv += `"${vehicle ? vehicle.vehicleType : ''}","${vehicle ? vehicle.totalSeats : ''}",`;
            csv += `"${vehicle ? vehicle.familyMembers : ''}","${vehicle ? vehicle.status : ''}"\n`;
        });

        this.downloadFile(csv, 'carpooling-data.csv', 'text/csv');
        this.showToast('CSV exported', 'success');
    },

    // Export to PDF
    exportPDF() {
        let html = `
            <html>
            <head>
                <title>Carpooling Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; color: #6366F1; }
                    h2 { color: #4F46E5; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px; }
                    .summary { display: flex; justify-content: space-around; margin: 20px 0; }
                    .summary-box { text-align: center; padding: 15px; background: #F8FAFC; border-radius: 8px; }
                    .summary-value { font-size: 24px; font-weight: bold; color: #6366F1; }
                    .summary-label { font-size: 12px; color: #64748B; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #E2E8F0; padding: 10px; text-align: left; }
                    th { background-color: #6366F1; color: white; }
                    tr:nth-child(even) { background-color: #F8FAFC; }
                </style>
            </head>
            <body>
                <h1>🚗 Office Trip Carpooling Report</h1>

                <h2>Summary</h2>
                <div class="summary">
                    <div class="summary-box">
                        <div class="summary-value">${document.getElementById('total-people').textContent}</div>
                        <div class="summary-label">Total People</div>
                    </div>
                    <div class="summary-box">
                        <div class="summary-value">${document.getElementById('total-cars').textContent}</div>
                        <div class="summary-label">Vehicles</div>
                    </div>
                    <div class="summary-box">
                        <div class="summary-value">${document.getElementById('total-seats-summary').textContent}</div>
                        <div class="summary-label">Total Seats</div>
                    </div>
                    <div class="summary-box">
                        <div class="summary-value">${document.getElementById('unassigned-passengers').textContent}</div>
                        <div class="summary-label">Unassigned</div>
                    </div>
                </div>

                <h2>Users & Vehicles</h2>
                <table>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Vehicle</th><th>Seats</th></tr>
                    ${this.allUsers.map(u => {
                        const v = this.allVehicles.find(veh => veh.driverEmail === u.email);
                        return `<tr>
                            <td>${u.name || '-'}</td>
                            <td>${u.email}</td>
                            <td>${u.role || '-'}</td>
                            <td>${v ? v.vehicleType : '-'}</td>
                            <td>${v ? v.totalSeats : '-'}</td>
                        </tr>`;
                    }).join('')}
                </table>

                <h2>Seat Assignments</h2>
                <table>
                    <tr><th>Passenger</th><th>Driver</th><th>Seats</th><th>Status</th></tr>
                    ${this.allRequests.filter(r => r.status === 'approved' || r.status === 'confirmed').map(r => {
                        const p = this.allUsers.find(u => u.email === r.passengerEmail) || {};
                        const d = this.allUsers.find(u => u.email === r.driverEmail) || {};
                        return `<tr>
                            <td>${p.name || r.passengerEmail}</td>
                            <td>${d.name || r.driverEmail}</td>
                            <td>${r.seatsRequested}</td>
                            <td>${r.status}</td>
                        </tr>`;
                    }).join('')}
                </table>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    },

    // Download file helper
    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    // Handle tab click
    handleTabClick(e) {
        const tabName = e.target.dataset.tab;
        if (!tabName) return;

        const tabContainer = e.target.closest('.screen');

        tabContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        tabContainer.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        const tabContent = document.getElementById(`${tabName}-tab`);
        if (tabContent) tabContent.classList.remove('hidden');
    },

    // Screen navigation
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(screenId).classList.remove('hidden');
    },

    showLoginScreen() {
        this.showScreen('login-screen');
    },

    showRoleScreen() {
        const adminCard = document.getElementById('admin-role-card');
        if (this.currentUser && this.currentUser.isAdmin) {
            adminCard.classList.remove('hidden');
        } else {
            adminCard.classList.add('hidden');
        }
        this.showScreen('role-screen');
    },

    // Modal helpers
    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    },

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },

    // Loading helpers
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    },

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    },

    // Toast notification
    showToast(message, type = '') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast ' + type;
        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    },

    // Validate email
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
