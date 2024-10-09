import React, { useState, useEffect } from 'react';
import axiosInstance from './axiosInstance';
import './index.css';
import Select from 'react-select';

const initialOutstanding = {};
const TOTAL_ALLOWED_DIFFERENCE = 10;

function App() {
  const [login, setLogin] = useState({ user: '', password: '' });
  const [form, setForm] = useState({ chequeDate: '', type: 'cheque', totalAmount: '', party: '' });
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [rows, setRows] = useState([{ bill_no: '', amount: '' }]);
  const [proceed, setProceed] = useState(false);
  const [filteredBills, setFilteredBills] = useState([]);
  const [outstanding, setOutstanding] = useState(initialOutstanding);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const storedOutstanding = localStorage.getItem('outstanding');
    if (storedOutstanding) {
      setOutstanding(JSON.parse(storedOutstanding));
    } else if (token) {
      fetchOutstandingBills();
    }
  }, [token]);

  const fetchOutstandingBills = async () => {
    try {
      const response = await axiosInstance.post('/outstanding');
      const fetchedOutstanding = response.data;
      setOutstanding(fetchedOutstanding);
      localStorage.setItem('outstanding', JSON.stringify(fetchedOutstanding));
    } catch (error) {
      alert('Failed to fetch outstanding bills');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      const fetchedUsers = response.data.map(user => ({
        value: user,
        label: user,
      }));
      setUsers(fetchedUsers);
    } catch (error) {
      alert('Failed to fetch users');
    }
  };

  const getCurrentTotal = () => {
    return rows.reduce((total, row) => (row.amount ? total + parseFloat(row.amount) : total), 0);
  };

  const isTotalValid = () => {
    const currentTotal = getCurrentTotal();
    return Math.abs(currentTotal - parseFloat(form.totalAmount)) <= TOTAL_ALLOWED_DIFFERENCE;
  };

  const isChequeDateValid = () => {
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const chequeDate = new Date(form.chequeDate);
    return chequeDate >= today && chequeDate <= sevenDaysFromNow;
  };

  
  const getBillOptions = (party) => {
    return outstanding[party] ? outstanding[party].map(bill => ({
      value: bill,
      label: bill,
    })) : [];
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosInstance.post('/login', login);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      await fetchOutstandingBills();
      alert('Logged in successfully!');
    } catch (error) {
      alert('Invalid credentials');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'party') {
      setFilteredBills(outstanding[value] || []);
      setRows([{ bill_no: '', amount: '' }]);
    }
  };

  const handleRowChange = (index, e) => {
    const { name, value } = e.target;
    const updatedRows = [...rows];
    updatedRows[index][name] = value;
    setRows(updatedRows);
  };

  const addRow = () => {
    const lastRow = rows[rows.length - 1];
    if (!lastRow.bill_no || !lastRow.amount) {
      alert('Please fill the last row before adding a new one');
      return;
    }
    setRows([...rows, { bill_no: '', amount: '' }]);
  };

  const removeEmptyRows = () => {
    setRows(rows.filter(row => row.amount));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    removeEmptyRows();
    
    if (!isTotalValid()) {
      alert('The total of bill amounts does not match the cheque total.');
      return;
    }

    try {
      await axiosInstance.post('/add-data', { ...form, bills: rows });
      alert('Data submitted successfully');
      setRows([{ bill_no: '', amount: '' }]);
      setProceed(false);
      setForm({ chequeDate: '', type: 'cheque', totalAmount: '', party: '' });
      setFilteredBills([]);
    } catch (error) {
      alert('Failed to submit data');
    }
  };
 
  const handleProceed = () => {
    // Validate cheque date

    if (!isChequeDateValid()) {
      alert('Cheque date must be today or within the next 7 days.');
      return;
    }

    form.chequeDate && form.totalAmount && form.party && setProceed(true); 
    // If valid, proceed with any other necessary actions
    setProceed(true); // Set proceed state to true to show the next form or section
  };

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure to logout ?") ; 
    if (!confirmed) return ; 
 
    // Clear localStorage (token and outstanding data)
    localStorage.removeItem('token');
    localStorage.removeItem('outstanding');
  
    // Reset token state
    setToken('');
  
    // Clear outstanding data
    setOutstanding(initialOutstanding);
  
    // Clear form data (reset cheque/NEFT form and bills)
    setForm({ chequeDate: '', type: 'cheque', totalAmount: '', party: '' });
    setRows([{ billNumber: '', amount: '' }]);
    setProceed(false);
  
    alert('Logged out successfully!');
  };

  const currentBillTotal = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {!token ? (
        <div className="bg-white shadow-md rounded-lg p-6 w-96">
          <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
          <form className="space-y-4" onSubmit={handleLogin}>
            <Select
              options={users}
              onMenuOpen={fetchUsers} // Fetch users only when the dropdown is opened
              value={login.user ? { value: login.user, label: login.user } : null}
              onChange={(option) => setLogin({ ...login, user: option.value })}
              placeholder="Select User"
              className="w-full"
            />
            <input
              type="password"
              placeholder="Password"
              value={login.password}
              onChange={(e) => setLogin({ ...login, password: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md">
              Login
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6 w-96">
          {!proceed ? (
            <form className="space-y-4">
              <Select
                options={Object.keys(outstanding).map(party => ({
                  value: party,
                  label: party,
                }))}
                value={form.party ? { value: form.party, label: form.party } : null}
                onChange={(option) => handleFormChange({ target: { name: 'party', value: option.value } })}
                placeholder="Select Party"
                className="w-full"
              />
              <input
                type="number"
                name="totalAmount"
                placeholder="Total Amount"
                value={form.totalAmount}
                onChange={handleFormChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <select
                name="type"
                value={form.type}
                onChange={handleFormChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="cheque">Cheque</option>
                <option value="neft">NEFT</option>
              </select>
              <input
                type="date"
                name="chequeDate"
                value={form.chequeDate}
                onChange={handleFormChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <button
                type="button"
                onClick={handleProceed} 
                className="w-full bg-green-500 text-white p-2 rounded-md"
              >
                Proceed
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-red-500 text-white p-2 rounded-md"
              >
                Logout
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <p>Total Cheque Amount: {form.totalAmount}</p>
              <p>Current Total of Bills: {currentBillTotal}</p>
              {rows.map((row, index) => (
                <div key={index} className="flex space-x-4">
                  <Select
                    options={getBillOptions(form.party)}
                    value={row.bill_no ? { value: row.bill_no, label: row.bill_no } : null}
                    onChange={(option) => handleRowChange(index, { target: { name: 'bill_no', value: option.value } })}
                    placeholder="Bill No"
                    className="w-1/2"
                  />
                  <input
                    type="number"
                    name="amount"
                    value={row.amount}
                    onChange={(e) => handleRowChange(index, e)}
                    placeholder="Amount"
                    className="w-1/2 p-2 border border-gray-300 rounded-md"
                  />
                </div>
              ))}
              {isTotalValid() && (
                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md">
                  Submit
                </button>
              )}
              <button type="button" onClick={addRow} className="w-full bg-gray-500 text-white p-2 rounded-md">
                Add Row
              </button>
              <button
                type="button"
                onClick={() => setProceed(false)}
                className="w-full bg-yellow-500 text-white p-2 rounded-md"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-red-500 text-white p-2 rounded-md"
              >
                Logout
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
