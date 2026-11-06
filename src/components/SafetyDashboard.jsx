import React, { useState, useEffect, useMemo } from 'react';
import { getValidToken } from '../services/googleAuth';
import { GOOGLE_CONFIG } from '../config/google';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#29A9E0', '#3DAA72', '#FAB931', '#F05731', '#353750', '#9B51E0', '#2D9CDB', '#F2C94C', '#EB5757', '#27AE60'];

function SpreadsheetDashboard({ spreadsheetId, title }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Use Apps Script backend instead of direct Google API
        // This avoids needing the scary "spreadsheets" permission
        const URL = GOOGLE_CONFIG.APPS_SCRIPT_URL;
        if (!URL) throw new Error('Apps Script URL is not configured. Please set it up to view dashboards.');

        const res = await fetch(URL, {
          method: 'POST',
          body: JSON.stringify({
            action: 'readExternalSheet',
            externalSpreadsheetId: spreadsheetId
          })
        });

        if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);
        const result = await res.json();
        
        if (!result.success) throw new Error(result.error);
        
        const rows = result.data || [];
        if (rows.length === 0) throw new Error('Sheet is empty or no data found.');

        // Extract headers from the first object
        const parsedHeaders = Object.keys(rows[0] || {});
        setHeaders(parsedHeaders);
        setData(rows);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [spreadsheetId]);

  // Extract available months from the date column
  const availableMonths = useMemo(() => {
    if (!data.length || !headers.length) return [];
    
    // Find the date column (Timestamp, Tanggal, Date, etc.)
    const dateHeader = headers.find(h => 
      h.toLowerCase().includes('timestamp') || 
      h.toLowerCase().includes('tanggal') || 
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('waktu')
    );

    if (!dateHeader) return [];

    const months = new Set();
    data.forEach(row => {
      if (row[dateHeader]) {
        try {
          const dateStr = String(row[dateHeader]).trim();
          let d = new Date(dateStr);
          
          // Check for DD/MM/YYYY HH:mm:ss format
          const parts = dateStr.split(' ')[0].split('/');
          if (parts.length === 3 && parts[2].length === 4) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            d = new Date(year, month, day);
          }

          if (!isNaN(d.getTime())) {
            const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            months.add(monthStr);
            row._parsedMonth = monthStr;
            row._parsedDateObj = d;
          }
        } catch (e) {
          // ignore parsing errors
        }
      }
    });

    return Array.from(months).sort((a, b) => new Date(b) - new Date(a));
  }, [data, headers]);

  // Identify Department column and extract available departments
  const deptHeader = useMemo(() => {
    return headers.find(h => h.toLowerCase().includes('departemen') || h.toLowerCase().includes('department'));
  }, [headers]);

  const availableDepartments = useMemo(() => {
    if (!data.length || !deptHeader) return [];
    const depts = new Set();
    data.forEach(row => {
      let val = row[deptHeader] || 'Unknown/Blank';
      if (String(val).trim() === '') val = 'Unknown/Blank';
      depts.add(val);
    });
    return Array.from(depts).sort();
  }, [data, deptHeader]);

  // Apply filters (Month and Department)
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchMonth = selectedMonth === 'ALL' || row._parsedMonth === selectedMonth;
      
      let rowDept = row[deptHeader] || 'Unknown/Blank';
      if (String(rowDept).trim() === '') rowDept = 'Unknown/Blank';
      const matchDept = selectedDepartment === 'ALL' || rowDept === selectedDepartment;
      
      return matchMonth && matchDept;
    });
  }, [data, selectedMonth, selectedDepartment, deptHeader]);

  // Extract latest 3 findings for Communication Card
  const latestFindings = useMemo(() => {
    if (title !== 'Communication Card' || !data.length) return [];
    
    // Sort by the parsed date object
    const sortedData = [...data]
      .filter(row => row._parsedDateObj)
      .sort((a, b) => b._parsedDateObj - a._parsedDateObj);

    return sortedData.slice(0, 3);
  }, [data, title]);

  // Top Contributors Chart logic
  const topContributorsChart = useMemo(() => {
    if (!filteredData.length || !headers.length) return null;
    
    // Find the name column
    const nameHeader = headers.find(h => {
      const low = h.toLowerCase();
      return low === 'nama' || low.includes('nama lengkap') || low === 'name' || low.includes('auditor');
    });
    if (!nameHeader) return null;

    const counts = {};
    filteredData.forEach(row => {
      let val = row[nameHeader] || 'Unknown';
      if (String(val).trim() === '') val = 'Unknown';
      counts[val] = (counts[val] || 0) + 1;
    });

    const chartData = Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value).slice(0, 10); // Show top 10

    return { header: 'Top Contributors', chartData, isNameChart: true };
  }, [filteredData, headers]);

  // Analyze columns to find categorical data for other charts
  const chartsData = useMemo(() => {
    if (!filteredData.length || !headers.length) return [];

    const categoricalColumns = [];
    headers.forEach(header => {
      // Skip obvious non-categorical columns and the name column (already handled)
      if (header.toLowerCase().includes('timestamp') || header.toLowerCase().includes('id') || header.toLowerCase().includes('nama') || header.toLowerCase().includes('name') || header.toLowerCase().includes('email')) {
        return;
      }

      const uniqueValues = new Set();
      filteredData.forEach(row => {
        if (row[header] && String(row[header]).trim() !== '') {
          uniqueValues.add(row[header]);
        }
      });
      
      // If it's a good categorical column
      if (uniqueValues.size > 1 && uniqueValues.size <= 20) {
        const counts = {};
        filteredData.forEach(row => {
          let val = row[header] || 'Unknown/Blank';
          if (String(val).trim() === '') val = 'Unknown/Blank';
          counts[val] = (counts[val] || 0) + 1;
        });
        
        const chartData = Object.keys(counts).map(key => ({
          name: key,
          value: counts[key]
        })).sort((a, b) => b.value - a.value);

        categoricalColumns.push({ header, chartData, isNameChart: false });
      }
    });

    // Combine top contributors with the rest, limit total charts
    const combined = [];
    if (topContributorsChart) combined.push(topContributorsChart);
    return combined.concat(categoricalColumns).slice(0, 4); // Show top 4 charts overall
  }, [filteredData, headers, topContributorsChart]);

  // Trend Chart Data
  const trendChartData = useMemo(() => {
    if (!filteredData.length || !headers.length) return null;

    const nameHeader = headers.find(h => {
      const low = h.toLowerCase();
      return low === 'nama' || low.includes('nama lengkap') || low === 'name' || low.includes('auditor');
    });
    
    const trendMap = {}; 
    const isMonthly = selectedMonth === 'ALL';

    filteredData.forEach(row => {
      let periodKey = 'Unknown';
      if (isMonthly) {
        periodKey = row._parsedMonth || 'Unknown';
      } else {
        if (row._parsedDateObj) {
          // Format as DD MMM YYYY for daily trend
          periodKey = row._parsedDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } else {
          periodKey = 'Unknown Date';
        }
      }

      if (!trendMap[periodKey]) {
        trendMap[periodKey] = { total: 0, uniqueNames: new Set(), dateObj: row._parsedDateObj };
      }
      
      trendMap[periodKey].total += 1;
      
      let nameVal = 'Unknown';
      if (nameHeader) {
         nameVal = row[nameHeader] || 'Unknown';
         if (String(nameVal).trim() === '') nameVal = 'Unknown';
      }
      trendMap[periodKey].uniqueNames.add(nameVal);
    });

    const chartData = Object.keys(trendMap).map(key => {
      return {
        period: key,
        total: trendMap[key].total,
        unique: trendMap[key].uniqueNames.size,
        dateObj: trendMap[key].dateObj
      };
    });

    // Sort chronologically
    chartData.sort((a, b) => {
      if (!a.dateObj && !b.dateObj) return 0;
      if (!a.dateObj) return -1;
      if (!b.dateObj) return 1;
      return a.dateObj - b.dateObj;
    });

    return {
       title: isMonthly ? 'Monthly Submission Trend' : 'Daily Submission Trend',
        data: chartData
     };
  }, [filteredData, headers, selectedMonth]);

  // Headers to display in the table
  const displayHeaders = useMemo(() => {
    if (title === 'Communication Card') {
      const allowed = [
        'Nama Lengkap Anda',
        'Nama Perusahaan',
        'Departemen',
        'Tanggal temuan',
        'Waktu temuan',
        'Lokasi temuan',
        'Kategori temuan',
        'Jelaskan secara singkat temuan Anda',
        'Apa tindakan langsung yang Anda lakukan untuk meresponnya?',
        'Silakan unggah disini foto temuan Anda',
        'Apakah temuan ini telah diselesaikan?',
        'Silakan unggah disini foto penyelesaian masalah dalam temuan Anda'
      ].map(h => h.toLowerCase().trim());

      return headers.filter(h => allowed.includes(h.toLowerCase().trim()));
    }
    return headers;
  }, [headers, title]);

  const renderTableCell = (value) => {
    const strVal = String(value || '');
    if (strVal.match(/^https?:\/\//i)) {
      if (strVal.match(/\.(jpeg|jpg|gif|png)$/i) || strVal.includes('drive.google.com') || strVal.includes('googleusercontent.com')) {
        // Try to get a proper image preview if it's drive, otherwise just a link with icon
        let thumbUrl = strVal;
        if (strVal.includes('drive.google.com/file/d/')) {
          const match = strVal.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
             thumbUrl = `https://lh3.googleusercontent.com/d/${match[1]}`;
          }
        } else if (strVal.includes('drive.google.com/open?id=')) {
          const match = strVal.match(/id=([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
             thumbUrl = `https://lh3.googleusercontent.com/d/${match[1]}`;
          }
        }
        
        return (
          <button
            type="button"
            onClick={() => setActiveImage({ src: thumbUrl, original: strVal })}
            className="flex items-center gap-2 text-[#29A9E0] hover:text-blue-800 transition-colors group text-left border-none bg-transparent cursor-pointer"
          >
            <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
              <img src={thumbUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform" onError={(e) => { e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E"; }} />
            </div>
            <span className="font-medium underline decoration-transparent group-hover:decoration-current">View Photo</span>
          </button>
        );
      }
      return (
        <a href={strVal} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">link</span>
          Open Link
        </a>
      );
    }
    return strVal;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined text-[#F05731] text-4xl animate-spin mb-4">autorenew</span>
        <h2 className="text-[#353750] font-bold uppercase tracking-widest text-sm">Loading Data...</h2>
        <p className="text-[#6B6E8A] text-xs mt-2">Connecting to Google Spreadsheet</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex flex-col items-center text-center max-w-lg mx-auto mt-10">
          <span className="material-symbols-outlined text-4xl mb-2">error</span>
          <h2 className="font-bold text-lg mb-1">Access Error</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header & Filter */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-bold text-[#353750] uppercase text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F05731] text-2xl">insert_chart</span>
            {title} Data
          </h2>
          <p className="text-sm text-[#6B6E8A] mt-1">Live data feed</p>
        </div>

        <div className="flex flex-wrap gap-4">
          {availableDepartments.length > 0 && (
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#6B6E8A] uppercase tracking-wider mb-1">Filter By Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-4 py-2 bg-white border border-[#E0E0EC] rounded-lg text-sm font-bold text-[#353750] shadow-sm hover:border-gray-400 focus:outline-none transition-colors max-w-[200px]"
              >
                <option value="ALL">All Departments</option>
                {availableDepartments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {availableMonths.length > 0 && (
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#6B6E8A] uppercase tracking-wider mb-1">Filter By Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-white border border-[#E0E0EC] rounded-lg text-sm font-bold text-[#353750] shadow-sm hover:border-gray-400 focus:outline-none transition-colors"
              >
                <option value="ALL">All Time</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Latest 3 Findings (Only for Communication Card) */}
      {title === 'Communication Card' && latestFindings.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[#353750] font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-sm">notifications_active</span>
            Latest Submissions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestFindings.map((finding, idx) => {
              // Try to intelligently find the requested columns based on typical indonesian headers
              const timestampHeader = headers.find(h => h.toLowerCase().includes('timestamp') || h.toLowerCase().includes('waktu') || h.toLowerCase().includes('tanggal'));
              const nameHeader = headers.find(h => h.toLowerCase().includes('nama'));
              const locationHeader = headers.find(h => h.toLowerCase().includes('lokasi'));
              const descHeader = headers.find(h => h.toLowerCase().includes('jelaskan') || h.toLowerCase().includes('penjelasan') || h.toLowerCase().includes('deskripsi'));

              const dateStr = finding[timestampHeader] || 'Unknown Date';
              const parts = dateStr.split(' ');
              const datePart = parts[0] || '';
              const timePart = parts[1] || '';

              return (
                <div key={idx} className="bg-[#FFF4E5] border border-[#FFE0B2] p-4 rounded-xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#FF9800] text-white text-[8px] font-bold px-2 py-1 rounded-bl-lg">NEW</div>
                  <div className="flex justify-between items-center text-[#E65100]">
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {datePart}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {timePart}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm font-bold text-[#353750] mt-1 border-b border-[#FFE0B2] pb-2">
                    <div className="w-6 h-6 bg-[#E65100] text-white rounded-full flex items-center justify-center text-[10px]">
                      {(finding[nameHeader] || 'U').slice(0, 2).toUpperCase()}
                    </div>
                    {finding[nameHeader] || 'Unknown User'}
                  </div>

                  <div className="text-xs font-bold text-[#6B6E8A] mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {finding[locationHeader] || 'Unknown Location'}
                  </div>

                  <div className="text-sm text-[#353750] mt-1 line-clamp-3 italic">
                    "{finding[descHeader] || 'No description provided.'}"
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trend Chart */}
      {trendChartData && trendChartData.data.length > 0 && (
        <div className="bg-white border border-[#E0E0EC] rounded-xl shadow-sm p-4 mb-8">
          <h3 className="text-[#353750] font-bold text-sm uppercase tracking-wider mb-4 border-b border-[#E0E0EC] pb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#29A9E0] text-lg">trending_up</span>
            {trendChartData.title}
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendChartData.data} margin={{ top: 5, right: 30, left: 0, bottom: 30 }}>
                <XAxis dataKey="period" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip cursor={{ fill: '#F4F4F6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} verticalAlign="top" height={36}/>
                <Bar dataKey="total" fill="#29A9E0" name="Total Submissions" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unique" fill="#F05731" name="Unique Submissions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Auto-Generated Charts */}
      {chartsData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {chartsData.map((col, idx) => (
            <div key={col.header} className="bg-white border border-[#E0E0EC] rounded-xl shadow-sm p-4 flex flex-col">
              <h3 className="text-[#353750] font-bold text-sm uppercase tracking-wider mb-4 border-b border-[#E0E0EC] pb-2 flex items-center gap-2">
                {col.isNameChart ? <span className="material-symbols-outlined text-[#F05731] text-lg">groups</span> : null}
                {col.header} {col.isNameChart ? 'Breakdown' : 'Breakdown'}
              </h3>
              <div className="h-64 w-full">
                {idx % 2 === 0 || col.isNameChart ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={col.chartData} margin={{ top: 5, right: 30, left: 0, bottom: 30 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-45} textAnchor="end" height={60} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip cursor={{ fill: '#F4F4F6' }} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="#29A9E0" radius={[4, 4, 0, 0]} name="Count">
                        {col.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={col.chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {col.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Raw Data Table */}
      <div className="bg-white border border-[#E0E0EC] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#E0E0EC] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F05731]">table_chart</span>
          <h3 className="text-[#353750] font-bold text-sm uppercase tracking-wider">Recent Submissions ({filteredData.length})</h3>
        </div>
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs text-[#353750] whitespace-nowrap">
            <thead className="bg-[#F4F4F6] sticky top-0 shadow-sm z-10">
              <tr>
                {displayHeaders.map(h => (
                  <th key={h} className="px-4 py-3 font-bold uppercase tracking-wider border-b border-[#E0E0EC]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0E0EC]">
              {filteredData.slice().reverse().slice(0, 100).map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F9F9FB] transition-colors">
                  {displayHeaders.map(h => (
                    <td key={h} className="px-4 py-3 max-w-[300px]">
                      {renderTableCell(row[h])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Modal Popup */}
      {activeImage && (
        <div 
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-all"
          onClick={() => setActiveImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl p-2 flex flex-col" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveImage(null)} 
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 flex items-center justify-center transition-colors z-10"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
            
            <img 
              src={activeImage.src} 
              alt="Audit Finding" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-inner" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";
              }}
            />
            
            <div className="flex justify-between items-center px-4 py-2 mt-2">
              <span className="text-xs text-gray-500">Image Preview</span>
              <a 
                href={activeImage.original} 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-[#29A9E0] hover:underline flex items-center gap-1 font-bold"
              >
                <span className="material-symbols-outlined text-xs">open_in_new</span>
                Open original in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SafetyDashboard() {
  const [activeTab, setActiveTab] = useState('LSR');

  const DASHBOARDS = [
    {
      id: 'LSR',
      title: 'Life Saving Rules',
      spreadsheetId: '1_q3qYuSkI50i0pqBnG9H0yU5c4Nu-SM5bKcmvG-VqLQ'
    },
    {
      id: 'COMM_CARD',
      title: 'Communication Card',
      spreadsheetId: '1MDSs0T_jgodb7hhGqfhgYgzcIykue59HG_RY7zQIRHk'
    }
  ];

  const currentDashboard = DASHBOARDS.find(d => d.id === activeTab);

  return (
    <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto pb-32 w-full" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-bold text-[#353750] uppercase text-xl md:text-2xl flex items-center gap-2">
          <span className="material-symbols-outlined text-[#F05731] text-3xl">health_and_safety</span>
          Safety Dashboards
        </h1>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-[#E0E0EC] pb-4">
        {DASHBOARDS.map(dashboard => (
          <button
            key={dashboard.id}
            onClick={() => setActiveTab(dashboard.id)}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider transition-colors ${
              activeTab === dashboard.id
                ? 'bg-[#353750] text-white'
                : 'bg-white text-[#6B6E8A] border border-[#E0E0EC] hover:bg-[#F4F4F6]'
            }`}
          >
            {dashboard.title}
          </button>
        ))}
      </div>

      {/* Render Active Dashboard */}
      <SpreadsheetDashboard
        key={currentDashboard.id} // Important: force remount when tab changes so state resets
        spreadsheetId={currentDashboard.spreadsheetId}
        title={currentDashboard.title}
      />
    </div>
  );
}
