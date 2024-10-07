import React, { useState } from 'react';
import axiosInstance from './axiosInstance'; // Import the Axios instance
import './index.css'; // Include your Tailwind CSS

function App() {
  const [login, setLogin] = useState({ user: '', password: '' });
  const [form, setForm] = useState({ billNumber: '', amount: '', type: 'cheque' });
  const [token, setToken] = useState('');


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/login', login);
      setToken(res.data.token); // This should trigger a re-render
      localStorage.setItem('token',res.data.token); // Store the token in local storage
      alert('Logged in successfully!');
    } catch (error) {
      console.log(error);
      alert('Invalid credentials');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/add-data', { 
        billNumber: form.billNumber, 
        amount: form.amount, 
        type: form.type 
      });
      alert('Data submitted successfully');
      setForm({ billNumber: '', amount: '', type: 'cheque' });
    } catch (error) {
      console.error('Error submitting data:', error); // Log error for debugging
      alert('Failed to submit data');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-96">
        <h1 className="text-2xl font-bold text-center mb-6">{localStorage.getItem('token') ? 'Submit Data' : 'Login'}</h1>
        {!token ? (
          <form className="space-y-4" onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="User"
              value={login.user}
              onChange={(e) => setLogin({ ...login, user: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={login.password}
              onChange={(e) => setLogin({ ...login, password: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition">
              Login
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Bill Number"
              value={form.billNumber}
              onChange={(e) => setForm({ ...form, billNumber: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cheque">Cheque</option>
              <option value="neft">NEFT</option>
            </select>
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition">
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;
