const config = {
    development: {
        apiUrl: 'http://localhost:3000/api'
    },
    production: {
        apiUrl: '/.netlify/functions/api'
    }
};

const environment = process.env.NODE_ENV || 'development';
export const apiUrl = config[environment].apiUrl;
