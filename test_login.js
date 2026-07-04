const axios = require('axios');

async function login() {
  try {
    const res = await axios.post('https://hustle-os-ten.vercel.app/api/auth/login', {
      email: 'rahul@example.com', // Fake or real email doesn't matter, we want to see if it hangs
      password: 'password123'
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.status : err.message);
    if (err.response) {
      console.error(err.response.data);
    }
  }
}
login();
