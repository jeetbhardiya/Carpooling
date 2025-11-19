// API layer for Google Sheets operations

const API = {
    // Make API request to Google Apps Script
    async request(action, params = {}) {
        const url = new URL(CONFIG.API_URL);
        url.searchParams.append('action', action);

        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'object') {
                url.searchParams.append(key, JSON.stringify(value));
            } else {
                url.searchParams.append(key, value);
            }
        }

        try {
            const response = await fetch(url.toString());
            const data = await response.json();

            if (data && data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // User operations
    users: {
        async get(email) {
            return API.request('getUser', { email });
        },

        async create(userData) {
            return API.request('createUser', { data: userData });
        },

        async update(email, userData) {
            return API.request('updateUser', { email, data: userData });
        },

        async delete(email) {
            return API.request('deleteUser', { email });
        },

        async getAll() {
            return API.request('getAllUsers');
        }
    },

    // Vehicle operations
    vehicles: {
        async get(driverEmail) {
            return API.request('getVehicle', { email: driverEmail });
        },

        async create(vehicleData) {
            return API.request('createVehicle', { data: vehicleData });
        },

        async update(driverEmail, vehicleData) {
            return API.request('updateVehicle', { email: driverEmail, data: vehicleData });
        },

        async delete(driverEmail) {
            return API.request('deleteVehicle', { email: driverEmail });
        },

        async getAll() {
            return API.request('getAllVehicles');
        }
    },

    // Request operations
    requests: {
        async create(requestData) {
            return API.request('createRequest', { data: requestData });
        },

        async update(id, requestData) {
            return API.request('updateRequest', { id, data: requestData });
        },

        async delete(id) {
            return API.request('deleteRequest', { id });
        },

        async getByPassenger(email) {
            return API.request('getRequestsByPassenger', { email });
        },

        async getByDriver(email) {
            return API.request('getRequestsByDriver', { email });
        },

        async getAll() {
            return API.request('getAllRequests');
        }
    },

    // Summary
    async getSummary() {
        return API.request('getSummary');
    }
};
