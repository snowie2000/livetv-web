import axios, { Axios } from "axios";
import jsCookie from "js-cookie"
import { history } from "umi";

export const api = new Axios({
    timeout: 10000,
    baseURL: "/api",
    withCredentials: true,
})

api.interceptors.request.use(config => {
    //单文件转换formData
    if (config.headers["Content-Type"] === "multipart/form-data") {
        let form = new FormData();
        for (let key in config.data) {
            if (config.data[key] !== undefined && config.data[key] !== null)
                form.append(key, config.data[key]);
        }
        config.data = form
    }
    if (config.headers["Content-Type"] === "application/x-www-form-urlencoded") {
        let search = new URLSearchParams()
        for (let key in config.data) {
            if (config.data[key] !== undefined && config.data[key] !== null)
                search.set(key, config.data[key]);
        }
        config.data = search
    }
    return config;
}, error => {
    console.log(error);
    Promise.reject(error);
});

api.interceptors.response.use(// Success function
    (response) => {
        // Check if status code is 200
        switch (response.status) {
            case 200:
                break
            case 401: {
                history.replace("/login")
            }
            default: {
                return Promise.reject(response)
            }
        }

        // Return the original response data
        return response;
    },
    // Error function (optional)
    (error) => {
        // Handle common errors here, e.g., network issues
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API Error:', error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Network Error:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error:', error.message);
        }

        // Re-throw the error to be handled upstream
        return Promise.reject(error);
    })


function parseCookie(cookieString: string) {
    if (!cookieString) {
        return [];
    }

    const parts = cookieString.split(';');
    const cookie = [] as { key: string, value: string }[];

    for (const part of parts) {
        const [key, value] = part.trim().split('=');
        cookie.push({ key, value })
    }

    return cookie;
}